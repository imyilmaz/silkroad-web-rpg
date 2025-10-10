import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

type RouteContext = {
  params: {
    id: string;
  };
};

type PurchaseRequest = {
  listingId?: number;
  quantity?: number;
};

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

const MAX_SLOT_INDEX = 95;

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erişim.", 401);
  }

  const characterId = Number(params.id);
  if (!characterId || Number.isNaN(characterId)) {
    return errorResponse("Geçerli bir karakter kimliği gerekli.");
  }

  const body = (await request.json()) as PurchaseRequest;
  const listingId = body.listingId;
  const quantity = Math.max(1, body.quantity ?? 1);

  if (!listingId) {
    return errorResponse("Satın alma listesi belirtilmedi.");
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, gold: true },
  });

  if (!character) {
    return errorResponse("Karakter bulunamadı veya bu kullanıcıya ait değil.", 404);
  }

  const listing = await prisma.shopListing.findUnique({
    where: { id: listingId },
    include: { item: true, npc: true },
  });

  if (!listing) {
    return errorResponse("Mağaza listesi bulunamadı.", 404);
  }

  if (listing.stock !== null && listing.stock < quantity) {
    return errorResponse("Yeterli stok yok.");
  }

  const totalCost = listing.price * quantity;
  if (totalCost > character.gold) {
    return errorResponse("Bu işlem için yeterli altınınız yok.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.character.findUnique({
        where: { id: characterId },
        select: { gold: true },
      });

      if (!current || current.gold < totalCost) {
        throw new Error("INSUFFICIENT_GOLD");
      }

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

      const existingInventory = await tx.inventoryItem.findFirst({
        where: {
          characterId,
          itemId: listing.itemId,
        },
      });

      if (existingInventory) {
        await tx.inventoryItem.update({
          where: { id: existingInventory.id },
          data: { quantity: existingInventory.quantity + quantity },
        });
      } else {
        const usedSlots = await tx.inventoryItem.findMany({
          where: { characterId },
          select: { slotIndex: true },
        });

        const usedSet = new Set(usedSlots.map((slot) => slot.slotIndex));
        let availableSlot = -1;
        for (let i = 0; i <= MAX_SLOT_INDEX; i++) {
          if (!usedSet.has(i)) {
            availableSlot = i;
            break;
          }
        }

        if (availableSlot === -1) {
          throw new Error("INVENTORY_FULL");
        }

        await tx.inventoryItem.create({
          data: {
            characterId,
            itemId: listing.itemId,
            quantity,
            slotIndex: availableSlot,
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
      return errorResponse("Yeterli stok yok.", 400);
    }

    if (
      transactionError instanceof Error &&
      transactionError.message === "INVENTORY_FULL"
    ) {
      return errorResponse("Envanteriniz dolu.", 400);
    }

    if (
      transactionError instanceof Error &&
      transactionError.message === "STOCK_CHANGED"
    ) {
      return errorResponse("Stok durumu güncellendi, lütfen tekrar deneyin.", 409);
    }

    console.error("Shop purchase error:", transactionError);
    return errorResponse("Satın alma sırasında bir hata oluştu.", 500);
  }
}
