/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ITEMS_JSON_PATH = path.join(__dirname, "..", "items_full_clean.json");
const SLOT_TOKEN_MAP = {
  HA: "HEAD",
  CA: "HEAD",
  BA: "CHEST",
  SA: "SHOULDERS",
  AA: "GLOVES",
  LA: "LEGS",
  FA: "FEET",
};

const ACCESSORY_KEYWORDS = [
  { keyword: "EARRING", slot: "EARRING" },
  { keyword: "NECKLACE", slot: "NECK" },
  { keyword: "AMULET", slot: "NECK" },
  { keyword: "RING", slot: "RING_1" },
];

const TWO_HANDED_WEAPON_TYPES = new Set([
  "weapon/bow",
  "weapon/spear",
  "weapon/staff",
]);

const ICON_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg", ".svg"]);

function sanitizeIconPath(rawIcon) {
  if (!rawIcon || typeof rawIcon !== "string") return null;
  const trimmed = rawIcon.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  for (const ext of ICON_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return trimmed;
    }
  }
  return null;
}

function mapItemType(item) {
  const metaType = item?.meta?.type;
  const codeName = (item?.codeName ?? "").toUpperCase();

  if (metaType) {
    const normalized = String(metaType).toLowerCase();
    if (normalized.startsWith("weapon")) return "WEAPON";
    if (normalized.startsWith("armor")) return "BODY";
    if (normalized === "shield") return "WEAPON";
    if (normalized.includes("material")) return "MATERIAL";
    if (normalized.includes("consume")) return "CONSUMABLE";
    if (normalized === "etc") return "ETC";
  }

  if (ACCESSORY_KEYWORDS.some(({ keyword }) => codeName.includes(keyword))) {
    return "ACCESSORY";
  }

  return "ETC";
}

function deriveEquipmentSlot(item) {
  const metaType = item?.meta?.type ? String(item.meta.type).toLowerCase() : null;
  if (metaType) {
    if (metaType === "shield") return "WEAPON_OFF";
    if (metaType.startsWith("weapon")) return "WEAPON_MAIN";
  }

  const codeName = (item?.codeName ?? "").toUpperCase();
  for (const { keyword, slot } of ACCESSORY_KEYWORDS) {
    if (codeName.includes(keyword)) return slot;
  }

  const slotToken =
    extractSlotTokenFromCodeName(codeName) ??
    extractSlotTokenFromIcon(item?.visual?.icon);
  if (slotToken) return slotToken;

  if (metaType && metaType.startsWith("armor")) {
    return "CHEST";
  }

  return null;
}

function deriveHandsRequired(item, equipmentSlot) {
  const metaType = item?.meta?.type ? String(item.meta.type).toLowerCase() : null;
  if (equipmentSlot === "WEAPON_OFF") {
    return 1;
  }
  if (metaType && TWO_HANDED_WEAPON_TYPES.has(metaType)) {
    return 2;
  }
  return 1;
}

function extractSlotTokenFromCodeName(codeName) {
  if (!codeName) return null;
  const parts = codeName.split("_");
  for (const part of parts) {
    if (SLOT_TOKEN_MAP[part]) {
      return SLOT_TOKEN_MAP[part];
    }
  }
  return null;
}

function extractSlotTokenFromIcon(iconPath) {
  if (!iconPath) return null;
  const fileName = iconPath.split(/[/\\]/).pop();
  if (!fileName) return null;
  const nameWithoutExt = fileName.split(".")[0];
  if (!nameWithoutExt) return null;
  const suffix = nameWithoutExt.split("_").pop()?.toUpperCase();
  if (suffix && SLOT_TOKEN_MAP[suffix]) {
    return SLOT_TOKEN_MAP[suffix];
  }
  return null;
}
function loadItemDataset() {
  if (!fs.existsSync(ITEMS_JSON_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(ITEMS_JSON_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[seed] Item veri seti okunamadı:", error);
    return [];
  }
}

function collectJsonItem(item, aggregated) {
  if (!item || !item.id) return;

  const slug = String(item.id);
  const meta = item.meta ?? {};
  const required = meta.required ?? {};
  const stats = item.stats ?? {};
  const pricing = item.pricing ?? {};
  const upgrade = item.upgrade ?? {};
  const translations = item.name ?? {};
  const descriptions = item.desc ?? {};

  const primaryName =
    translations.en ?? translations.tr ?? item.codeName ?? slug;
  const primaryDesc = descriptions.en ?? descriptions.tr ?? null;
  const magicOptionLimit =
    normalizeInt(meta.magicOptionLimit) ??
    normalizeInt(item.magicOptions?.limit);
  const equipmentSlot = deriveEquipmentSlot(item);
  const handsRequired = deriveHandsRequired(item, equipmentSlot);
  const icon = sanitizeIconPath(item.visual?.icon);

  aggregated.baseItems.push({
    slug,
    codeName: item.codeName ?? null,
    stringNameKey: item.stringID?.name ?? null,
    stringDescKey: item.stringID?.desc ?? null,
    name: primaryName,
    type: mapItemType(item),
    rarity: meta.rarity ?? null,
    icon,
    modelPath: item.visual?.model ?? null,
    levelRequirement: normalizeInt(required.charLevel),
    description: primaryDesc,
    equipmentSlot,
    handsRequired,
    degree: normalizeInt(meta.degree),
    race: mapRace(meta.race),
    categoryPath: meta.type ?? null,
    magicOptionLimit,
    bindType: meta.bind ?? null,
    canUseAdvancedElixir: Boolean(item.flags?.canUseAdvancedElixir ?? false),
  });

  const translationEntries = Object.entries(translations).filter(
    ([lang, value]) => Boolean(lang) && value !== undefined && value !== null,
  );

  if (translationEntries.length > 0) {
    for (const [language, value] of translationEntries) {
      aggregated.translations.push({
        slug,
        language,
        name: value ?? null,
        description: descriptions?.[language] ?? null,
      });
    }
  } else {
    aggregated.translations.push({
      slug,
      language: "en",
      name: primaryName,
      description: primaryDesc,
    });
  }

  const minLevel = normalizeInt(required.charLevel);
  const masteryCode = required.mastery ?? null;
  const gender = mapGender(required.gender);
  if (minLevel !== null || masteryCode || gender) {
    aggregated.requirements.push({
      slug,
      minLevel,
      masteryCode,
      gender,
    });
  }

  const statRecord = {
    slug,
    phyAtkMin: normalizeNumber(stats.phyAtkMin),
    phyAtkMax: normalizeNumber(stats.phyAtkMax),
    magAtkMin: normalizeNumber(stats.magAtkMin),
    magAtkMax: normalizeNumber(stats.magAtkMax),
    attackDistance: normalizeNumber(stats.attackDistance),
    attackRate: normalizeNumber(stats.attackRate),
    critical: normalizeNumber(stats.critical),
    durability: normalizeNumber(stats.durability),
    parryRatio: normalizeNumber(stats.parryRatio),
    blockRatio: normalizeNumber(stats.blockRatio),
    phyReinforceMin: normalizeNumber(stats.phyReinforceMin),
    phyReinforceMax: normalizeNumber(stats.phyReinforceMax),
    magReinforceMin: normalizeNumber(stats.magReinforceMin),
    magReinforceMax: normalizeNumber(stats.magReinforceMax),
  };

  if (hasAnyStatValue(statRecord)) {
    aggregated.stats.push(statRecord);
  }

  const price = normalizePrice(pricing.price);
  const stackSize = normalizeInt(pricing.stack);
  if (price !== null || stackSize !== null) {
    aggregated.pricing.push({
      slug,
      price,
      stackSize,
      currency: pricing.currency ?? "gold",
    });
  }

  const upgradeModel = mapUpgradeModel(upgrade.model);
  const maxPlus = normalizeInt(upgrade.maxPlus);
  const tableKey = upgrade.tableKey ?? null;
  const formulaWhite = upgrade.formula?.whiteStats ?? null;
  const formulaReinforce = upgrade.formula?.reinforce ?? null;

  if (
    upgradeModel ||
    tableKey ||
    maxPlus !== null ||
    formulaWhite ||
    formulaReinforce
  ) {
    aggregated.upgrades.push({
      slug,
      model: upgradeModel,
      tableKey,
      maxPlus,
      formulaWhite,
      formulaReinforce,
    });
  }
}

function collectCustomItem(item, aggregated) {
  if (!item) return;
  const slug = item.slug ?? item.key;
  if (!slug) return;

  const name = item.name ?? slug;
  const derivedSlot = item.equipmentSlot ?? deriveEquipmentSlot(item);
  const handsRequired =
    item.handsRequired ?? deriveHandsRequired(item, derivedSlot);
  const icon = sanitizeIconPath(item.icon);
  aggregated.baseItems.push({
    slug,
    codeName: item.codeName ?? slug.toUpperCase(),
    stringNameKey: null,
    stringDescKey: null,
    name,
    type: item.type ?? "ETC",
    rarity: item.rarity ?? null,
    icon,
    modelPath: item.modelPath ?? null,
    levelRequirement: normalizeInt(item.levelRequirement),
    description: item.description ?? null,
    equipmentSlot: derivedSlot ?? null,
    handsRequired,
    degree: normalizeInt(item.degree),
    race: "GLOBAL",
    categoryPath: item.categoryPath ?? "custom",
    magicOptionLimit: normalizeInt(item.magicOptionLimit),
    bindType: item.bindType ?? null,
    canUseAdvancedElixir: Boolean(item.canUseAdvancedElixir ?? false),
  });

  aggregated.translations.push({
    slug,
    language: "en",
    name,
    description: item.description ?? null,
  });

  const minLevel = normalizeInt(item.levelRequirement);
  if (minLevel !== null) {
    aggregated.requirements.push({
      slug,
      minLevel,
      masteryCode: null,
      gender: null,
    });
  }

  if (item.price !== undefined || item.stackSize !== undefined) {
    aggregated.pricing.push({
      slug,
      price: item.price ?? null,
      stackSize: normalizeInt(item.stackSize),
      currency: item.currency ?? "gold",
    });
  }
}

async function createManyChunked(delegate, data, chunkSize = 1000, skipDuplicates = false) {
  if (!Array.isArray(data) || data.length === 0) return;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    await delegate.createMany({
      data: chunk,
      skipDuplicates,
    });
  }
}

function mapRace(value) {
  if (value === "CH" || value === "EU") return value;
  return "GLOBAL";
}

function mapItemType(metaType) {
  if (!metaType) return "ETC";
  const normalized = String(metaType).toLowerCase();
  if (normalized.startsWith("weapon") || normalized === "shield") {
    return "WEAPON";
  }
  if (normalized.includes("accessory")) {
    return "ACCESSORY";
  }
  if (normalized.startsWith("armor")) {
    return "BODY";
  }
  if (normalized.includes("consume")) {
    return "CONSUMABLE";
  }
  if (normalized.includes("material")) {
    return "MATERIAL";
  }
  if (normalized === "etc") {
    return "ETC";
  }
  return "ETC";
}

function mapGender(value) {
  if (!value) return null;
  const normalized = String(value).toLowerCase();
  if (normalized.startsWith("m")) return "MALE";
  if (normalized.startsWith("f")) return "FEMALE";
  return null;
}

function mapUpgradeModel(value) {
  if (!value) return null;
  const normalized = String(value).toUpperCase();
  if (normalized === "TABLE") return "TABLE";
  return null;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeInt(value) {
  const num = normalizeNumber(value);
  if (num === null) return null;
  return Math.trunc(num);
}

function normalizePrice(value) {
  const num = normalizeInt(value);
  if (num === null) return null;
  return num < 0 ? null : num;
}

function hasAnyStatValue(record) {
  return Object.entries(record).some(
    ([key, value]) => key !== "slug" && value !== null,
  );
}
const itemsData = [
  {
    key: "pasture-tonic",
    name: "Pasture Tonic",
    type: "CONSUMABLE",
    rarity: "common",
    levelRequirement: 1,
    description: "Hearty blend of grassmilk and herbs that restores vigor.",
  },
];

const starterEquipmentItems = [
  { itemKey: "ITEM_EU_SWORD_03_B", quantity: 1 },
  { itemKey: "ITEM_EU_SHIELD_03_B", quantity: 1 },
  { itemKey: "ITEM_EU_M_LIGHT_03_HA_B", quantity: 1 },
  { itemKey: "ITEM_EU_M_LIGHT_03_SA_B", quantity: 1 },
  { itemKey: "ITEM_EU_M_LIGHT_03_BA_B", quantity: 1 },
  { itemKey: "ITEM_EU_M_LIGHT_03_LA_B", quantity: 1 },
  { itemKey: "ITEM_EU_M_LIGHT_03_AA_B", quantity: 1 },
  { itemKey: "ITEM_EU_M_LIGHT_03_FA_B", quantity: 1 },
  { itemKey: "ITEM_EU_EARRING_10_A_RARE", quantity: 1 },
  { itemKey: "ITEM_EU_NECKLACE_10_A_RARE", quantity: 1 },
  { itemKey: "ITEM_CH_RING_01_A_RARE", quantity: 1 },
  { itemKey: "ITEM_CH_RING_01_B_RARE", quantity: 1 },
];

function buildStartingItems(extra = []) {
  return [
    ...starterEquipmentItems.map((entry) => ({ ...entry })),
    ...extra.map((entry) => ({ ...entry })),
  ];
}

const originsData = [
  {
    slug: "sunweaver-nomad",
    name: "Gün Dokuyucusu Göçebe",
    description:
      "Arnavut güneş çöllerinde süt ışığını eğip bükerek yol açan usta gezginler.",
    focus: "haste and melee weaving",
    affinity: "solar",
    startingItems: buildStartingItems([
      { itemKey: "pasture-tonic", quantity: 3, slotIndex: 0 },
    ]),
  },
  {
    slug: "moondrift-oracle",
    name: "Ay Süzülü Kahini",
    description:
      "Karanlık göllerden topladıkları süt yansımalarıyla büyü tezgâhlayan biliciler.",
    focus: "supportive rituals",
    affinity: "lunar",
    startingItems: buildStartingItems([
      { itemKey: "pasture-tonic", quantity: 3, slotIndex: 0 },
    ]),
  },
  {
    slug: "stormborne-guard",
    name: "Fırtınadoğan Muhafız",
    description:
      "Süt fırtınalarının ortasında gemileri koruyan, ağır zırhlı süt şövalyeleri.",
    focus: "area control",
    affinity: "tempest",
    startingItems: buildStartingItems([
      { itemKey: "pasture-tonic", quantity: 3, slotIndex: 0 },
    ]),
  },
];

const masteryMultiplierSetting = 3;

const disciplinesData = [
  {
    slug: \"weapon-bicheon\",
    name: \"Bicheon Ustaligi\",
    description:
      \"Kilic akimlarini dans eder gibi yonlendiren, yakin menzilde cevik saldirilar ureten ustalik.\",
    element: \"weapon\",
    skills: [
      {
        slug: \"bicheon-basic-slash\",
        name: \"Temel Kesik\",
        description: \"Kilic ile hizli bir acilis darbesi yapar.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 8,
        cooldownSeconds: 3,
        requiredLevel: 1,
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"bicheon-rising-phoenix\",
        name: \"Yukselen Anka\",
        description: \"Dusmana ardisik iki kesik indirir ve zayiflatan bir yanik birakir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 12,
        cooldownSeconds: 6,
        requiredLevel: 10,
        prerequisiteSlug: \"bicheon-basic-slash\",
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"bicheon-iron-wall\",
        name: \"Demir Duvar Durusu\",
        description: \"Kisa sure boyunca fiziksel savunmayi ve blok sansini artirir.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 10,
        cooldownSeconds: 20,
        requiredLevel: 20,
        prerequisiteSlug: \"bicheon-rising-phoenix\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"bicheon-fatal-dance\",
        name: \"Olum Dansi\",
        description: \"Kritik hasar verebilen uc adimlik doner saldiri yapar.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 18,
        cooldownSeconds: 12,
        requiredLevel: 35,
        prerequisiteSlug: \"bicheon-iron-wall\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"bicheon-spirit-blade\",
        name: \"Ruh Kilici\",
        description: \"Tum Bicheon saldirilarinin hasarini kalici olarak artirir.\",
        type: \"PASSIVE\",
        rankMax: 9,
        resourceCost: null,
        cooldownSeconds: null,
        requiredLevel: 50,
        prerequisiteSlug: \"bicheon-fatal-dance\",
        unlockCost: 3,
        rankCost: 3,
      },
    ],
  },
  {
    slug: \"weapon-heuksal\",
    name: \"Heuksal Ustaligi\",
    description:
      \"Mizrakla genis alanda delici ve kontrolcu hamleler gerceklestiren ustalik.\",
    element: \"weapon\",
    skills: [
      {
        slug: \"heuksal-lunging-pierce\",
        name: \"Atilgan Delme\",
        description: \"Hedefe dogru hizla atilip delici darbe indirir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 9,
        cooldownSeconds: 4,
        requiredLevel: 1,
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"heuksal-crescent-spear\",
        name: \"Hila Mizragi\",
        description: \"Genis yay cizerek iki hedefe kadar hasar verir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 14,
        cooldownSeconds: 6,
        requiredLevel: 15,
        prerequisiteSlug: \"heuksal-lunging-pierce\",
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"heuksal-scale-armor\",
        name: \"Pul Zirh\",
        description: \"Kisa sureli ekstra fiziksel savunma ve dayaniklilik saglar.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 12,
        cooldownSeconds: 22,
        requiredLevel: 25,
        prerequisiteSlug: \"heuksal-crescent-spear\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"heuksal-sky-impaler\",
        name: \"Gokyuzu Delicisi\",
        description: \"Mizrakla dusmanlari havaya savurup yere carparken ek hasar verir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 18,
        cooldownSeconds: 10,
        requiredLevel: 40,
        prerequisiteSlug: \"heuksal-scale-armor\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"heuksal-dragon-might\",
        name: \"Ejder Gucu\",
        description: \"Mizrak becerilerinin hasarini ve kritik oranini kalici olarak artirir.\",
        type: \"PASSIVE\",
        rankMax: 9,
        resourceCost: null,
        cooldownSeconds: null,
        requiredLevel: 55,
        prerequisiteSlug: \"heuksal-sky-impaler\",
        unlockCost: 3,
        rankCost: 3,
      },
    ],
  },
  {
    slug: \"weapon-pacheon\",
    name: \"Pacheon Ustaligi\",
    description:
      \"Uzaktan nisancilik ve hizli ok yagmurlariyla rakipleri baskilayan ustalik.\",
    element: \"weapon\",
    skills: [
      {
        slug: \"pacheon-quick-shot\",
        name: \"Hizli Atis\",
        description: \"Hedefe hizli bir ok gondererek savasi baslatir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 6,
        cooldownSeconds: 3,
        requiredLevel: 1,
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"pacheon-multi-arrow\",
        name: \"Coklu Ok\",
        description: \"Kisa surede ard arda uc ok firlatarak coklu hedeflere hasar verir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 12,
        cooldownSeconds: 6,
        requiredLevel: 12,
        prerequisiteSlug: \"pacheon-quick-shot\",
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"pacheon-hawkeye-focus\",
        name: \"Sahin Gozu\",
        description: \"Kalici olarak isabet oranini ve kritik hasari artirir.\",
        type: \"PASSIVE\",
        rankMax: 9,
        resourceCost: null,
        cooldownSeconds: null,
        requiredLevel: 22,
        prerequisiteSlug: \"pacheon-multi-arrow\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"pacheon-explosive-shot\",
        name: \"Patlayici Ok\",
        description: \"Carptiginda alan hasari veren patlayici bir ok salar.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 18,
        cooldownSeconds: 9,
        requiredLevel: 38,
        prerequisiteSlug: \"pacheon-hawkeye-focus\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"pacheon-sniper-stance\",
        name: \"Nisanci Durusu\",
        description: \"Kisa sureligine menzili ve delici hasari artiran konsantrasyon modu.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 16,
        cooldownSeconds: 25,
        requiredLevel: 52,
        prerequisiteSlug: \"pacheon-explosive-shot\",
        unlockCost: 3,
        rankCost: 3,
      },
    ],
  },
  {
    slug: \"force-cold\",
    name: \"Soguk Kuvvet Ustaligi\",
    description:
      \"Buz buyuleriyle rakipleri yavaslatan ve muttefikleri koruyan element ustaligi.\",
    element: \"force\",
    skills: [
      {
        slug: \"cold-freezing-spear\",
        name: \"Donduran Mizrak\",
        description: \"Soguk enerjiyle hedefi saplayarak hizini dusurur.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 10,
        cooldownSeconds: 4,
        requiredLevel: 1,
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"cold-frost-shield\",
        name: \"Kiragi Kalkan\",
        description: \"Muttefikin uzerine buz kalkan orer ve gelen hasari azaltir.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 12,
        cooldownSeconds: 18,
        requiredLevel: 14,
        prerequisiteSlug: \"cold-freezing-spear\",
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"cold-icy-grasp\",
        name: \"Buzlu Kavrayis\",
        description: \"Hedefi yerinde dondurarak kisa sureli felc eder.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 16,
        cooldownSeconds: 12,
        requiredLevel: 26,
        prerequisiteSlug: \"cold-frost-shield\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"cold-crystal-barrier\",
        name: \"Kristal Bariyer\",
        description: \"Takimi cevreleyen uzak saldiri hasarini azaltan koruma kubbesi olusturur.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 20,
        cooldownSeconds: 28,
        requiredLevel: 42,
        prerequisiteSlug: \"cold-icy-grasp\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"cold-permafrost-aura\",
        name: \"Donmus Aura\",
        description: \"Yakindaki dusmanlarin hareket ve saldiri hizini kalici olarak azaltir.\",
        type: \"PASSIVE\",
        rankMax: 9,
        resourceCost: null,
        cooldownSeconds: null,
        requiredLevel: 58,
        prerequisiteSlug: \"cold-crystal-barrier\",
        unlockCost: 3,
        rankCost: 3,
      },
    ],
  },
  {
    slug: \"force-lightning\",
    name: \"Yildirim Kuvvet Ustaligi\",
    description:
      \"Simsek hizinda hareket ve elektrikli saldirilarla rakipleri sersemleten ustalik.\",
    element: \"force\",
    skills: [
      {
        slug: \"lightning-spark-burst\",
        name: \"Kivilcim Patlamasi\",
        description: \"Hedefe elektrik soku gondererek kisa sureli sersemletme uygular.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 10,
        cooldownSeconds: 4,
        requiredLevel: 1,
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"lightning-arc-flow\",
        name: \"Yayli Akim\",
        description: \"Simsek birden fazla hedefe sicrayarak zincir hasari verir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 16,
        cooldownSeconds: 7,
        requiredLevel: 14,
        prerequisiteSlug: \"lightning-spark-burst\",
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"lightning-blink-stance\",
        name: \"Sicrama Durusu\",
        description: \"Kisa surelik hareket hizi artisi ve ekstra hasar saglar.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 14,
        cooldownSeconds: 18,
        requiredLevel: 28,
        prerequisiteSlug: \"lightning-arc-flow\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"lightning-chain-light\",
        name: \"Zincir Isik\",
        description: \"Simsegi guclendirerek daha genis alanlara sicramasini saglar.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 22,
        cooldownSeconds: 10,
        requiredLevel: 44,
        prerequisiteSlug: \"lightning-blink-stance\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"lightning-storm-channel\",
        name: \"Firtina Kanallamasi\",
        description: \"Elektrik becerilerinin hasarini ve kritik oranini kalici olarak artirir.\",
        type: \"PASSIVE\",
        rankMax: 9,
        resourceCost: null,
        cooldownSeconds: null,
        requiredLevel: 60,
        prerequisiteSlug: \"lightning-chain-light\",
        unlockCost: 3,
        rankCost: 3,
      },
    ],
  },
  {
    slug: \"force-fire\",
    name: \"Ates Kuvvet Ustaligi\",
    description:
      \"Kizgin alevlerle saldiri gucunu yukseltip rakipleri baskilayan ustalik.\",
    element: \"force\",
    skills: [
      {
        slug: \"fire-flame-arrow\",
        name: \"Alev Oku\",
        description: \"Hedefe sicak bir alev oku gondererek yanma etkisi birakir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 10,
        cooldownSeconds: 4,
        requiredLevel: 1,
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"fire-scorching-wave\",
        name: \"Kavurucu Dalga\",
        description: \"Onundeki alana genis bir ates dalgasi salar.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 18,
        cooldownSeconds: 7,
        requiredLevel: 16,
        prerequisiteSlug: \"fire-flame-arrow\",
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"fire-burning-spirit\",
        name: \"Yanan Ruh\",
        description: \"Kisa sureligine saldiri gucunu ve buyu hasarini artirir.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 16,
        cooldownSeconds: 20,
        requiredLevel: 30,
        prerequisiteSlug: \"fire-scorching-wave\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"fire-impaling-lava\",
        name: \"Delici Lav\",
        description: \"Eritici lav sutunu cagirarak dusmanlari yerinde yakar.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 22,
        cooldownSeconds: 10,
        requiredLevel: 46,
        prerequisiteSlug: \"fire-burning-spirit\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"fire-molten-armor\",
        name: \"Erimis Zirh\",
        description: \"Saldiranlari yakan magma kabugu olusturur ve savunma saglar.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 24,
        cooldownSeconds: 26,
        requiredLevel: 62,
        prerequisiteSlug: \"fire-impaling-lava\",
        unlockCost: 3,
        rankCost: 3,
      },
    ],
  },
  {
    slug: \"force-heal\",
    name: \"Sifa Kuvvet Ustaligi\",
    description:
      \"Takimi destekleyen, yaralari onaran ve hayatta kalma gucunu artiran ustalik.\",
    element: \"force\",
    skills: [
      {
        slug: \"heal-azure-touch\",
        name: \"Turkuaz Dokunus\",
        description: \"Tek hedefe aninda kucuk bir iyilestirme uygular.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 12,
        cooldownSeconds: 3,
        requiredLevel: 1,
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"heal-vital-flow\",
        name: \"Hayat Akisi\",
        description: \"Kisa sureli hedefine saglik yenilenmesi artisi saglar.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 14,
        cooldownSeconds: 16,
        requiredLevel: 12,
        prerequisiteSlug: \"heal-azure-touch\",
        unlockCost: 1,
        rankCost: 1,
      },
      {
        slug: \"heal-life-pulse\",
        name: \"Yasam Nabzi\",
        description: \"Yakin muttefiklere periyodik iyilestirme gonderir.\",
        type: \"ACTIVE\",
        rankMax: 9,
        resourceCost: 20,
        cooldownSeconds: 10,
        requiredLevel: 24,
        prerequisiteSlug: \"heal-vital-flow\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"heal-purifying-wave\",
        name: \"Arindirici Dalga\",
        description: \"Zararli etkileri temizler ve ek saglik kazandirir.\",
        type: \"BUFF\",
        rankMax: 9,
        resourceCost: 18,
        cooldownSeconds: 24,
        requiredLevel: 36,
        prerequisiteSlug: \"heal-life-pulse\",
        unlockCost: 2,
        rankCost: 2,
      },
      {
        slug: \"heal-guardian-light\",
        name: \"Koruyucu Isik\",
        description: \"Sifa becerilerinin gucunu kalici olarak artirir.\",
        type: \"PASSIVE\",
        rankMax: 9,
        resourceCost: null,
        cooldownSeconds: null,
        requiredLevel: 52,
        prerequisiteSlug: \"heal-purifying-wave\",
        unlockCost: 3,
        rankCost: 3,
      },
    ],
  },
];


const regionsData = [
  {
    slug: "sutara",
    name: "Sutara Sığınağı",
    type: "CITY",
    description: "Süt yollarının kalbi; sıcak krem kazanları ve esans laboratuvarlarıyla bilinen ana kamp.",
    ambientTag: "amber-dawn",
    levelMin: 1,
    levelMax: 25,
    npcs: [
      {
        slug: "melta-braise",
        name: "Melta Braise",
        title: "Krem Ocağı Ustası",
        role: "equipment reforge",
        type: "BLACKSMITH",
        description: "Metal köpüğünü kılıç şekline sokan sabırlı usta.",
        shopListings: [
          { itemKey: "ITEM_CH_SWORD_01_A", price: 150, stock: 12 },
          { itemKey: "ITEM_CH_SWORD_01_B", price: 210, stock: 12 },
          { itemKey: "ITEM_CH_SWORD_01_C", price: 270, stock: 12 },
          { itemKey: "ITEM_CH_BLADE_01_A", price: 150, stock: 12 },
          { itemKey: "ITEM_CH_BLADE_01_B", price: 210, stock: 12 },
          { itemKey: "ITEM_CH_BLADE_01_C", price: 270, stock: 12 },
          { itemKey: "ITEM_CH_SPEAR_01_A", price: 165, stock: 12 },
          { itemKey: "ITEM_CH_SPEAR_01_B", price: 225, stock: 12 },
          { itemKey: "ITEM_CH_SPEAR_01_C", price: 285, stock: 12 },
          { itemKey: "ITEM_EU_SWORD_01_A", price: 150, stock: 12 },
          { itemKey: "ITEM_EU_SWORD_01_B", price: 210, stock: 12 },
          { itemKey: "ITEM_EU_SWORD_01_C", price: 270, stock: 12 },
          { itemKey: "ITEM_EU_AXE_01_A", price: 155, stock: 12 },
          { itemKey: "ITEM_EU_AXE_01_B", price: 215, stock: 12 },
          { itemKey: "ITEM_EU_AXE_01_C", price: 275, stock: 12 },
          { itemKey: "ITEM_EU_CROSSBOW_01_A", price: 170, stock: 10 },
          { itemKey: "ITEM_EU_CROSSBOW_01_B", price: 230, stock: 10 },
          { itemKey: "ITEM_EU_CROSSBOW_01_C", price: 290, stock: 10 },
        ],
      },
      {
        slug: "sevi-botanik",
        name: "Sevi Botanik",
        title: "Bitki Mahzeni Bekçisi",
        role: "alchemy supplies",
        type: "ALCHEMIST",
        description: "Şifalı otları krema ile macunlaştıran karışım uzmanı.",
        shopListings: [
          { itemKey: "ITEM_EVENT_HP_SUPERSET_2_BAG", price: 30, stock: 40 },
          { itemKey: "ITEM_EVENT_MP_SUPERSET_2_BAG", price: 30, stock: 40 },
          { itemKey: "ITEM_COS_P_CURE_ALL_01", price: 45, stock: 30 },
          { itemKey: "pasture-tonic", price: 10, stock: 40 },
        ],
      },
      {
        slug: "ithra-loom",
        name: "Ithra Loom",
        title: "Dokuma Başustası",
        role: "tailored armor",
        type: "TAILOR",
        description: "Süt ipliklerini ince zırhlara dönüştüren yaratıcı tasarımcı.",
        shopListings: [
          { itemKey: "ITEM_CH_M_LIGHT_01_HA_A", price: 85, stock: 16 },
          { itemKey: "ITEM_CH_M_LIGHT_01_HA_B", price: 110, stock: 16 },
          { itemKey: "ITEM_CH_M_LIGHT_01_HA_C", price: 135, stock: 16 },
          { itemKey: "ITEM_CH_M_LIGHT_01_BA_A", price: 95, stock: 16 },
          { itemKey: "ITEM_CH_M_LIGHT_01_BA_B", price: 120, stock: 16 },
          { itemKey: "ITEM_CH_M_LIGHT_01_BA_C", price: 145, stock: 16 },
          { itemKey: "ITEM_CH_M_LIGHT_01_LA_A", price: 95, stock: 16 },
          { itemKey: "ITEM_CH_M_LIGHT_01_LA_B", price: 120, stock: 16 },
          { itemKey: "ITEM_CH_M_LIGHT_01_LA_C", price: 145, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_HA_A", price: 90, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_HA_B", price: 115, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_HA_C", price: 140, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_BA_A", price: 100, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_BA_B", price: 125, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_BA_C", price: 150, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_LA_A", price: 100, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_LA_B", price: 125, stock: 16 },
          { itemKey: "ITEM_EU_M_LIGHT_01_LA_C", price: 150, stock: 16 },
        ],
      },
      {
        slug: "lakar-essensee",
        name: "Lakar Essensee",
        title: "Esans Bilgini",
        role: "arcane mentor",
        type: "SAGE",
        description: "Süt özlerinden büyüsel çizgiler dokuyan filozof.",
        shopListings: [],
      },
      {
        slug: "meri-gildleaf",
        name: "Meri Gildleaf",
        title: "Takı Ustası",
        role: "jeweler",
        type: "MERCHANT",
        description: "Bakır telleri süt damlalarıyla işleyip zarif takılara dönüştüren usta.",
        shopListings: [
          { itemKey: "ITEM_CH_RING_01_A", price: 55, stock: 24 },
          { itemKey: "ITEM_CH_RING_01_B", price: 80, stock: 24 },
          { itemKey: "ITEM_CH_RING_01_C", price: 105, stock: 24 },
          { itemKey: "ITEM_CH_EARRING_01_A", price: 55, stock: 24 },
          { itemKey: "ITEM_CH_EARRING_01_B", price: 80, stock: 24 },
          { itemKey: "ITEM_CH_EARRING_01_C", price: 105, stock: 24 },
          { itemKey: "ITEM_CH_NECKLACE_01_A", price: 60, stock: 18 },
          { itemKey: "ITEM_CH_NECKLACE_01_B", price: 85, stock: 18 },
          { itemKey: "ITEM_CH_NECKLACE_01_C", price: 110, stock: 18 },
          { itemKey: "ITEM_EU_RING_01_A", price: 55, stock: 24 },
          { itemKey: "ITEM_EU_RING_01_B", price: 80, stock: 24 },
          { itemKey: "ITEM_EU_RING_01_C", price: 105, stock: 24 },
          { itemKey: "ITEM_EU_EARRING_01_A", price: 55, stock: 24 },
          { itemKey: "ITEM_EU_EARRING_01_B", price: 80, stock: 24 },
          { itemKey: "ITEM_EU_EARRING_01_C", price: 105, stock: 24 },
          { itemKey: "ITEM_EU_NECKLACE_01_A", price: 60, stock: 18 },
          { itemKey: "ITEM_EU_NECKLACE_01_B", price: 85, stock: 18 },
          { itemKey: "ITEM_EU_NECKLACE_01_C", price: 110, stock: 18 },
        ],
      },
      {
        slug: "darin-caravaneer",
        name: "Darin Kervanbaşı",
        title: "Tuz Yolu Koordinatörü",
        role: "caravan broker",
        type: "MERCHANT",
        description:
          "Krem yollarındaki her mola taşını ezbere bilen, ticaret rotalarını düzenleyen kervan ustası.",
        shopListings: [
          { itemKey: "ITEM_ETC_TRADE_TK_01", price: 90, stock: 30 },
          { itemKey: "ITEM_ETC_TRADE_TK_02", price: 120, stock: 25 },
          { itemKey: "ITEM_ETC_TRADE_TK_03", price: 160, stock: 10 },
        ],
      },
      {
        slug: "selka-stablehand",
        name: "Selka Nalbant",
        title: "Süt Atları Terbiyecisi",
        role: "stable master",
        type: "MERCHANT",
        description:
          "Foamreach taylarını süt köpüğüyle sakinleştirip binicilere hazırlayan usta eğitici.",
        shopListings: [
          { itemKey: "ITEM_COS_T_HORSE1", price: 800, stock: 5 },
          { itemKey: "ITEM_COS_T_HORSE2", price: 1500, stock: 3 },
          { itemKey: "ITEM_COS_T_DHORSE1", price: 2200, stock: 2 },
        ],
      },
      {
        slug: "orin-huntmaster",
        name: "Orin Avbekçisi",
        title: "Pasture İz Süreni",
        role: "hunt quartermaster",
        type: "MERCHANT",
        description:
          "Çayır gölgelerinde iz sürüp avcı adaylarına dersler veren deneyimli yol gösterici.",
        shopListings: [
          { itemKey: "ITEM_ETC_AMMO_ARROW_01", price: 1, stock: 200 },
          { itemKey: "ITEM_ETC_AMMO_BOLT_01", price: 1, stock: 200 },
          { itemKey: "ITEM_EU_M_TRADE_HUNTER_01", price: 85, stock: 10 },
          { itemKey: "ITEM_EU_F_TRADE_HUNTER_01", price: 85, stock: 10 },
        ],
      },
      {
        slug: "melik-shadowhand",
        name: "Melik Gölgeel",
        title: "Gece Pazarı Temsilcisi",
        role: "underworld broker",
        type: "MERCHANT",
        description:
          "Süt kentinin karanlık geçitlerinde kaybolan eşyaları doğru ellere ulaştıran maharetli aracı.",
        shopListings: [
          { itemKey: "ITEM_EU_M_TRADE_THIEF_01", price: 85, stock: 10 },
          { itemKey: "ITEM_EU_F_TRADE_THIEF_01", price: 85, stock: 10 },
          { itemKey: "ITEM_CH_M_TRADE_THIEF_04", price: 75, stock: 12 },
          { itemKey: "ITEM_CH_W_TRADE_THIEF_04", price: 75, stock: 12 },
        ],
      },
    ],
    features: [
      {
        slug: "creamforge",
        name: "Krem Ocağı",
        type: "SERVICE",
        description: "Ekipman harmanlama ve güçlendirme merkezi.",
        npcSlug: "melta-braise",
        icon: "features/creamforge.png",
        position: { x: 0.62, y: 0.48 },
      },
      {
        slug: "herbward",
        name: "Bitki Mahzeni",
        type: "SERVICE",
        description: "İksir ve toniklerin depolandığı serin mahzen.",
        npcSlug: "sevi-botanik",
        icon: "features/herbward.png",
        position: { x: 0.44, y: 0.66 },
      },
      {
        slug: "loomquill",
        name: "Dokuma Atölyesi",
        type: "SERVICE",
        description: "Zırh tasarımlarının çizildiği süt dokuma tezgâhları.",
        npcSlug: "ithra-loom",
        icon: "features/loomquill.png",
        position: { x: 0.28, y: 0.42 },
      },
      {
        slug: "essencerie",
        name: "Esans Odası",
        type: "SERVICE",
        description: "Süt özlerinin damıtıldığı büyü laboratuvarı.",
        npcSlug: "lakar-essensee",
        icon: "features/essencerie.png",
        position: { x: 0.71, y: 0.28 },
      },
      {
        slug: "pastures-gate",
        name: "Çayır Kapısı",
        type: "GATE",
        description: "Foamreach Çayırları'na açılan büyük süt kapısı.",
        targetRegionSlug: "foamreach-pastures",
        icon: "features/gate.png",
        position: { x: 0.18, y: 0.74 },
      },
    ],
    travel: [
      {
        to: "curdora",
        description: "Süt kervan yolu boyunca Cur'dora Kervansarayı.",
        travelTime: 6,
      },
      {
        to: "wheywyn",
        description: "Köpük sularını aşarak Wheywyn Limanı'na giden yol.",
        travelTime: 4,
      },
      {
        to: "foamreach-pastures",
        description: "Foamreach Çayırları'na uzanan eğitim alanı.",
        travelTime: 2,
      },
    ],
  },
  {
    slug: "curdora",
    name: "Curdora Kervansarayı",
    type: "CITY",
    description: "Tuz kristalli ovada kurulmuş, tüccarların mola verdiği süt pazarı.",
    ambientTag: "salt-winds",
    levelMin: 5,
    levelMax: 35,
    npcs: [
      {
        slug: "brine-quartermaster",
        name: "Brine Quartermaster",
        title: "Kervan Mahzençisi",
        role: "trade broker",
        type: "MERCHANT",
        description: "Her süt damlasının değerini bilen, keskin dilli tacir.",
        shopListings: [{ itemKey: "pasture-tonic", price: 10, stock: 60 }],
      },
    ],
    features: [
      {
        slug: "salt-market",
        name: "Tuz Pazarı",
        type: "SERVICE",
        description: "Uzun yolculuklar için ihtiyaçların temin edildiği açık pazar.",
        npcSlug: "brine-quartermaster",
        icon: "features/market.png",
        position: { x: 0.53, y: 0.47 },
      },
      {
        slug: "pastures-trail",
        name: "Çayır Patikası",
        type: "GATE",
        description: "Foamreach Çayırları'na uzanan rüzgârlı patika.",
        targetRegionSlug: "foamreach-pastures",
        icon: "features/trail.png",
        position: { x: 0.36, y: 0.71 },
      },
    ],
    travel: [
      {
        to: "sutara",
        description: "Krem duvarlarının sıcağına dönen kervan yolu.",
        travelTime: 6,
      },
      {
        to: "foamreach-pastures",
        description: "Avcıların sıkça kullandığı eğitim rotası.",
        travelTime: 3,
      },
    ],
  },
  {
    slug: "wheywyn",
    name: "Wheywyn Limanı",
    type: "HARBOR",
    description: "Köpük dalgaları arasında süt tankerlerinin yanaştığı liman kasabası.",
    ambientTag: "foam-harbor",
    levelMin: 8,
    levelMax: 40,
    npcs: [
      {
        slug: "captain-foamline",
        name: "Captain Foamline",
        title: "Feribot Reisi",
        role: "ferry master",
        type: "FERRYMASTER",
        description: "Yüzen çiftliklere sefer düzenleyen deniz kurdu.",
        shopListings: [],
      },
      {
        slug: "dock-guard-maril",
        name: "Dock Guard Maril",
        title: "İskele Muhafızı",
        role: "security",
        type: "GUARD",
        description: "Limanı tehditlere karşı koruyan sert mizahlı nöbetçi.",
        shopListings: [],
      },
    ],
    features: [
      {
        slug: "foamline-ferry",
        name: "Foamline Feribotu",
        type: "FERRY",
        description: "Yüzen çiftliklere ulaşım sağlayan süt tanker feribotu.",
        npcSlug: "captain-foamline",
        icon: "features/ferry.png",
        position: { x: 0.58, y: 0.32 },
      },
      {
        slug: "harbor-gate",
        name: "Liman Kapısı",
        type: "GATE",
        description: "Sutara Sığınağı'na geri dönen kara geçidi.",
        targetRegionSlug: "sutara",
        icon: "features/gate.png",
        position: { x: 0.28, y: 0.74 },
      },
    ],
    travel: [
      {
        to: "sutara",
        description: "Kıyıyı takip eden sütlü şelaleler boyunca Sutara'ya dönüş rotası.",
        travelTime: 4,
      },
    ],
  },
  {
    slug: "foamreach-pastures",
    name: "Foamreach Çayırları",
    type: "FIELD",
    description: "Köpük sisle örtülü, yaratık dalgalarının sıkça görüldüğü eğitim arazisi.",
    ambientTag: "misty-meadow",
    levelMin: 3,
    levelMax: 18,
    npcs: [
      {
        slug: "warden-lira",
        name: "Warden Lira",
        title: "Çayır Muhafızı",
        role: "training overseer",
        type: "TRAINER",
        description: "Göçebeleri kontrollü yaratık dalgalarına karşı hazırlayan eğitmen.",
        shopListings: [],
      },
    ],
    features: [
      {
        slug: "training-rings",
        name: "Eğitim Halkaları",
        type: "TRAINING",
        description: "Yaratık dalgalarına karşı düzenlenen bölmeli alanlar.",
        npcSlug: "warden-lira",
        icon: "features/training.png",
        position: { x: 0.45, y: 0.52 },
      },
      {
        slug: "echoing-shrine",
        name: "Yankı Tapınağı",
        type: "LORE",
        description: "Süt fırtınalarının tarihini anlatan eski taş anıt.",
        icon: "features/shrine.png",
        position: { x: 0.66, y: 0.31 },
      },
    ],
    travel: [
      {
        to: "sutara",
        description: "Antrenman sonrası dinlenmek için Sutara'ya dönen patika.",
        travelTime: 2,
      },
      {
        to: "curdora",
        description: "Kervansaraya uzanan rüzgârlı ova.",
        travelTime: 3,
      },
    ],
  },
];

async function clearDatabase() {
  await prisma.characterSkill.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.session.deleteMany();
  await prisma.character.deleteMany();
  await prisma.originStartingItem.deleteMany();
  await prisma.shopListing.deleteMany();
  await prisma.regionFeature.deleteMany();
  await prisma.regionConnection.deleteMany();
  await prisma.npc.deleteMany();
  await prisma.region.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillDiscipline.deleteMany();
  await prisma.characterOrigin.deleteMany();
  await prisma.gameSetting.deleteMany();
  await prisma.item.deleteMany();
}

async function seedItems() {
  const aggregated = {
    baseItems: [],
    translations: [],
    requirements: [],
    stats: [],
    pricing: [],
    upgrades: [],
  };

  const jsonItems = loadItemDataset();
  if (jsonItems.length === 0) {
    console.warn(
      `[seed] items_full_clean.json bulunamadı ya da boş. Yalnızca örnek itemler yüklenecek.`,
    );
  }

  for (const jsonItem of jsonItems) {
    collectJsonItem(jsonItem, aggregated);
  }

  for (const customItem of itemsData) {
    collectCustomItem(customItem, aggregated);
  }

  await createManyChunked(prisma.item, aggregated.baseItems, 500, true);

  const slugs = aggregated.baseItems
    .map((entry) => entry.slug)
    .filter((slug) => typeof slug === "string" && slug.length > 0);

  const itemRecords = await prisma.item.findMany({
    where: { slug: { in: slugs } },
  });

  const idMap = new Map(itemRecords.map((record) => [record.slug, record.id]));

  const translationData = aggregated.translations
    .map((entry) => {
      const itemId = idMap.get(entry.slug);
      if (!itemId) return null;
      return {
        itemId,
        language: entry.language,
        name: entry.name,
        description: entry.description,
      };
    })
    .filter(Boolean);
  await createManyChunked(prisma.itemTranslation, translationData, 1000);

  const requirementData = aggregated.requirements
    .map((entry) => {
      const itemId = idMap.get(entry.slug);
      if (!itemId) return null;
      return {
        itemId,
        minLevel: entry.minLevel,
        masteryCode: entry.masteryCode,
        gender: entry.gender,
      };
    })
    .filter(
      (row) => row && (row.minLevel !== null || row.masteryCode || row.gender),
    );
  await createManyChunked(prisma.itemRequirement, requirementData, 1000);

  const statData = aggregated.stats
    .map((entry) => {
      const itemId = idMap.get(entry.slug);
      if (!itemId) return null;
      const { slug, ...rest } = entry;
      return { itemId, ...rest };
    })
    .filter(Boolean);
  await createManyChunked(prisma.itemStatProfile, statData, 500);

  const pricingData = aggregated.pricing
    .map((entry) => {
      const itemId = idMap.get(entry.slug);
      if (!itemId) return null;
      return {
        itemId,
        price: entry.price,
        stackSize: entry.stackSize,
        currency: entry.currency ?? "gold",
      };
    })
    .filter(Boolean);
  await createManyChunked(prisma.itemPricing, pricingData, 1000);

  const upgradeData = aggregated.upgrades
    .map((entry) => {
      const itemId = idMap.get(entry.slug);
      if (!itemId) return null;
      return {
        itemId,
        model: entry.model,
        tableKey: entry.tableKey,
        maxPlus: entry.maxPlus,
        formulaWhite: entry.formulaWhite,
        formulaReinforce: entry.formulaReinforce,
      };
    })
    .filter(
      (row) =>
        row &&
        (row.model ||
          row.tableKey ||
          row.maxPlus !== null ||
          row.formulaWhite ||
          row.formulaReinforce),
    );
  await createManyChunked(prisma.itemUpgradeProfile, upgradeData, 1000);

  console.log(
    `Seeded ${jsonItems.length} JSON item şablonu ve ${itemsData.length} özel item.`,
  );

  return new Map(itemRecords.map((record) => [record.slug, record]));
}

async function seedOrigins(itemMap) {
  const originMap = new Map();
  for (const origin of originsData) {
    const record = await prisma.characterOrigin.create({
      data: {
        slug: origin.slug,
        name: origin.name,
        description: origin.description,
        focus: origin.focus,
        affinity: origin.affinity,
      },
    });

    for (const starter of origin.startingItems) {
      const item = itemMap.get(starter.itemKey);
      if (!item) continue;

      await prisma.originStartingItem.create({
        data: {
          originId: record.id,
          itemId: item.id,
          quantity: starter.quantity ?? 1,
          slotIndex: starter.slotIndex ?? null,
        },
      });
    }

    originMap.set(origin.slug, record);
  }
  return originMap;
}

async function seedSkills() {
  const disciplineMap = new Map();
  const skillMap = new Map();
  const pendingPrereqs = [];

  for (const discipline of disciplinesData) {
    const disciplineRecord = await prisma.skillDiscipline.create({
      data: {
        slug: discipline.slug,
        name: discipline.name,
        description: discipline.description,
        element: discipline.element,
      },
    });

    disciplineMap.set(discipline.slug, disciplineRecord);

    for (const skill of discipline.skills) {
      const skillRecord = await prisma.skill.create({
        data: {
          slug: skill.slug,
        name: skill.name,
        description: skill.description,
        type: skill.type,
        rankMax: skill.rankMax,
        resourceCost: skill.resourceCost ?? null,
        cooldownSeconds: skill.cooldownSeconds ?? null,
        requiredLevel: skill.requiredLevel,
        unlockCost: skill.unlockCost ?? 0,
        rankCost: skill.rankCost ?? 0,
        discipline: { connect: { id: disciplineRecord.id } },
      },
    });

      skillMap.set(skill.slug, skillRecord);
      if (skill.prerequisiteSlug) {
        pendingPrereqs.push({
          slug: skill.slug,
          prerequisiteSlug: skill.prerequisiteSlug,
        });
      }
    }
  }

  for (const link of pendingPrereqs) {
    const skill = skillMap.get(link.slug);
    const prereq = skillMap.get(link.prerequisiteSlug);
    if (!skill || !prereq) continue;

    await prisma.skill.update({
      where: { id: skill.id },
      data: { prerequisiteId: prereq.id },
    });
  }

  return { disciplineMap, skillMap };
}

async function seedRegions(itemMap) {
  const regionMap = new Map();
  for (const region of regionsData) {
    const record = await prisma.region.create({
      data: {
        slug: region.slug,
        name: region.name,
        type: region.type,
        description: region.description,
        ambientTag: region.ambientTag,
        levelMin: region.levelMin ?? null,
        levelMax: region.levelMax ?? null,
      },
    });
    regionMap.set(region.slug, record);
  }

  // Connections
  for (const region of regionsData) {
    const fromRegion = regionMap.get(region.slug);
    if (!fromRegion) continue;

    for (const travel of region.travel) {
      const toRegion = regionMap.get(travel.to);
      if (!toRegion) continue;

      await prisma.regionConnection.create({
        data: {
          fromRegionId: fromRegion.id,
          toRegionId: toRegion.id,
          description: travel.description,
          travelTime: travel.travelTime ?? null,
          requirement: travel.requirement ?? null,
        },
      });
    }
  }

  const npcMap = new Map();
  const shopQueue = [];

  for (const region of regionsData) {
    const regionRecord = regionMap.get(region.slug);
    if (!regionRecord) continue;

    for (const npc of region.npcs) {
      const npcRecord = await prisma.npc.create({
        data: {
          slug: npc.slug,
          name: npc.name,
          title: npc.title ?? null,
          role: npc.role,
          type: npc.type,
          description: npc.description,
          region: { connect: { id: regionRecord.id } },
        },
      });

      npcMap.set(npc.slug, npcRecord);

      for (const listing of npc.shopListings) {
        shopQueue.push({
          npcSlug: npc.slug,
          itemKey: listing.itemKey,
          price: listing.price,
          stock: listing.stock ?? null,
        });
      }
    }
  }

  for (const region of regionsData) {
    const regionRecord = regionMap.get(region.slug);
    if (!regionRecord) continue;

    for (const feature of region.features) {
      const npcRecord = feature.npcSlug ? npcMap.get(feature.npcSlug) : null;
      const targetRegion = feature.targetRegionSlug
        ? regionMap.get(feature.targetRegionSlug)
        : null;

      await prisma.regionFeature.create({
        data: {
          regionId: regionRecord.id,
          slug: feature.slug,
          name: feature.name,
          type: feature.type,
          description: feature.description,
          icon: feature.icon ?? null,
          npcId: npcRecord ? npcRecord.id : null,
          targetRegionId: targetRegion ? targetRegion.id : null,
          posX: feature.position ? feature.position.x : null,
          posY: feature.position ? feature.position.y : null,
        },
      });
    }
  }

  for (const listing of shopQueue) {
    const npcRecord = npcMap.get(listing.npcSlug);
    const itemRecord = itemMap.get(listing.itemKey);
    if (!npcRecord || !itemRecord) continue;

    await prisma.shopListing.create({
      data: {
        npcId: npcRecord.id,
        itemId: itemRecord.id,
        price: listing.price,
        stock: listing.stock,
      },
    });
  }

  return { regionMap, npcMap };
}

async function seedGameSettings() {
  const maxLevelSetting = {
    current: 50,
    plannedCaps: [60, 70, 80, 90],
  };

  await prisma.gameSetting.upsert({
    where: { key: \"maxCharacterLevel\" },
    update: {
      value: maxLevelSetting,
      description:
        \"Maksimum karakter seviyesi ve gelecekteki genisletme plani.\",
    },
    create: {
      key: \"maxCharacterLevel\",
      value: maxLevelSetting,
      description:
        \"Maksimum karakter seviyesi ve gelecekteki genisletme plani.\",
    },
  });

  await prisma.gameSetting.upsert({
    where: { key: \"skillMasteryMultiplier\" },
    update: {
      value: masteryMultiplierSetting,
      description: \"Karakter seviyesi ile carpilan toplam ustalik limiti carpani.\",
    },
    create: {
      key: \"skillMasteryMultiplier\",
      value: masteryMultiplierSetting,
      description: \"Karakter seviyesi ile carpilan toplam ustalik limiti carpani.\",
    },
  });
}

async function main() {
  console.log("Resetting Milkroad data...");
  await clearDatabase();

  console.log("Seeding items...");
  const itemMap = await seedItems();

  console.log("Seeding game settings...");
  await seedGameSettings();

  console.log("Seeding origins...");
  await seedOrigins(itemMap);

  console.log("Seeding skills...");
  await seedSkills();

  console.log("Seeding regions and NPCs...");
  await seedRegions(itemMap);

  console.log("Milkroad seed completed.");
}

main()
  .catch((error) => {
    console.error("Milkroad seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


