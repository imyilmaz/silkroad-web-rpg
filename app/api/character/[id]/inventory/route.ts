import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { EquipmentSlot, Prisma } from "@prisma/client";

const INVENTORY_CAPACITY = 32;
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

type RouteParams = {
  params: Promise<{
    id?: string;
  }>;
};

type EquipBody = {
  action: "equip";
  inventoryItemId?: number;
  targetSlot?: EquipmentSlot;
};

type UnequipBody = {
  action: "unequip";
  slot?: EquipmentSlot;
};

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

export async function GET(_: Request, context: RouteParams) {
  const { id } = await context.params;
  const characterId = parseCharacterId(id);
  if (!characterId) {
    return errorResponse("Geçersiz karakter kimliği.", 400);
  }

  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erişim.", 401);
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, gold: true },
  });

  if (!character) {
    return errorResponse("Karakter erişimi reddedildi.", 403);
  }

  await ensureEquipmentRecords(characterId);
  const payload = await buildInventoryPayload(characterId, character.gold);
  return NextResponse.json(payload);
}

export async function POST(request: Request, context: RouteParams) {
  const { id } = await context.params;
  const characterId = parseCharacterId(id);
  if (!characterId) {
    return errorResponse("Geçersiz karakter kimliği.", 400);
  }

  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erişim.", 401);
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, gold: true },
  });

  if (!character) {
    return errorResponse("Karakter erişimi reddedildi.", 403);
  }

  await ensureEquipmentRecords(characterId);

  const body = (await request.json()) as EquipBody | UnequipBody;

  try {
    if (body.action === "equip") {
      if (!body.inventoryItemId) {
        return errorResponse("Ekipman için envanter ögesi belirtilmedi.");
      }
      await handleEquip(characterId, body.inventoryItemId, body.targetSlot);
    } else if (body.action === "unequip") {
      if (!body.slot) {
        return errorResponse("Çıkarılacak ekipman yuvası belirtilmedi.");
      }
      await handleUnequip(characterId, body.slot);
    } else {
      return errorResponse("Geçersiz işlem türü.");
    }
  } catch (error) {
    console.error("Inventory manage error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message);
    }
    return errorResponse("İşlem gerçekleştirilemedi.");
  }

  const payload = await buildInventoryPayload(characterId, character.gold);
  return NextResponse.json(payload);
}

function parseCharacterId(id?: string): number | null {
  if (!id) return null;
  const value = Number.parseInt(id, 10);
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return null;
  }
  return value;
}

async function ensureEquipmentRecords(characterId: number) {
  await prisma.$transaction(
    EQUIPMENT_SLOTS.map((slot) =>
      prisma.characterEquipment.upsert({
        where: {
          characterId_slot: {
            characterId,
            slot,
          },
        },
        update: {},
        create: {
          characterId,
          slot,
        },
      }),
    ),
  );
}

async function buildInventoryPayload(characterId: number, gold: number) {
  const [items, equipment] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { characterId, isEquipped: false },
      include: { item: { include: { statsProfile: true } } },
    }),
    prisma.characterEquipment.findMany({
      where: { characterId },
      include: {
        inventoryItem: {
          include: { item: { include: { statsProfile: true } } },
        },
      },
    }),
  ]);

  const itemsPayload = items
    .filter((entry) => entry.slotIndex !== null)
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
    .map((entry) => ({
      id: entry.id,
      slotIndex: entry.slotIndex ?? 0,
      quantity: entry.quantity,
      item: {
        id: entry.item.id,
        name: entry.item.name,
        icon: entry.item.icon,
        rarity: entry.item.rarity,
        type: entry.item.type,
        equipmentSlot: entry.item.equipmentSlot,
        handsRequired: entry.item.handsRequired,
        levelRequirement: entry.item.levelRequirement,
        description: entry.item.description,
        stats: entry.item.statsProfile
          ? {
              phyAtkMin: entry.item.statsProfile.phyAtkMin,
              phyAtkMax: entry.item.statsProfile.phyAtkMax,
              magAtkMin: entry.item.statsProfile.magAtkMin,
              magAtkMax: entry.item.statsProfile.magAtkMax,
              attackDistance: entry.item.statsProfile.attackDistance,
              attackRate: entry.item.statsProfile.attackRate,
              critical: entry.item.statsProfile.critical,
              durability: entry.item.statsProfile.durability,
              parryRatio: entry.item.statsProfile.parryRatio,
              blockRatio: entry.item.statsProfile.blockRatio,
              phyReinforceMin: entry.item.statsProfile.phyReinforceMin,
              phyReinforceMax: entry.item.statsProfile.phyReinforceMax,
              magReinforceMin: entry.item.statsProfile.magReinforceMin,
              magReinforceMax: entry.item.statsProfile.magReinforceMax,
            }
          : null,
      },
    }));

  const equipmentMap = new Map(
    equipment.map((record) => [record.slot, record.inventoryItem]),
  );

  const equipmentPayload = EQUIPMENT_SLOTS.map((slot) => {
    const inventoryItem = equipmentMap.get(slot);
    if (!inventoryItem || !inventoryItem.item) {
      return {
        slot,
        inventoryItemId: null,
        item: null,
      };
    }

    return {
      slot,
      inventoryItemId: inventoryItem.id,
      item: {
        id: inventoryItem.item.id,
        name: inventoryItem.item.name,
        icon: inventoryItem.item.icon,
        rarity: inventoryItem.item.rarity,
        type: inventoryItem.item.type,
        equipmentSlot: inventoryItem.item.equipmentSlot,
        handsRequired: inventoryItem.item.handsRequired,
        levelRequirement: inventoryItem.item.levelRequirement,
        description: inventoryItem.item.description,
        stats: inventoryItem.item.statsProfile
          ? {
              phyAtkMin: inventoryItem.item.statsProfile.phyAtkMin,
              phyAtkMax: inventoryItem.item.statsProfile.phyAtkMax,
              magAtkMin: inventoryItem.item.statsProfile.magAtkMin,
              magAtkMax: inventoryItem.item.statsProfile.magAtkMax,
              attackDistance: inventoryItem.item.statsProfile.attackDistance,
              attackRate: inventoryItem.item.statsProfile.attackRate,
              critical: inventoryItem.item.statsProfile.critical,
              durability: inventoryItem.item.statsProfile.durability,
              parryRatio: inventoryItem.item.statsProfile.parryRatio,
              blockRatio: inventoryItem.item.statsProfile.blockRatio,
              phyReinforceMin: inventoryItem.item.statsProfile.phyReinforceMin,
              phyReinforceMax: inventoryItem.item.statsProfile.phyReinforceMax,
              magReinforceMin: inventoryItem.item.statsProfile.magReinforceMin,
              magReinforceMax: inventoryItem.item.statsProfile.magReinforceMax,
            }
          : null,
      },
    };
  });

  return {
    capacity: INVENTORY_CAPACITY,
    gold,
    items: itemsPayload,
    equipment: equipmentPayload,
  };
}

async function handleEquip(
  characterId: number,
  inventoryItemId: number,
  targetSlot?: EquipmentSlot,
) {
  await prisma.$transaction(async (tx) => {
    const inventoryItem = await tx.inventoryItem.findFirst({
      where: { id: inventoryItemId, characterId },
      include: { item: true },
    });

    if (!inventoryItem || !inventoryItem.item) {
      throw new Error("Envanter ögesi bulunamadı.");
    }

    if (inventoryItem.isEquipped) {
      throw new Error("Bu öge zaten takılı.");
    }

    const slot = targetSlot ?? inventoryItem.item.equipmentSlot;
    if (!slot) {
      throw new Error("Bu eşya giyilemez.");
    }

    if (!EQUIPMENT_SLOTS.includes(slot)) {
      throw new Error("Geçersiz ekipman yuvası.");
    }

    const handsRequired = inventoryItem.item.handsRequired ?? 1;
    if (slot !== EquipmentSlot.WEAPON_MAIN && handsRequired > 1) {
      throw new Error("İki elli eşyalar ana elde kullanılmalıdır.");
    }

    if (
      slot === EquipmentSlot.WEAPON_OFF &&
      inventoryItem.item.equipmentSlot !== EquipmentSlot.WEAPON_OFF
    ) {
      throw new Error("Bu eşya kalkan yuvasına uygun değil.");
    }

    const slotsToOccupy = new Set<EquipmentSlot>([slot]);
    if (slot === EquipmentSlot.WEAPON_MAIN && handsRequired > 1) {
      slotsToOccupy.add(EquipmentSlot.WEAPON_OFF);
    }

    const occupied = await tx.characterEquipment.findMany({
      where: {
        characterId,
        slot: { in: Array.from(slotsToOccupy) },
        inventoryItemId: { not: null },
      },
    });

    if (occupied.length > 0) {
      throw new Error("Bu yuva dolu. Önce mevcut ekipmanı çıkarın.");
    }

    await tx.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        isEquipped: true,
        slotIndex: null,
      },
    });

    for (const slotName of slotsToOccupy) {
      await tx.characterEquipment.update({
        where: {
          characterId_slot: { characterId, slot: slotName },
        },
        data: {
          inventoryItemId: inventoryItem.id,
        },
      });
    }
  });
}

async function handleUnequip(characterId: number, slot: EquipmentSlot) {
  await prisma.$transaction(async (tx) => {
    const record = await tx.characterEquipment.findUnique({
      where: { characterId_slot: { characterId, slot } },
      include: {
        inventoryItem: {
          include: { item: true },
        },
      },
    });

    if (!record || !record.inventoryItem) {
      throw new Error("Bu yuva zaten boş.");
    }

    const inventoryItem = record.inventoryItem;
    const relatedSlots = await tx.characterEquipment.findMany({
      where: {
        characterId,
        inventoryItemId: inventoryItem.id,
      },
    });

    const nextSlotIndex = await getNextSlotIndex(tx, characterId);
    if (nextSlotIndex === null) {
      throw new Error("Envanter dolu, eşya çıkarılamıyor.");
    }

    await Promise.all(
      relatedSlots.map((entry) =>
        tx.characterEquipment.update({
          where: {
            characterId_slot: { characterId, slot: entry.slot },
          },
          data: {
            inventoryItemId: null,
          },
        }),
      ),
    );

    await tx.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        isEquipped: false,
        slotIndex: nextSlotIndex,
      },
    });
  });
}

async function getNextSlotIndex(
  tx: Prisma.TransactionClient,
  characterId: number,
): Promise<number | null> {
  const existing = await tx.inventoryItem.findMany({
    where: { characterId, isEquipped: false },
    select: { slotIndex: true },
  });

  const used = new Set(
    existing
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
