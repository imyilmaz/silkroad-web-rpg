/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const vendorLoadouts = [
  {
    slug: "melta-braise",
    listings: [
      { itemSlug: "ITEM_CH_SWORD_01_A", price: 150, stock: 12, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_SWORD_01_B", price: 210, stock: 12, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_SWORD_01_C", price: 270, stock: 12, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_CH_BLADE_01_A", price: 150, stock: 12, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_BLADE_01_B", price: 210, stock: 12, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_BLADE_01_C", price: 270, stock: 12, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_CH_SPEAR_01_A", price: 165, stock: 12, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_SPEAR_01_B", price: 225, stock: 12, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_SPEAR_01_C", price: 285, stock: 12, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_SWORD_01_A", price: 150, stock: 12, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_SWORD_01_B", price: 210, stock: 12, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_SWORD_01_C", price: 270, stock: 12, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_AXE_01_A", price: 155, stock: 12, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_AXE_01_B", price: 215, stock: 12, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_AXE_01_C", price: 275, stock: 12, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_CROSSBOW_01_A", price: 170, stock: 10, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_CROSSBOW_01_B", price: 230, stock: 10, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_CROSSBOW_01_C", price: 290, stock: 10, levelRequirement: 5, degree: 1 },
    ],
  },
  {
    slug: "sevi-botanik",
    listings: [
      { itemSlug: "ITEM_EVENT_HP_SUPERSET_2_BAG", price: 30, stock: 40 },
      { itemSlug: "ITEM_EVENT_MP_SUPERSET_2_BAG", price: 30, stock: 40 },
      { itemSlug: "ITEM_COS_P_CURE_ALL_01", price: 45, stock: 30 },
      { itemSlug: "pasture-tonic", price: 10, stock: 40 },
    ],
  },
  {
    slug: "ithra-loom",
    listings: [
      { itemSlug: "ITEM_CH_M_LIGHT_01_HA_A", price: 85, stock: 16, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_M_LIGHT_01_HA_B", price: 110, stock: 16, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_M_LIGHT_01_HA_C", price: 135, stock: 16, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_CH_M_LIGHT_01_BA_A", price: 95, stock: 16, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_M_LIGHT_01_BA_B", price: 120, stock: 16, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_M_LIGHT_01_BA_C", price: 145, stock: 16, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_CH_M_LIGHT_01_LA_A", price: 95, stock: 16, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_M_LIGHT_01_LA_B", price: 120, stock: 16, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_M_LIGHT_01_LA_C", price: 145, stock: 16, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_HA_A", price: 90, stock: 16, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_HA_B", price: 115, stock: 16, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_HA_C", price: 140, stock: 16, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_BA_A", price: 100, stock: 16, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_BA_B", price: 125, stock: 16, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_BA_C", price: 150, stock: 16, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_LA_A", price: 100, stock: 16, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_LA_B", price: 125, stock: 16, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_M_LIGHT_01_LA_C", price: 150, stock: 16, levelRequirement: 5, degree: 1 },
    ],
  },
  {
    slug: "meri-gildleaf",
    listings: [
      { itemSlug: "ITEM_CH_RING_01_A", price: 55, stock: 24, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_RING_01_B", price: 80, stock: 24, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_RING_01_C", price: 105, stock: 24, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_CH_EARRING_01_A", price: 55, stock: 24, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_EARRING_01_B", price: 80, stock: 24, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_EARRING_01_C", price: 105, stock: 24, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_CH_NECKLACE_01_A", price: 60, stock: 18, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_NECKLACE_01_B", price: 85, stock: 18, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_CH_NECKLACE_01_C", price: 110, stock: 18, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_RING_01_A", price: 55, stock: 24, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_RING_01_B", price: 80, stock: 24, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_RING_01_C", price: 105, stock: 24, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_EARRING_01_A", price: 55, stock: 24, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_EARRING_01_B", price: 80, stock: 24, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_EARRING_01_C", price: 105, stock: 24, levelRequirement: 5, degree: 1 },
      { itemSlug: "ITEM_EU_NECKLACE_01_A", price: 60, stock: 18, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_NECKLACE_01_B", price: 85, stock: 18, levelRequirement: 3, degree: 1 },
      { itemSlug: "ITEM_EU_NECKLACE_01_C", price: 110, stock: 18, levelRequirement: 5, degree: 1 },
    ],
  },
  {
    slug: "darin-caravaneer",
    listings: [
      { itemSlug: "ITEM_ETC_TRADE_TK_01", price: 90, stock: 30 },
      { itemSlug: "ITEM_ETC_TRADE_TK_02", price: 120, stock: 25 },
      { itemSlug: "ITEM_ETC_TRADE_TK_03", price: 160, stock: 10 },
    ],
  },
  {
    slug: "selka-stablehand",
    listings: [
      { itemSlug: "ITEM_COS_T_HORSE1", price: 800, stock: 5 },
      { itemSlug: "ITEM_COS_T_HORSE2", price: 1500, stock: 3 },
      { itemSlug: "ITEM_COS_T_DHORSE1", price: 2200, stock: 2 },
    ],
  },
  {
    slug: "orin-huntmaster",
    listings: [
      { itemSlug: "ITEM_ETC_AMMO_ARROW_01", price: 1, stock: 200 },
      { itemSlug: "ITEM_ETC_AMMO_BOLT_01", price: 1, stock: 200 },
      { itemSlug: "ITEM_EU_M_TRADE_HUNTER_01", price: 85, stock: 10, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_F_TRADE_HUNTER_01", price: 85, stock: 10, levelRequirement: 1, degree: 1 },
    ],
  },
  {
    slug: "melik-shadowhand",
    listings: [
      { itemSlug: "ITEM_EU_M_TRADE_THIEF_01", price: 85, stock: 10, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_F_TRADE_THIEF_01", price: 85, stock: 10, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_M_TRADE_THIEF_04", price: 75, stock: 12, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_W_TRADE_THIEF_04", price: 75, stock: 12, levelRequirement: 1, degree: 1 },
    ],
  },
];

async function syncVendor(vendor) {
  const npc = await prisma.npc.findUnique({
    where: { slug: vendor.slug },
  });

  if (!npc) {
    console.warn(`[skip] NPC ${vendor.slug} bulunamadı, atlanıyor.`);
    return;
  }

  const keptItemIds = [];

  for (const listing of vendor.listings) {
    const item = await prisma.item.findUnique({
      where: { slug: listing.itemSlug },
      select: { id: true, levelRequirement: true, degree: true },
    });

    if (!item) {
      console.warn(
        `[skip] Item ${listing.itemSlug} bulunamadı, ${vendor.slug} için eklenemedi.`,
      );
      continue;
    }

    if (
      listing.levelRequirement !== undefined ||
      listing.degree !== undefined
    ) {
      const updateData = {};
      if (
        listing.levelRequirement !== undefined &&
        listing.levelRequirement !== item.levelRequirement
      ) {
        updateData.levelRequirement = listing.levelRequirement;
      }
      if (listing.degree !== undefined && listing.degree !== item.degree) {
        updateData.degree = listing.degree;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.item.update({
          where: { id: item.id },
          data: updateData,
        });
      }
    }

    await prisma.shopListing.upsert({
      where: {
        npcId_itemId: {
          npcId: npc.id,
          itemId: item.id,
        },
      },
      update: {
        price: listing.price,
        stock: listing.stock ?? null,
      },
      create: {
        npcId: npc.id,
        itemId: item.id,
        price: listing.price,
        stock: listing.stock ?? null,
      },
    });

    keptItemIds.push(item.id);
  }

  await prisma.shopListing.deleteMany({
    where: {
      npcId: npc.id,
      itemId: keptItemIds.length > 0 ? { notIn: keptItemIds } : undefined,
    },
  });

  console.log(`[ok] ${vendor.slug} güncellendi (${keptItemIds.length} ürün).`);
}
async function main() {
  for (const vendor of vendorLoadouts) {
    await syncVendor(vendor);
  }
}

main()
  .catch((error) => {
    console.error("Sutara vendor senkronizasyonu başarısız:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
