import { NextResponse } from "next/server";
import { NpcType } from "@prisma/client";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: {
    slug: string;
  };
};

type VendorListing = {
  itemSlug: string;
  price: number;
  stock: number | null;
  levelRequirement?: number;
  degree?: number;
};

type SutaraVendorDefinition = {
  slug: string;
  name: string;
  title: string | null;
  role: string;
  type: NpcType;
  description: string;
  shopListings: VendorListing[];
};

const SUTARA_VENDOR_DEFINITIONS: SutaraVendorDefinition[] = [
  {
    slug: "melta-braise",
    name: "Melta Braise",
    title: "Krem Ocağı Ustası",
    role: "equipment reforge",
    type: NpcType.BLACKSMITH,
    description: "Metal köpüğünü kılıç şekline sokan sabırlı usta.",
    shopListings: [
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
    name: "Sevi Botanik",
    title: "Bitki Mahzeni Bekçisi",
    role: "alchemy supplies",
    type: NpcType.ALCHEMIST,
    description: "Şifalı otları krema ile macunlaştıran karışım uzmanı.",
    shopListings: [
      { itemSlug: "ITEM_EVENT_HP_SUPERSET_2_BAG", price: 30, stock: 40 },
      { itemSlug: "ITEM_EVENT_MP_SUPERSET_2_BAG", price: 30, stock: 40 },
      { itemSlug: "ITEM_COS_P_CURE_ALL_01", price: 45, stock: 30 },
      { itemSlug: "pasture-tonic", price: 10, stock: 40 },
    ],
  },
  {
    slug: "ithra-loom",
    name: "Ithra Loom",
    title: "Dokuma Başustası",
    role: "tailored armor",
    type: NpcType.TAILOR,
    description: "Süt ipliklerini ince zırhlara dönüştüren yaratıcı tasarımcı.",
    shopListings: [
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
    slug: "lakar-essensee",
    name: "Lakar Essensee",
    title: "Esans Bilgini",
    role: "arcane mentor",
    type: NpcType.SAGE,
    description: "Süt özlerinden büyüsel çizgiler dokuyan filozof.",
    shopListings: [],
  },
  {
    slug: "meri-gildleaf",
    name: "Meri Gildleaf",
    title: "Takı Ustası",
    role: "jeweler",
    type: NpcType.MERCHANT,
    description: "Bakır telleri süt damlalarıyla işleyip zarif takılara dönüştüren usta.",
    shopListings: [
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
    name: "Darin Kervanbaşı",
    title: "Tuz Yolu Koordinatörü",
    role: "caravan broker",
    type: NpcType.MERCHANT,
    description:
      "Krem yollarındaki her mola taşını ezbere bilen, ticaret rotalarını düzenleyen kervan ustası.",
    shopListings: [
      { itemSlug: "ITEM_ETC_TRADE_TK_01", price: 90, stock: 30 },
      { itemSlug: "ITEM_ETC_TRADE_TK_02", price: 120, stock: 25 },
      { itemSlug: "ITEM_ETC_TRADE_TK_03", price: 160, stock: 10 },
    ],
  },
  {
    slug: "selka-stablehand",
    name: "Selka Nalbant",
    title: "Süt Atları Terbiyecisi",
    role: "stable master",
    type: NpcType.MERCHANT,
    description:
      "Foamreach taylarını süt köpüğüyle sakinleştirip binicilere hazırlayan usta eğitici.",
    shopListings: [
      { itemSlug: "ITEM_COS_T_HORSE1", price: 800, stock: 5 },
      { itemSlug: "ITEM_COS_T_HORSE2", price: 1500, stock: 3 },
      { itemSlug: "ITEM_COS_T_DHORSE1", price: 2200, stock: 2 },
    ],
  },
  {
    slug: "orin-huntmaster",
    name: "Orin Avbekçisi",
    title: "Pasture İz Süreni",
    role: "hunt quartermaster",
    type: NpcType.MERCHANT,
    description:
      "Çayır gölgelerinde iz sürüp avcı adaylarına dersler veren deneyimli yol gösterici.",
    shopListings: [
      { itemSlug: "ITEM_ETC_AMMO_ARROW_01", price: 1, stock: 200 },
      { itemSlug: "ITEM_ETC_AMMO_BOLT_01", price: 1, stock: 200 },
      { itemSlug: "ITEM_EU_M_TRADE_HUNTER_01", price: 85, stock: 10, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_F_TRADE_HUNTER_01", price: 85, stock: 10, levelRequirement: 1, degree: 1 },
    ],
  },
  {
    slug: "melik-shadowhand",
    name: "Melik Gölgeel",
    title: "Gece Pazarı Temsilcisi",
    role: "underworld broker",
    type: NpcType.MERCHANT,
    description:
      "Süt kentinin karanlık geçitlerinde kaybolan eşyaları doğru ellere ulaştıran maharetli aracı.",
    shopListings: [
      { itemSlug: "ITEM_EU_M_TRADE_THIEF_01", price: 85, stock: 10, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_EU_F_TRADE_THIEF_01", price: 85, stock: 10, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_M_TRADE_THIEF_04", price: 75, stock: 12, levelRequirement: 1, degree: 1 },
      { itemSlug: "ITEM_CH_W_TRADE_THIEF_04", price: 75, stock: 12, levelRequirement: 1, degree: 1 },
    ],
  },
];

async function ensureSutaraVendors() {
  const sutaraRegion = await prisma.region.findUnique({
    where: { slug: "sutara" },
    select: { id: true },
  });

  if (!sutaraRegion) {
    return;
  }

  const vendorSlugs = SUTARA_VENDOR_DEFINITIONS.map((definition) => definition.slug);

  const npcRecords = await prisma.npc.findMany({
    where: { slug: { in: vendorSlugs } },
    select: { id: true, slug: true },
  });

  const npcMap = new Map(npcRecords.map((record) => [record.slug, record]));

  for (const definition of SUTARA_VENDOR_DEFINITIONS) {
    if (!npcMap.has(definition.slug)) {
      const created = await prisma.npc.create({
        data: {
          slug: definition.slug,
          name: definition.name,
          title: definition.title,
          role: definition.role,
          type: definition.type,
          description: definition.description,
          regionId: sutaraRegion.id,
        },
      });

      npcMap.set(definition.slug, created);
    }
  }

  const itemSlugs = Array.from(
    new Set(
      SUTARA_VENDOR_DEFINITIONS.flatMap((definition) =>
        definition.shopListings.map((listing) => listing.itemSlug),
      ),
    ),
  );

  if (itemSlugs.length === 0) {
    return;
  }

  const itemRecords = await prisma.item.findMany({
    where: { slug: { in: itemSlugs } },
    select: { id: true, slug: true, levelRequirement: true, degree: true },
  });

  const itemMap = new Map(
    itemRecords
      .filter((record) => record.slug)
      .map((record) => [record.slug as string, { ...record }]),
  );

  for (const definition of SUTARA_VENDOR_DEFINITIONS) {
    const npc = npcMap.get(definition.slug);
    if (!npc) continue;

    for (const listing of definition.shopListings) {
      const itemRecord = itemMap.get(listing.itemSlug);
      if (!itemRecord) {
        console.warn(
          `[cities] Sutara vendor ${definition.slug} için item ${listing.itemSlug} bulunamadı.`,
        );
        continue;
      }

      if (
        listing.levelRequirement !== undefined ||
        listing.degree !== undefined
      ) {
        const updateData: { levelRequirement?: number; degree?: number } = {};
        if (
          listing.levelRequirement !== undefined &&
          listing.levelRequirement !== itemRecord.levelRequirement
        ) {
          updateData.levelRequirement = listing.levelRequirement;
        }
        if (listing.degree !== undefined && listing.degree !== itemRecord.degree) {
          updateData.degree = listing.degree;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.item.update({
            where: { id: itemRecord.id },
            data: updateData,
          });
          itemRecord.levelRequirement =
            updateData.levelRequirement ?? itemRecord.levelRequirement;
          itemRecord.degree = updateData.degree ?? itemRecord.degree;
        }
      }

      await prisma.shopListing.upsert({
        where: {
          npcId_itemId: {
            npcId: npc.id,
            itemId: itemRecord.id,
          },
        },
        update: {
          price: listing.price,
          stock: listing.stock,
        },
        create: {
          npcId: npc.id,
          itemId: itemRecord.id,
          price: listing.price,
          stock: listing.stock,
        },
      });
    }
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    if (params.slug === "sutara") {
      await ensureSutaraVendors();
    }

    const region = await prisma.region.findUnique({
      where: { slug: params.slug },
      include: {
        features: {
          orderBy: { id: "asc" },
          include: {
            npc: {
              include: {
                shopListings: {
                  include: { item: { include: { statsProfile: true } } },
                },
              },
            },
            targetRegion: {
              select: {
                slug: true,
                name: true,
                type: true,
              },
            },
          },
        },
        npcs: {
          orderBy: { id: "asc" },
          include: {
            shopListings: {
              include: { item: { include: { statsProfile: true } } },
            },
          },
        },
        connectionsFrom: {
          include: {
            toRegion: {
              select: {
                slug: true,
                name: true,
                type: true,
              },
            },
          },
        },
        connectionsTo: {
          include: {
            fromRegion: {
              select: {
                slug: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!region) {
      return NextResponse.json(
        { message: "Bölge bulunamadı." },
        { status: 404 },
      );
    }

    const mapFeature = region.features.map((feature) => ({
      slug: feature.slug,
      name: feature.name,
      type: feature.type,
      description: feature.description,
      icon: feature.icon,
      posX: feature.posX,
      posY: feature.posY,
      npc: feature.npc
        ? {
            slug: feature.npc.slug,
            name: feature.npc.name,
            title: feature.npc.title,
            role: feature.npc.role,
            type: feature.npc.type,
          }
        : null,
      targetRegion: feature.targetRegion
        ? {
            slug: feature.targetRegion.slug,
            name: feature.targetRegion.name,
            type: feature.targetRegion.type,
          }
        : null,
    }));

    const npcList = region.npcs.map((npc) => ({
      id: npc.id,
      slug: npc.slug,
      name: npc.name,
      title: npc.title,
      role: npc.role,
      type: npc.type,
      description: npc.description,
      shopListings: npc.shopListings.map((listing) => ({
        id: listing.id,
        itemId: listing.itemId,
        price: listing.price,
        currency: listing.currency,
        stock: listing.stock,
        item: {
          id: listing.item.id,
          slug: listing.item.slug,
          name: listing.item.name,
          type: listing.item.type,
          rarity: listing.item.rarity,
          icon: listing.item.icon,
          description: listing.item.description,
          equipmentSlot: listing.item.equipmentSlot,
          handsRequired: listing.item.handsRequired,
          levelRequirement: listing.item.levelRequirement,
          degree: listing.item.degree,
          magicOptionLimit: listing.item.magicOptionLimit,
          upgradeLevel: 0,
          magicOptions: [] as Array<{
            key: string;
            label: string;
            value: string;
          }>,
          stats: listing.item.statsProfile
            ? {
                phyAtkMin: listing.item.statsProfile.phyAtkMin,
                phyAtkMax: listing.item.statsProfile.phyAtkMax,
                magAtkMin: listing.item.statsProfile.magAtkMin,
                magAtkMax: listing.item.statsProfile.magAtkMax,
                attackDistance: listing.item.statsProfile.attackDistance,
                attackRate: listing.item.statsProfile.attackRate,
                critical: listing.item.statsProfile.critical,
                durability: listing.item.statsProfile.durability,
                parryRatio: listing.item.statsProfile.parryRatio,
                blockRatio: listing.item.statsProfile.blockRatio,
                phyReinforceMin: listing.item.statsProfile.phyReinforceMin,
                phyReinforceMax: listing.item.statsProfile.phyReinforceMax,
                magReinforceMin: listing.item.statsProfile.magReinforceMin,
                magReinforceMax: listing.item.statsProfile.magReinforceMax,
              }
            : null,
        },
      })),
    }));

    const travelFrom = region.connectionsFrom.map((connection) => ({
      description: connection.description,
      travelTime: connection.travelTime,
      requirement: connection.requirement,
      destination: connection.toRegion,
    }));

    const travelTo = region.connectionsTo.map((connection) => ({
      description: connection.description,
      travelTime: connection.travelTime,
      requirement: connection.requirement,
      origin: connection.fromRegion,
    }));

    return NextResponse.json({
      region: {
        slug: region.slug,
        name: region.name,
        type: region.type,
        description: region.description,
        ambientTag: region.ambientTag,
        levelMin: region.levelMin,
        levelMax: region.levelMax,
      },
      features: mapFeature,
      npcs: npcList,
      travel: {
        from: travelFrom,
        to: travelTo,
      },
    });
  } catch (error) {
    console.error("City API error:", error);
    return NextResponse.json(
      { message: "Bölge verisi getirilemedi." },
      { status: 500 },
    );
  }
}
