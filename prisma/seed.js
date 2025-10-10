/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const itemsData = [
  {
    key: "sun-threaded-tachi",
    name: "Sun-Threaded Tachi",
    type: "WEAPON",
    rarity: "rare",
    icon: "weapons/sun-threaded-tachi.png",
    levelRequirement: 1,
    description: "A curved blade braided with dawnlight filaments.",
  },
  {
    key: "lunaquill-focus",
    name: "Lunaquill Focus",
    type: "WEAPON",
    rarity: "uncommon",
    icon: "focus/lunaquill-focus.png",
    levelRequirement: 1,
    description: "Crystalline quill that pours moonlit ink into the air.",
  },
  {
    key: "stormbound-glaive",
    name: "Stormbound Glaive",
    type: "WEAPON",
    rarity: "rare",
    icon: "polearm/stormbound-glaive.png",
    levelRequirement: 1,
    description: "Twin-pronged spear wrapped in captive squalls.",
  },
  {
    key: "curdled-helm",
    name: "Curdled Helm",
    type: "HEAD",
    rarity: "common",
    icon: "armor/curdled-helm.png",
    levelRequirement: 1,
    description: "Polished whey-steel helm lined with goat wool.",
  },
  {
    key: "creamguard-vest",
    name: "Creamguard Vest",
    type: "BODY",
    rarity: "common",
    icon: "armor/creamguard-vest.png",
    levelRequirement: 1,
    description: "Layered hide armor treated with thick cream resin.",
  },
  {
    key: "wheyglass-amulet",
    name: "Wheyglass Amulet",
    type: "ACCESSORY",
    rarity: "uncommon",
    icon: "accessories/wheyglass-amulet.png",
    levelRequirement: 1,
    description: "Prismatic charm that echoes tides from a single droplet.",
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
    name: "G\u00fcn Dokuyucusu G\u00f6\u00e7ebe",
    description: "Arnavut g\u00fcne\u015f \u00e7\u00f6llerinde s\u00fct \u0131\u015f\u0131\u011f\u0131n\u0131 e\u011fip b\u00fckerek yol a\u00e7an usta gezginler.",
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
    name: "Ay S\u00fcz\u00fcl\u00fc Kahini",
    description: "Karanl\u0131k g\u00f6llerden toplad\u0131klar\u0131 s\u00fct yans\u0131malar\u0131yla b\u00fcy\u00fc tezg\u00e2hlayan biliciler.",
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
    name: "F\u0131rt\u0131nado\u011fan Muhaf\u0131z",
    description: "S\u00fct f\u0131rt\u0131nalar\u0131n\u0131n ortas\u0131nda gemileri koruyan, a\u011f\u0131r z\u0131rhl\u0131 s\u00fct \u015f\u00f6valyeleri.",
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
    name: "Aurora Dokumas\u0131",
    description: "\u015eafak k\u0131v\u0131lc\u0131mlar\u0131n\u0131 s\u00fct ipliklerine i\u015fleyip parlak sald\u0131r\u0131lar \u00fcreten disiplin.",
    element: "solar",
    skills: [
      {
        slug: "luminous-thread",
        name: "Luminous Thread",
        description: "Rak\u0131mdan s\u00fcz\u00fclen \u0131\u015f\u0131k ipli\u011fi ileri uzanarak hedefe zarar verir.",
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
        description: "I\u015f\u0131k perdesi, yak\u0131n m\u00fcttefiklere k\u0131sa s\u00fcreli s\u00fct z\u0131rh\u0131 kazand\u0131r\u0131r.",
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
        description: "\u015eafa\u011f\u0131n \u00e7an\u0131n\u0131 \u00e7alarak geni\u015f bir alan\u0131 ayd\u0131nlat\u0131r ve d\u00fc\u015fmanlar\u0131 sersemletir.",
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
    name: "Gelgit Birli\u011fi",
    description: "Ay\u0131n s\u00fct sular\u0131yla kurdu\u011fu ba\u011f\u0131 kullanarak iyile\u015ftirici dalgalar yayan disiplin.",
    element: "lunar",
    skills: [
      {
        slug: "ebb-surge",
        name: "Ebb Surge",
        description: "Se\u00e7ilen hedefin etraf\u0131nda iyile\u015ftirici s\u00fct kabarc\u0131klar\u0131 dola\u015ft\u0131r\u0131r.",
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
        description: "Ay kuyusundan \u00e7ekilen savunma kabu\u011fu, gelen hasar\u0131 azalt\u0131r.",
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
        description: "Uzun s\u00fcreli odaklanmayla grup enerjisini yeniler.",
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
    name: "F\u0131rt\u0131na Muhaf\u0131zl\u0131\u011f\u0131",
    description: "R\u00fczg\u00e2r\u0131n s\u00fct k\u00f6p\u00fc\u011f\u00fcn\u00fc keskin hatlarla y\u00f6nlendiren savunmac\u0131 disiplin.",
    element: "tempest",
    skills: [
      {
        slug: "gust-step",
        name: "Gust Step",
        description: "Karaktere k\u0131sa s\u00fcreli h\u0131z ve ka\u00e7\u0131nma sa\u011flar.",
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
        description: "Hedefe do\u011fru girdap olu\u015fturan bir m\u0131zrak f\u0131rlat\u0131r.",
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
        description: "Grup \u00e7evresine d\u00f6nen s\u00fct bariyerleri yerle\u015ftirir.",
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
    name: "Sutara S\u0131\u011f\u0131na\u011f\u0131",
    type: "CITY",
    description: "S\u00fct yollar\u0131n\u0131n kalbi; s\u0131cak krem kazanlar\u0131 ve esans laboratuvarlar\u0131yla bilinen ana kamp.",
    ambientTag: "amber-dawn",
    levelMin: 1,
    levelMax: 25,
    npcs: [
      {
        slug: "melta-braise",
        name: "Melta Braise",
        title: "Krem Oca\u011f\u0131 Ustas\u0131",
        role: "equipment reforge",
        type: "BLACKSMITH",
        description: "Metal k\u00f6p\u00fc\u011f\u00fcn\u00fc k\u0131l\u0131\u00e7 \u015fekline sokan sab\u0131rl\u0131 usta.",
        shopListings: [
          { itemKey: "sun-threaded-tachi", price: 180 },
          { itemKey: "creamguard-vest", price: 120 },
        ],
      },
      {
        slug: "sevi-botanik",
        name: "Sevi Botanik",
        title: "Bitki Mahzeni Bek\u00e7isi",
        role: "alchemy supplies",
        type: "ALCHEMIST",
        description: "\u015eifal\u0131 otlar\u0131 krema ile macunla\u015ft\u0131ran kar\u0131\u015f\u0131m uzman\u0131.",
        shopListings: [{ itemKey: "pasture-tonic", price: 18, stock: 40 }],
      },
      {
        slug: "ithra-loom",
        name: "Ithra Loom",
        title: "Dokuma Ba\u015fustas\u0131",
        role: "tailored armor",
        type: "TAILOR",
        description: "S\u00fct ipliklerini ince z\u0131rhlara d\u00f6n\u00fc\u015ft\u00fcren yarat\u0131c\u0131 tasar\u0131mc\u0131.",
        shopListings: [
          { itemKey: "curdled-helm", price: 95 },
          { itemKey: "wheyglass-amulet", price: 210 },
        ],
      },
      {
        slug: "lakar-essensee",
        name: "Lakar Essensee",
        title: "Esans Bilgini",
        role: "arcane mentor",
        type: "SAGE",
        description: "S\u00fct \u00f6zlerinden b\u00fcy\u00fcsel \u00e7izgiler dokuyan filozof.",
        shopListings: [],
      },
    ],
    features: [
      {
        slug: "creamforge",
        name: "Krem Oca\u011f\u0131",
        type: "SERVICE",
        description: "Ekipman harmanlama ve g\u00fc\u00e7lendirme merkezi.",
        npcSlug: "melta-braise",
        icon: "features/creamforge.png",
        position: { x: 0.62, y: 0.48 },
      },
      {
        slug: "herbward",
        name: "Bitki Mahzeni",
        type: "SERVICE",
        description: "\u0130ksir ve toniklerin depoland\u0131\u011f\u0131 serin mahzen.",
        npcSlug: "sevi-botanik",
        icon: "features/herbward.png",
        position: { x: 0.44, y: 0.66 },
      },
      {
        slug: "loomquill",
        name: "Dokuma At\u00f6lyesi",
        type: "SERVICE",
        description: "Z\u0131rh tasar\u0131mlar\u0131n\u0131n \u00e7izildi\u011fi s\u00fct dokuma tezg\u00e2hlar\u0131.",
        npcSlug: "ithra-loom",
        icon: "features/loomquill.png",
        position: { x: 0.28, y: 0.42 },
      },
      {
        slug: "essencerie",
        name: "Esans Odas\u0131",
        type: "SERVICE",
        description: "S\u00fct \u00f6zlerinin dam\u0131t\u0131ld\u0131\u011f\u0131 b\u00fcy\u00fc laboratuvar\u0131.",
        npcSlug: "lakar-essensee",
        icon: "features/essencerie.png",
        position: { x: 0.71, y: 0.28 },
      },
      {
        slug: "pastures-gate",
        name: "\u00c7ay\u0131r Kap\u0131s\u0131",
        type: "GATE",
        description: "Foamreach \u00c7ay\u0131rlar\u0131'na a\u00e7\u0131lan b\u00fcy\u00fck s\u00fct kap\u0131s\u0131.",
        targetRegionSlug: "foamreach-pastures",
        icon: "features/gate.png",
        position: { x: 0.18, y: 0.74 },
      },
    ],
    travel: [
      {
        to: "curdora",
        description: "S\u00fct kervan yolu boyunca Cur'dora Kervansaray\u0131.",
        travelTime: 6,
      },
      {
        to: "wheywyn",
        description: "K\u00f6p\u00fck sular\u0131n\u0131 a\u015farak Wheywyn Liman\u0131'na giden yol.",
        travelTime: 4,
      },
      {
        to: "foamreach-pastures",
        description: "Foamreach \u00c7ay\u0131rlar\u0131'na uzanan e\u011fitim alan\u0131.",
        travelTime: 2,
      },
    ],
  },
  {
    slug: "curdora",
    name: "Curdora Kervansaray\u0131",
    type: "CITY",
    description: "Tuz kristalli ovada kurulmu\u015f, t\u00fcccarlar\u0131n mola verdi\u011fi s\u00fct pazar\u0131.",
    ambientTag: "salt-winds",
    levelMin: 5,
    levelMax: 35,
    npcs: [
      {
        slug: "brine-quartermaster",
        name: "Brine Quartermaster",
        title: "Kervan Mahzen\u00e7isi",
        role: "trade broker",
        type: "MERCHANT",
        description: "Her s\u00fct damlas\u0131n\u0131n de\u011ferini bilen, keskin dilli tacir.",
        shopListings: [
          { itemKey: "pasture-tonic", price: 16, stock: 60 },
          { itemKey: "wheyglass-amulet", price: 205 },
        ],
      },
    ],
    features: [
      {
        slug: "salt-market",
        name: "Tuz Pazar\u0131",
        type: "SERVICE",
        description: "Uzun yolculuklar i\u00e7in ihtiya\u00e7lar\u0131n temin edildi\u011fi a\u00e7\u0131k pazar.",
        npcSlug: "brine-quartermaster",
        icon: "features/market.png",
        position: { x: 0.53, y: 0.47 },
      },
      {
        slug: "pastures-trail",
        name: "\u00c7ay\u0131r Patikas\u0131",
        type: "GATE",
        description: "Foamreach \u00c7ay\u0131rlar\u0131'na uzanan r\u00fczg\u00e2rl\u0131 patika.",
        targetRegionSlug: "foamreach-pastures",
        icon: "features/trail.png",
        position: { x: 0.36, y: 0.71 },
      },
    ],
    travel: [
      {
        to: "sutara",
        description: "Krem duvarlar\u0131n\u0131n s\u0131ca\u011f\u0131na d\u00f6nen kervan yolu.",
        travelTime: 6,
      },
      {
        to: "foamreach-pastures",
        description: "Avc\u0131lar\u0131n s\u0131k\u00e7a kulland\u0131\u011f\u0131 e\u011fitim rotas\u0131.",
        travelTime: 3,
      },
    ],
  },
  {
    slug: "wheywyn",
    name: "Wheywyn Liman\u0131",
    type: "HARBOR",
    description: "K\u00f6p\u00fck dalgalar\u0131 aras\u0131nda s\u00fct tankerlerinin yana\u015ft\u0131\u011f\u0131 liman kasabas\u0131.",
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
        description: "Y\u00fczen \u00e7iftliklere sefer d\u00fczenleyen deniz kurdu.",
        shopListings: [],
      },
      {
        slug: "dock-guard-maril",
        name: "Dock Guard Maril",
        title: "\u0130skele Muhaf\u0131z\u0131",
        role: "security",
        type: "GUARD",
        description: "Liman\u0131 tehditlere kar\u015f\u0131 koruyan sert mizahl\u0131 n\u00f6bet\u00e7i.",
        shopListings: [],
      },
    ],
    features: [
      {
        slug: "foamline-ferry",
        name: "Foamline Feribotu",
        type: "FERRY",
        description: "Y\u00fczen \u00e7iftliklere ula\u015f\u0131m sa\u011flayan s\u00fct tanker feribotu.",
        npcSlug: "captain-foamline",
        icon: "features/ferry.png",
        position: { x: 0.58, y: 0.32 },
      },
      {
        slug: "harbor-gate",
        name: "Liman Kap\u0131s\u0131",
        type: "GATE",
        description: "Sutara S\u0131\u011f\u0131na\u011f\u0131'na geri d\u00f6nen kara ge\u00e7idi.",
        targetRegionSlug: "sutara",
        icon: "features/gate.png",
        position: { x: 0.28, y: 0.74 },
      },
    ],
    travel: [
      {
        to: "sutara",
        description: "K\u0131y\u0131y\u0131 takip eden s\u00fctl\u00fc \u015felaleler boyunca Sutara'ya d\u00f6n\u00fc\u015f rotas\u0131.",
        travelTime: 4,
      },
    ],
  },
  {
    slug: "foamreach-pastures",
    name: "Foamreach \u00c7ay\u0131rlar\u0131",
    type: "FIELD",
    description: "K\u00f6p\u00fck sisle \u00f6rt\u00fcl\u00fc, yarat\u0131k dalgalar\u0131n\u0131n s\u0131k\u00e7a g\u00f6r\u00fcld\u00fc\u011f\u00fc e\u011fitim arazisi.",
    ambientTag: "misty-meadow",
    levelMin: 3,
    levelMax: 18,
    npcs: [
      {
        slug: "warden-lira",
        name: "Warden Lira",
        title: "\u00c7ay\u0131r Muhaf\u0131z\u0131",
        role: "training overseer",
        type: "TRAINER",
        description: "G\u00f6\u00e7ebeleri kontroll\u00fc yarat\u0131k dalgalar\u0131na kar\u015f\u0131 haz\u0131rlayan e\u011fitmen.",
        shopListings: [],
      },
    ],
    features: [
      {
        slug: "training-rings",
        name: "E\u011fitim Halkalar\u0131",
        type: "TRAINING",
        description: "Yarat\u0131k dalgalar\u0131na kar\u015f\u0131 d\u00fczenlenen b\u00f6lmeli alanlar.",
        npcSlug: "warden-lira",
        icon: "features/training.png",
        position: { x: 0.45, y: 0.52 },
      },
      {
        slug: "echoing-shrine",
        name: "Yank\u0131 Tap\u0131na\u011f\u0131",
        type: "LORE",
        description: "S\u00fct f\u0131rt\u0131nalar\u0131n\u0131n tarihini anlatan eski ta\u015f an\u0131t.",
        icon: "features/shrine.png",
        position: { x: 0.66, y: 0.31 },
      },
    ],
    travel: [
      {
        to: "sutara",
        description: "Antrenman sonras\u0131 dinlenmek i\u00e7in Sutara'ya d\u00f6nen patika.",
        travelTime: 2,
      },
      {
        to: "curdora",
        description: "Kervansaraya uzanan r\u00fczg\u00e2rl\u0131 ova.",
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
  await prisma.item.deleteMany();
}

async function seedItems() {
  const itemMap = new Map();
  for (const item of itemsData) {
    const record = await prisma.item.create({
      data: {
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        icon: item.icon,
        levelRequirement: item.levelRequirement,
        description: item.description,
      },
    });
    itemMap.set(item.key, record);
  }
  return itemMap;
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

async function main() {
  console.log("Resetting Milkroad data...");
  await clearDatabase();

  console.log("Seeding items...");
  const itemMap = await seedItems();

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
