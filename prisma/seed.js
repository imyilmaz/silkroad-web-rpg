/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ITEMS_JSON_PATH = path.join(__dirname, "..", "items_full_clean.json");
const DEFAULT_ICON_PATH = "assets/no-image.svg";

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
  { keyword: "RING", slot: "RING_1" },
  { keyword: "EARRING", slot: "EARRING" },
  { keyword: "NECKLACE", slot: "NECK" },
  { keyword: "AMULET", slot: "NECK" },
];

const TWO_HANDED_WEAPON_TYPES = new Set([
  "weapon/bow",
  "weapon/spear",
  "weapon/staff",
]);

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

  aggregated.baseItems.push({
    slug,
    codeName: item.codeName ?? null,
    stringNameKey: item.stringID?.name ?? null,
    stringDescKey: item.stringID?.desc ?? null,
    name: primaryName,
    type: mapItemType(item),
    rarity: meta.rarity ?? null,
    icon: item.visual?.icon ?? DEFAULT_ICON_PATH,
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
  aggregated.baseItems.push({
    slug,
    codeName: item.codeName ?? slug.toUpperCase(),
    stringNameKey: null,
    stringDescKey: null,
    name,
    type: item.type ?? "ETC",
    rarity: item.rarity ?? null,
    icon: item.icon ?? DEFAULT_ICON_PATH,
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
    key: "sun-threaded-tachi",
    name: "Sun-Threaded Tachi",
    type: "WEAPON",
    rarity: "rare",
    icon: "weapons/sun-threaded-tachi.png",
    levelRequirement: 1,
    description: "A curved blade braided with dawnlight filaments.",
    equipmentSlot: "WEAPON_MAIN",
    handsRequired: 2,
  },
  {
    key: "lunaquill-focus",
    name: "Lunaquill Focus",
    type: "WEAPON",
    rarity: "uncommon",
    icon: "focus/lunaquill-focus.png",
    levelRequirement: 1,
    description: "Crystalline quill that pours moonlit ink into the air.",
    equipmentSlot: "WEAPON_MAIN",
    handsRequired: 1,
  },
  {
    key: "stormbound-glaive",
    name: "Stormbound Glaive",
    type: "WEAPON",
    rarity: "rare",
    icon: "polearm/stormbound-glaive.png",
    levelRequirement: 1,
    description: "Twin-pronged spear wrapped in captive squalls.",
    equipmentSlot: "WEAPON_MAIN",
    handsRequired: 2,
  },
  {
    key: "curdled-helm",
    name: "Curdled Helm",
    type: "HEAD",
    rarity: "common",
    icon: "armor/curdled-helm.png",
    levelRequirement: 1,
    description: "Polished whey-steel helm lined with goat wool.",
    equipmentSlot: "HEAD",
  },
  {
    key: "creamguard-vest",
    name: "Creamguard Vest",
    type: "BODY",
    rarity: "common",
    icon: "armor/creamguard-vest.png",
    levelRequirement: 1,
    description: "Layered hide armor treated with thick cream resin.",
    equipmentSlot: "CHEST",
  },
  {
    key: "wheyglass-amulet",
    name: "Wheyglass Amulet",
    type: "ACCESSORY",
    rarity: "uncommon",
    icon: "accessories/wheyglass-amulet.png",
    levelRequirement: 1,
    description: "Prismatic charm that echoes tides from a single droplet.",
    equipmentSlot: "NECK",
  },
  {
    key: "pasture-tonic",
    name: "Pasture Tonic",
    type: "CONSUMABLE",
    rarity: "common",
    icon: "consumables/pasture-tonic.png",
    levelRequirement: 1,
    description: "Hearty blend of grassmilk and herbs that restores vigor.",
  },
];

const originsData = [
  {
    slug: "sunweaver-nomad",
    name: "Gün Dokuyucusu Göçebe",
    description: "Arnavut güneş çöllerinde süt ışığını eğip bükerek yol açan usta gezginler.",
    focus: "haste and melee weaving",
    affinity: "solar",
    startingItems: [
      { itemKey: "sun-threaded-tachi", quantity: 1, slotIndex: 0 },
      { itemKey: "creamguard-vest", quantity: 1, slotIndex: 8 },
      { itemKey: "pasture-tonic", quantity: 3 },
    ],
  },
  {
    slug: "moondrift-oracle",
    name: "Ay Süzülü Kahini",
    description: "Karanlık göllerden topladıkları süt yansımalarıyla büyü tezgâhlayan biliciler.",
    focus: "supportive rituals",
    affinity: "lunar",
    startingItems: [
      { itemKey: "lunaquill-focus", quantity: 1, slotIndex: 0 },
      { itemKey: "wheyglass-amulet", quantity: 1, slotIndex: 9 },
      { itemKey: "pasture-tonic", quantity: 3 },
    ],
  },
  {
    slug: "stormborne-guard",
    name: "Fırtınadoğan Muhafız",
    description: "Süt fırtınalarının ortasında gemileri koruyan, ağır zırhlı süt şövalyeleri.",
    focus: "area control",
    affinity: "tempest",
    startingItems: [
      { itemKey: "stormbound-glaive", quantity: 1, slotIndex: 0 },
      { itemKey: "curdled-helm", quantity: 1, slotIndex: 7 },
      { itemKey: "pasture-tonic", quantity: 3 },
    ],
  },
];

const disciplinesData = [
  {
    slug: "aurora-weaving",
    name: "Aurora Dokuması",
    description: "Şafak kıvılcımlarını süt ipliklerine işleyip parlak saldırılar üreten disiplin.",
    element: "solar",
    skills: [
      {
        slug: "luminous-thread",
        name: "Luminous Thread",
        description: "Rakımdan süzülen ışık ipliği ileri uzanarak hedefe zarar verir.",
        type: "ACTIVE",
        rankMax: 5,
        resourceCost: 8,
        cooldownSeconds: 3,
        requiredLevel: 1,
        unlockCost: 120,
        rankCost: 40,
      },
      {
        slug: "sunshroud-aegis",
        name: "Sunshroud Aegis",
        description: "Işık perdesi, yakın müttefiklere kısa süreli süt zırhı kazandırır.",
        type: "BUFF",
        rankMax: 3,
        resourceCost: 5,
        cooldownSeconds: 15,
        requiredLevel: 3,
        prerequisiteSlug: "luminous-thread",
        unlockCost: 220,
        rankCost: 70,
      },
      {
        slug: "dawnflare-resonance",
        name: "Dawnflare Resonance",
        description: "Şafağın çanını çalarak geniş bir alanı aydınlatır ve düşmanları sersemletir.",
        type: "ACTIVE",
        rankMax: 3,
        resourceCost: 16,
        cooldownSeconds: 20,
        requiredLevel: 5,
        prerequisiteSlug: "sunshroud-aegis",
        unlockCost: 350,
        rankCost: 110,
      },
    ],
  },
  {
    slug: "tidal-communion",
    name: "Gelgit Birliği",
    description: "Ayın süt sularıyla kurduğu bağı kullanarak iyileştirici dalgalar yayan disiplin.",
    element: "lunar",
    skills: [
      {
        slug: "ebb-surge",
        name: "Ebb Surge",
        description: "Seçilen hedefin etrafında iyileştirici süt kabarcıkları dolaştırır.",
        type: "ACTIVE",
        rankMax: 4,
        resourceCost: 10,
        cooldownSeconds: 6,
        requiredLevel: 1,
        unlockCost: 100,
        rankCost: 35,
      },
      {
        slug: "moonwell-shell",
        name: "Moonwell Shell",
        description: "Ay kuyusundan çekilen savunma kabuğu, gelen hasarı azaltır.",
        type: "BUFF",
        rankMax: 3,
        resourceCost: 12,
        cooldownSeconds: 18,
        requiredLevel: 4,
        prerequisiteSlug: "ebb-surge",
        unlockCost: 210,
        rankCost: 65,
      },
      {
        slug: "tidecall-channel",
        name: "Tidecall Channel",
        description: "Uzun süreli odaklanmayla grup enerjisini yeniler.",
        type: "PASSIVE",
        rankMax: 3,
        resourceCost: null,
        cooldownSeconds: null,
        requiredLevel: 6,
        prerequisiteSlug: "moonwell-shell",
        unlockCost: 260,
        rankCost: 90,
      },
    ],
  },
  {
    slug: "tempest-guard",
    name: "Fırtına Muhafızlığı",
    description: "Rüzgârın süt köpüğünü keskin hatlarla yönlendiren savunmacı disiplin.",
    element: "tempest",
    skills: [
      {
        slug: "gust-step",
        name: "Gust Step",
        description: "Karaktere kısa süreli hız ve kaçınma sağlar.",
        type: "PASSIVE",
        rankMax: 4,
        resourceCost: null,
        cooldownSeconds: null,
        requiredLevel: 1,
        unlockCost: 80,
        rankCost: 30,
      },
      {
        slug: "cyclone-lance",
        name: "Cyclone Lance",
        description: "Hedefe doğru girdap oluşturan bir mızrak fırlatır.",
        type: "ACTIVE",
        rankMax: 3,
        resourceCost: 14,
        cooldownSeconds: 8,
        requiredLevel: 3,
        prerequisiteSlug: "gust-step",
        unlockCost: 200,
        rankCost: 60,
      },
      {
        slug: "stormwall-stance",
        name: "Stormwall Stance",
        description: "Grup çevresine dönen süt bariyerleri yerleştirir.",
        type: "BUFF",
        rankMax: 2,
        resourceCost: 18,
        cooldownSeconds: 22,
        requiredLevel: 6,
        prerequisiteSlug: "cyclone-lance",
        unlockCost: 320,
        rankCost: 100,
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
        shopListings: [],
      },
      {
        slug: "sevi-botanik",
        name: "Sevi Botanik",
        title: "Bitki Mahzeni Bekçisi",
        role: "alchemy supplies",
        type: "ALCHEMIST",
        description: "Şifalı otları krema ile macunlaştıran karışım uzmanı.",
        shopListings: [{ itemKey: "pasture-tonic", price: 10, stock: 40 }],
      },
      {
        slug: "ithra-loom",
        name: "Ithra Loom",
        title: "Dokuma Başustası",
        role: "tailored armor",
        type: "TAILOR",
        description: "Süt ipliklerini ince zırhlara dönüştüren yaratıcı tasarımcı.",
        shopListings: [],
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
    where: { key: "maxCharacterLevel" },
    update: {
      value: maxLevelSetting,
      description:
        "Maksimum karakter seviyesi ve gelecekteki genişletme planı.",
    },
    create: {
      key: "maxCharacterLevel",
      value: maxLevelSetting,
      description:
        "Maksimum karakter seviyesi ve gelecekteki genişletme planı.",
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
