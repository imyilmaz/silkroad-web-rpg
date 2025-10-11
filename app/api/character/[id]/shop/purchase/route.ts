import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const INVENTORY_CAPACITY = 32;
const STACK_LIMIT = 50;
const STACKABLE_TYPES = new Set(["CONSUMABLE", "MATERIAL"]);

type RouteContext = {
  params: {
    id: string;
  };
};

type ShopActionRequest = {
  action?: "buy" | "sell";
  listingId?: number;
  inventoryItemId?: number;
  npcId?: number;
  quantity?: number;
};

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erişim.", 401);
  }

  const characterId = Number(params.id);
  if (!characterId || Number.isNaN(characterId)) {
    return errorResponse("Geçerli bir karakter kimliği gerekli.", 400);
  }

  const body = (await request.json()) as ShopActionRequest;
  const action = body.action ?? "buy";

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, gold: true },
  });

  if (!character) {
    return errorResponse(
      "Karakter bulunamadı veya bu kullanıcıya ait değil.",
      404,
    );
  }

  try {
    if (action === "sell") {
      if (!body.inventoryItemId) {
        return errorResponse("Satmak istediğiniz eşya seçilmedi.");
      }
      if (!body.npcId) {
        return errorResponse("Hangi NPC ile işlem yapılacağı belirtilmedi.");
      }
      const result = await handleSell(
        characterId,
        body.inventoryItemId,
        body.npcId,
        body.quantity,
      );
      return NextResponse.json({
        message: "Eşya satışı tamamlandı.",
        characterGold: result.gold,
        saleAmount: result.saleAmount,
      });
    }

    if (!body.listingId) {
      return errorResponse("Satın alma için bir liste seçmeniz gerekiyor.");
    }

    const result = await handleBuy(
      characterId,
      character.gold,
      body.listingId,
      body.quantity ?? 1,
    );

    return NextResponse.json({
      message: "Satın alma işlemi tamamlandı.",
      characterGold: result.gold,
    });
  } catch (transactionError) {
    if (
      transactionError instanceof Error &&
      transactionError.message === "INSUFFICIENT_GOLD"
    ) {
      return errorResponse("Bu işlem için yeterli altınınız yok.", 400);
    }

    if (
      transactionError instanceof Error &&
      transactionError.message === "INSUFFICIENT_STOCK"
    ) {
      return errorResponse("Yeterli stok bulunmuyor.", 400);
    }

    if (
      transactionError instanceof Error &&
      transactionError.message === "INVENTORY_FULL"
    ) {
      return errorResponse("Envanteriniz dolu.", 400);
    }

    if (
      transactionError instanceof Error &&
      transactionError.message === "STACK_LIMIT"
    ) {
      return errorResponse("Bu eşyadan en fazla 50 adet taşıyabilirsiniz.", 400);
    }

    if (
      transactionError instanceof Error &&
      transactionError.message === "STOCK_CHANGED"
    ) {
      return errorResponse(
        "Stok durumu güncellendi, lütfen tekrar deneyin.",
        409,
      );
    }

    if (
      transactionError instanceof Error &&
      transactionError.message === "ITEM_NOT_FOUND"
    ) {
      return errorResponse("Bu eşya envanterinizde bulunamadı.", 404);
    }

    if (
      transactionError instanceof Error &&
      transactionError.message === "ITEM_EQUIPPED"
    ) {
      return errorResponse("Takılı olan bir eşyayı satamazsınız.", 400);
    }

    console.error("Shop action error:", transactionError);
    return errorResponse("Mağaza işlemi sırasında bir hata oluştu.", 500);
  }
}

async function handleBuy(
  characterId: number,
  currentGold: number,
  listingId: number,
  requestedQuantity: number,
) {
  const listing = await prisma.shopListing.findUnique({
    where: { id: listingId },
    include: { item: true },
  });

  if (!listing) {
    throw new Error("STOCK_CHANGED");
  }

  const isStackable = STACKABLE_TYPES.has(listing.item.type);
  const quantity = isStackable
    ? Math.max(1, Math.min(requestedQuantity, STACK_LIMIT))
    : 1;

  if (listing.stock !== null && listing.stock < quantity) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  const totalCost = listing.price * quantity;
  if (totalCost > currentGold) {
    throw new Error("INSUFFICIENT_GOLD");
  }

  return prisma.$transaction(async (tx) => {
    if (listing.stock !== null) {
      const currentListing = await tx.shopListing.findUnique({
        where: { id: listingId },
        select: { stock: true },
      });

      if (!currentListing || currentListing.stock === null) {
        throw new Error("STOCK_CHANGED");
      }

      if (currentListing.stock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.shopListing.update({
        where: { id: listingId },
        data: { stock: currentListing.stock - quantity },
      });
    }

    let existingInventory = null;
    if (isStackable) {
      existingInventory = await tx.inventoryItem.findFirst({
        where: {
          characterId,
          itemId: listing.itemId,
          isEquipped: false,
        },
      });
    }

    if (existingInventory) {
      if (existingInventory.quantity + quantity > STACK_LIMIT) {
        throw new Error("STACK_LIMIT");
      }
      await tx.inventoryItem.update({
        where: { id: existingInventory.id },
        data: { quantity: existingInventory.quantity + quantity },
      });
    } else {
      const slotIndex = await getNextSlotIndex(tx, characterId);
      if (slotIndex === null) {
        throw new Error("INVENTORY_FULL");
      }

      await tx.inventoryItem.create({
        data: {
          characterId,
          itemId: listing.itemId,
          quantity: isStackable ? quantity : 1,
          slotIndex,
        },
      });
    }

    const updatedCharacter = await tx.character.update({
      where: { id: characterId },
      data: { gold: { decrement: totalCost } },
      select: { gold: true },
    });

    return {
      gold: updatedCharacter.gold,
    };
  });
}

async function handleSell(
  characterId: number,
  inventoryItemId: number,
  npcId: number,
  requestedQuantity?: number,
) {
  return prisma.$transaction(async (tx) => {
    const inventoryItem = await tx.inventoryItem.findFirst({
      where: { id: inventoryItemId, characterId },
      include: { item: true },
    });

    if (!inventoryItem || !inventoryItem.item) {
      throw new Error("ITEM_NOT_FOUND");
    }

    if (inventoryItem.isEquipped) {
      throw new Error("ITEM_EQUIPPED");
    }

    const quantity = Math.min(
      inventoryItem.quantity,
      Math.max(1, requestedQuantity ?? inventoryItem.quantity),
    );

    const listing = await tx.shopListing.findFirst({
      where: { npcId, itemId: inventoryItem.itemId },
      select: { price: true },
    });

    const basePrice = listing?.price ?? 1;
    const sellUnitPrice = Math.max(1, Math.floor((basePrice * 2) / 3));
    const saleAmount = sellUnitPrice * quantity;

    if (inventoryItem.quantity > quantity) {
      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: inventoryItem.quantity - quantity },
      });
    } else {
      await tx.inventoryItem.delete({
        where: { id: inventoryItem.id },
      });
    }

    const updatedCharacter = await tx.character.update({
      where: { id: characterId },
      data: { gold: { increment: saleAmount } },
      select: { gold: true },
    });

    return {
      gold: updatedCharacter.gold,
      saleAmount,
    };
  });
}

async function getNextSlotIndex(
  tx: Prisma.TransactionClient,
  characterId: number,
): Promise<number | null> {
  const usedSlots = await tx.inventoryItem.findMany({
    where: {
      characterId,
      isEquipped: false,
      slotIndex: { not: null },
    },
    select: { slotIndex: true },
  });

  const used = new Set(
    usedSlots
      .map((entry) => entry.slotIndex)
      .filter((slotIndex): slotIndex is number => slotIndex !== null),
  );

  for (let index = 0; index < INVENTORY_CAPACITY; index += 1) {
    if (!used.has(index)) {
      return index;
    }
  }

  return null;
}
