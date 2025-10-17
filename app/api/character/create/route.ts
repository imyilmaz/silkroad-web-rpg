import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { EquipmentSlot, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const INITIAL_GOLD = 1000;

const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  EquipmentSlot.WEAPON_MAIN,
  EquipmentSlot.WEAPON_OFF,
  EquipmentSlot.HEAD,
  EquipmentSlot.SHOULDERS,
  EquipmentSlot.CHEST,
  EquipmentSlot.GLOVES,
  EquipmentSlot.LEGS,
  EquipmentSlot.FEET,
  EquipmentSlot.NECK,
  EquipmentSlot.EARRING,
  EquipmentSlot.RING_1,
  EquipmentSlot.RING_2,
  EquipmentSlot.SPECIAL,
  EquipmentSlot.JOB,
];

type InventoryItemWithItem = Prisma.InventoryItemGetPayload<{
  include: { item: true };
}>;

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Giriş yapılmamış." },
        { status: 401 },
      );
    }

    let decoded: { userId: number };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    } catch (verifyError) {
      console.error("Create Character token verify failed:", verifyError);
      return NextResponse.json(
        { message: "Oturum doğrulanamadı." },
        { status: 401 },
      );
    }

    const { name, race } = await req.json();
    if (!name || !race) {
      return NextResponse.json(
        { message: "Karakter adı ve köken seçimi zorunludur." },
        { status: 400 },
      );
    }

    const existingForUser = await prisma.character.findFirst({
      where: { userId: decoded.userId },
      select: { id: true },
    });

    if (existingForUser) {
      return NextResponse.json(
        { message: "Şimdilik yalnızca tek karakter oluşturulabilir." },
        { status: 409 },
      );
    }

    const existingByName = await prisma.character.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existingByName) {
      return NextResponse.json(
        { message: "Bu isimde bir karakter zaten var." },
        { status: 400 },
      );
    }

    const origin = await prisma.characterOrigin.findUnique({
      where: { slug: race },
      include: { startingItems: true },
    });

    if (!origin) {
      return NextResponse.json(
        { message: "Seçilen köken tanınmıyor." },
        { status: 400 },
      );
    }

    const character = await prisma.$transaction(async (tx) => {
      const created = await tx.character.create({
        data: {
          name,
          race,
          originId: origin.id,
          userId: decoded.userId,
          gold: INITIAL_GOLD,
        },
      });

      let starterInventory: InventoryItemWithItem[] = [];

      if (origin.startingItems.length > 0) {
        await tx.inventoryItem.createMany({
          data: origin.startingItems.map((entry, index) => ({
            characterId: created.id,
            itemId: entry.itemId,
            quantity: entry.quantity,
            slotIndex: entry.slotIndex ?? index,
            isEquipped: false,
          })),
        });

        starterInventory = await tx.inventoryItem.findMany({
          where: { characterId: created.id },
          include: { item: true },
          orderBy: { id: "asc" },
        });
      }

      await ensureEquipmentRecords(tx, created.id);

      if (starterInventory.length > 0) {
        await equipStarterItems(tx, created.id, starterInventory);
      }

      await tx.session.upsert({
        where: { userId: decoded.userId },
        update: { characterId: created.id },
        create: { userId: decoded.userId, characterId: created.id },
      });

      return created;
    });

    return NextResponse.json({
      message: "Karakter oluşturuldu.",
      character,
    });
  } catch (err) {
    console.error("Create Character Error:", err);
    return NextResponse.json({ message: "Sunucu hatası." }, { status: 500 });
  }
}

async function ensureEquipmentRecords(
  tx: Prisma.TransactionClient,
  characterId: number,
) {
  await Promise.all(
    EQUIPMENT_SLOTS.map((slot) =>
      tx.characterEquipment.upsert({
        where: { characterId_slot: { characterId, slot } },
        update: {},
        create: { characterId, slot },
      }),
    ),
  );
}

async function equipStarterItems(
  tx: Prisma.TransactionClient,
  characterId: number,
  inventoryItems: InventoryItemWithItem[],
) {
  if (inventoryItems.length === 0) {
    return;
  }

  await tx.characterEquipment.updateMany({
    where: { characterId },
    data: { inventoryItemId: null },
  });

  const slotPriority = new Map(
    EQUIPMENT_SLOTS.map((slot, index) => [slot, index]),
  );
  const occupiedSlots = new Set<EquipmentSlot>();

  const equippable = inventoryItems
    .filter((entry) => entry.item && entry.item.equipmentSlot)
    .sort((a, b) => {
      const slotA = (a.item?.equipmentSlot ?? null) as EquipmentSlot | null;
      const slotB = (b.item?.equipmentSlot ?? null) as EquipmentSlot | null;
      const priorityA =
        slotA !== null ? slotPriority.get(slotA) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      const priorityB =
        slotB !== null ? slotPriority.get(slotB) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.id - b.id;
    });

  for (const entry of equippable) {
    const item = entry.item;
    if (!item || !item.equipmentSlot) continue;

    const baseSlot = item.equipmentSlot as EquipmentSlot;
    const handsRequired = item.handsRequired ?? 1;

    const candidateSlots =
      baseSlot === EquipmentSlot.RING_1
        ? [EquipmentSlot.RING_1, EquipmentSlot.RING_2]
        : [baseSlot];

    const targetSlot = candidateSlots.find((slot) => !occupiedSlots.has(slot));
    if (!targetSlot) {
      continue;
    }

    await tx.inventoryItem.update({
      where: { id: entry.id },
      data: {
        isEquipped: true,
        slotIndex: null,
      },
    });

    await tx.characterEquipment.update({
      where: {
        characterId_slot: { characterId, slot: targetSlot },
      },
      data: {
        inventoryItemId: entry.id,
      },
    });

    occupiedSlots.add(targetSlot);

    if (targetSlot === EquipmentSlot.WEAPON_MAIN && handsRequired > 1) {
      await tx.characterEquipment.update({
        where: {
          characterId_slot: { characterId, slot: EquipmentSlot.WEAPON_OFF },
        },
        data: {
          inventoryItemId: entry.id,
        },
      });
      occupiedSlots.add(EquipmentSlot.WEAPON_OFF);
    }
  }
}
