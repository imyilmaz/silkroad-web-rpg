export type GrindPhase = {
  title: string;
  description: string;
  checklist?: string[];
};

export type GrindRewards = {
  expPerHour: number;
  spPerHour: number;
  goldPerHour: number;
  dropsPerHour: number;
};

export type GrindSpot = {
  name: string;
  regionSlug: string;
  coordinates?: string;
  mobs: string[];
  recommendedStats: {
    str?: number;
    int?: number;
    weapon?: string;
  };
  notes?: string;
  expLabel?: string;
  drops?: string[];
  rewards: GrindRewards;
};

export type GrindRoute = {
  id: string;
  levelRange: {
    min: number;
    max: number;
  };
  title: string;
  focus: string;
  difficulty: "kolay" | "orta" | "zor";
  preparation: GrindPhase[];
  primarySpot: GrindSpot;
  alternativeSpots?: GrindSpot[];
  milestones?: GrindPhase[];
};

export const grindRoutes: GrindRoute[] = [
  {
    id: "lv1-3",
    levelRange: { min: 1, max: 3 },
    title: "Sutara Outskirts",
    focus: "Starter combat and potion stock",
    difficulty: "kolay",
    preparation: [
      {
        title: "Starter Gear",
        description:
          "Equip the origin weapon and buy at least 10 HP/MP potions from the city vendor.",
        checklist: [
          "Starter weapon equipped",
          "10 small HP potions",
          "10 small MP potions",
        ],
      },
      {
        title: "Skill Assignment",
        description:
          "Pick the basic single target skill that matches your STR or INT focus.",
      },
    ],
    primarySpot: {
      name: "Outer Gate Wolves",
      regionSlug: "sutara",
      coordinates: "X:118, Y:94",
      mobs: ["Rookie Wolf", "Sand Wolf"],
      recommendedStats: {
        str: 2,
        int: 1,
        weapon: "Starter blade or staff",
      },
      notes: "Low damage mobs, natural regen often enough.",
      expLabel: "~6.2k",
      drops: ["Wolf Mane", "Small potion", "Copper coin"],
      rewards: {
        expPerHour: 6200,
        spPerHour: 80,
        goldPerHour: 450,
        dropsPerHour: 3,
      },
    },
    alternativeSpots: [
      {
        name: "Goblin Trapper Camp",
        regionSlug: "sutara",
        coordinates: "X:110, Y:102",
        mobs: ["Tiny Goblin"],
        recommendedStats: {
          str: 1,
          int: 2,
          weapon: "Staff or talisman",
        },
        notes: "Elemental weakness makes it ideal for INT builds.",
        drops: ["Goblin fang", "Cotton cloth"],
        rewards: {
          expPerHour: 5800,
          spPerHour: 75,
          goldPerHour: 380,
          dropsPerHour: 2,
        },
      },
    ],
    milestones: [
      {
        title: "Reach Level 3",
        description: "Distribute the new stat points and confirm your build direction.",
      },
    ],
  },
  {
    id: "lv3-6",
    levelRange: { min: 3, max: 6 },
    title: "Northern Ridges",
    focus: "Denser spawns and first accessory drops",
    difficulty: "kolay",
    preparation: [
      {
        title: "Gear Check",
        description: "Upgrade to the level 3 weapon and refresh armor durability.",
        checklist: ["Level 3 weapon equipped", "Armor durability above 70%"],
      },
      {
        title: "Stat Reminder",
        description:
          "Spend the 3 stat points with a 2 STR / 1 INT split for STR builds or the inverse for INT builds.",
      },
    ],
    primarySpot: {
      name: "Rock Ant Nest",
      regionSlug: "sutara",
      coordinates: "X:124, Y:86",
      mobs: ["Rock Ant", "Ant Soldier"],
      recommendedStats: {
        str: 5,
        int: 4,
        weapon: "Level 3 weapon",
      },
      notes: "AoE skills shine; pull small packs at first.",
      expLabel: "~9.8k",
      drops: ["Ant claw", "Rough stone", "Low grade glove"],
      rewards: {
        expPerHour: 9800,
        spPerHour: 130,
        goldPerHour: 620,
        dropsPerHour: 4,
      },
    },
    alternativeSpots: [
      {
        name: "Meadow Hunt",
        regionSlug: "sutara",
        mobs: ["Wild Boar", "Horned Deer"],
        recommendedStats: {
          str: 6,
          weapon: "Two handed weapon",
        },
        notes: "Safer single target farming for STR builds.",
        rewards: {
          expPerHour: 8800,
          spPerHour: 115,
          goldPerHour: 540,
          dropsPerHour: 3,
        },
      },
    ],
  },
  {
    id: "lv6-10",
    levelRange: { min: 6, max: 10 },
    title: "Southern Marsh Crossing",
    focus: "AoE grinding and first blue drops",
    difficulty: "orta",
    preparation: [
      {
        title: "Potion Stock",
        description:
          "Carry at least 50 HP and 30 MP potions. Poison antidotes help in emergencies.",
        checklist: ["50x small HP", "30x small MP", "10x antidote"],
      },
      {
        title: "Buff Check",
        description:
          "Verify HP and MP totals; STR builds should keep HP over 60% of max while in the swamp.",
      },
    ],
    primarySpot: {
      name: "Mud Golem Bank",
      regionSlug: "sutara",
      coordinates: "X:130, Y:80",
      mobs: ["Mud Golem", "Swamp Leech"],
      recommendedStats: {
        str: 12,
        int: 10,
        weapon: "Level 8 weapon",
      },
      notes: "Golems hit slowly but poison stacks, cleanse if needed.",
      expLabel: "~14.5k",
      drops: ["Mud core", "Blue pendant", "Medium potion"],
      rewards: {
        expPerHour: 14500,
        spPerHour: 190,
        goldPerHour: 780,
        dropsPerHour: 5,
      },
    },
    alternativeSpots: [
      {
        name: "Canyon Entrance",
        regionSlug: "sutara",
        mobs: ["Bandit Sparrow", "Outlaw Sparrow"],
        recommendedStats: {
          int: 14,
          weapon: "High damage staff",
        },
        notes: "Quick kills for INT builds thanks to elemental weakness.",
        drops: ["Feather", "Light armor scrap"],
        rewards: {
          expPerHour: 15200,
          spPerHour: 205,
          goldPerHour: 650,
          dropsPerHour: 6,
        },
      },
    ],
    milestones: [
      {
        title: "Level 9 Trainer Run",
        description: "Return to the city trainer and finish the skill quests for bonus stat points.",
      },
    ],
  },
  {
    id: "lv10-14",
    levelRange: { min: 10, max: 14 },
    title: "Sutara Ruins",
    focus: "Mini boss rotations and stronger loot",
    difficulty: "orta",
    preparation: [
      {
        title: "Upgrade Pass",
        description: "Aim for level 12 weapon and +1 reinforced armor pieces.",
      },
    ],
    primarySpot: {
      name: "Ruins Plaza",
      regionSlug: "sutara",
      coordinates: "X:140, Y:74",
      mobs: ["Ruins Guard", "Rogue Fighter"],
      recommendedStats: {
        str: 20,
        int: 15,
        weapon: "Level 12 weapon +1",
      },
      notes: "Mini boss spawns every 15 minutes; duo recommended.",
      expLabel: "~18.0k",
      drops: ["Ruins seal", "Blue ring", "Cracked blade"],
      rewards: {
        expPerHour: 18000,
        spPerHour: 240,
        goldPerHour: 980,
        dropsPerHour: 6,
      },
    },
    alternativeSpots: [
      {
        name: "Watcher Outpost",
        regionSlug: "sutara",
        mobs: ["Watcher Trader", "Ruins Hunter"],
        recommendedStats: {
          str: 18,
          int: 18,
        },
        notes: "Safer solo grind with decent coin drops.",
        rewards: {
          expPerHour: 16500,
          spPerHour: 215,
          goldPerHour: 860,
          dropsPerHour: 5,
        },
      },
    ],
  },
  {
    id: "lv14-17",
    levelRange: { min: 14, max: 17 },
    title: "Night Chest Circuit",
    focus: "Chest waves for XP and gold",
    difficulty: "zor",
    preparation: [
      {
        title: "Form a Party",
        description: "Chest waves spawn rapidly; bring at least one partner or pet.",
      },
      {
        title: "Poison Resistance",
        description: "Carry resistance charms or HP regen elixirs. Aim for 2500+ HP.",
      },
    ],
    primarySpot: {
      name: "Mirage Valley Chests",
      regionSlug: "sutara",
      coordinates: "X:150, Y:66",
      mobs: ["Mirage Phantom", "Chest Sentinel"],
      recommendedStats: {
        str: 26,
        int: 22,
        weapon: "Level 16 weapon +2",
      },
      notes: "Activate chest scrolls with party buffs ready.",
      expLabel: "~22.5k",
      drops: ["Chest shard", "Purple bracelet"],
      rewards: {
        expPerHour: 22500,
        spPerHour: 300,
        goldPerHour: 1400,
        dropsPerHour: 8,
      },
    },
    alternativeSpots: [
      {
        name: "Mirage Night Hunters",
        regionSlug: "sutara",
        mobs: ["Night Stalker", "Shadow Archer"],
        recommendedStats: {
          int: 28,
          weapon: "AoE heavy staff",
        },
        notes: "INT builds clear fast but manage MP carefully.",
        rewards: {
          expPerHour: 21000,
          spPerHour: 280,
          goldPerHour: 1200,
          dropsPerHour: 7,
        },
      },
    ],
  },
  {
    id: "lv17-20",
    levelRange: { min: 17, max: 20 },
    title: "Northern Gate Push",
    focus: "High risk camp before leaving Sutara",
    difficulty: "zor",
    preparation: [
      {
        title: "Full Buff Setup",
        description: "Target 3200+ HP, 2800+ MP. Enhance blue gear to +2 or better.",
      },
      {
        title: "Party Synergy",
        description: "Bring at least one STR tank and one INT damager; solo is risky.",
      },
    ],
    primarySpot: {
      name: "Northern Gate Raiders",
      regionSlug: "sutara",
      coordinates: "X:158, Y:60",
      mobs: ["Desert Raider", "Raider Mage"],
      recommendedStats: {
        str: 34,
        int: 30,
        weapon: "Level 20 weapon +3",
      },
      notes: "Expect critical hits; keep potions ready and rotate cooldowns.",
      expLabel: "~26.8k",
      drops: ["Raider armor scrap", "Purple talisman", "Gold ingot"],
      rewards: {
        expPerHour: 26800,
        spPerHour: 360,
        goldPerHour: 1800,
        dropsPerHour: 9,
      },
    },
    alternativeSpots: [
      {
        name: "Northwest Garrison",
        regionSlug: "sutara",
        mobs: ["Guard Captain", "War Master"],
        recommendedStats: {
          str: 32,
          int: 28,
        },
        notes: "Controlled spawn rate for smaller parties.",
        rewards: {
          expPerHour: 24000,
          spPerHour: 320,
          goldPerHour: 1500,
          dropsPerHour: 7,
        },
      },
    ],
    milestones: [
      {
        title: "Level 20",
        description: "Final prep before moving to the next region. Spend new stat and skill points.",
      },
    ],
  },
];

export const findGrindRoute = (routeId: string): GrindRoute | undefined =>
  grindRoutes.find((route) => route.id === routeId);

const DIFFICULTY_MULTIPLIERS: Record<GrindRoute["difficulty"], number> = {
  kolay: 1,
  orta: 1.1,
  zor: 1.25,
};

const STAT_POINTS_PER_LEVEL = 3;

export const computePerSecondRates = (
  route: GrindRoute,
  level: number,
) => {
  const rewards = route.primarySpot.rewards;
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[route.difficulty] ?? 1;
  const levelDelta = level - route.levelRange.max;
  const levelMultiplier = levelDelta > 0 ? Math.max(0.25, 1 - 0.12 * levelDelta) : 1;
  const globalSlowdown = 1 / (1 + Math.max(0, level - route.levelRange.min) * 0.03);

  const factor = difficultyMultiplier * levelMultiplier * globalSlowdown;

  return {
    xpPerSecond: (rewards.expPerHour / 3600) * factor,
    spPerSecond: (rewards.spPerHour / 3600) * factor,
    goldPerSecond: (rewards.goldPerHour / 3600) * factor,
    dropsPerSecond: (rewards.dropsPerHour / 3600) * factor,
    difficultyMultiplier,
    levelMultiplier,
    globalSlowdown,
  };
};

export const computeRewardsForDuration = (
  route: GrindRoute,
  level: number,
  durationSeconds: number,
) => {
  const perSecond = computePerSecondRates(route, level);

  const xp = Math.max(0, Math.floor(perSecond.xpPerSecond * durationSeconds));
  const sp = Math.max(0, Math.floor(perSecond.spPerSecond * durationSeconds));
  const gold = Math.max(0, Math.floor(perSecond.goldPerSecond * durationSeconds));
  const drops = Math.max(0, Math.floor(perSecond.dropsPerSecond * durationSeconds));

  return {
    xp,
    sp,
    gold,
    drops,
    perSecond,
  };
};

export const applyLevelUps = (
  level: number,
  exp: number,
  xpGain: number,
  getRequiredExp: (level: number) => number,
) => {
  let nextLevel = level;
  let nextExp = exp + xpGain;
  let extraStatPoints = 0;

  while (true) {
    const required = getRequiredExp(nextLevel);
    if (nextExp >= required) {
      nextExp -= required;
      nextLevel += 1;
      extraStatPoints += STAT_POINTS_PER_LEVEL;
    } else {
      break;
    }
  }

  return {
    level: nextLevel,
    exp: nextExp,
    statPointsGained: extraStatPoints,
  };
};
