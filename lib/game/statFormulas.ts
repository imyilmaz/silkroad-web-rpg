export type CoreStats = {
  level: number;
  strength: number;
  intelligence: number;
};

export type VitalStats = {
  hpMax: number;
  mpMax: number;
};

export type DerivedStats = {
  phyAtkMin: number;
  phyAtkMax: number;
  magAtkMin: number;
  magAtkMax: number;
  phyDef: number;
  magDef: number;
  phyBalance: number;
  magBalance: number;
  hitRate: number;
  parryRatio: number;
};

export type StatSummary = {
  vitals: {
    hp: {
      current: number;
      max: number;
    };
    mp: {
      current: number;
      max: number;
    };
  };
  derived: DerivedStats;
  exp: {
    currentLevelBase: number;
    nextLevelBase: number;
    current: number;
    required: number;
    percent: number;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const HP_BASE = 180;
const HP_PER_LEVEL = 9;
const HP_PER_STR = 26;

const MP_BASE = 250;
const MP_PER_LEVEL = 10;
const MP_PER_INT = 22;

const PHY_ATK_MIN_BASE = 30;
const PHY_ATK_MIN_PER_LEVEL = 2.2;
const PHY_ATK_MIN_PER_STR = 3;
const PHY_ATK_RANGE_PER_STR = 2.05;

const MAG_ATK_MIN_BASE = 50;
const MAG_ATK_MIN_PER_LEVEL = 2;
const MAG_ATK_MIN_PER_INT = 2.8;
const MAG_ATK_RANGE_PER_INT = 1.1;

const PHY_DEF_BASE = 14;
const PHY_DEF_PER_LEVEL = 1.5;
const PHY_DEF_PER_STR = 1.25;

const MAG_DEF_BASE = 16;
const MAG_DEF_PER_LEVEL = 1.3;
const MAG_DEF_PER_INT = 1.05;

const PHY_BALANCE_BASE = 50;
const PHY_BALANCE_PER_STR = 0.45;
const PHY_BALANCE_PER_LEVEL = 0.2;

const MAG_BALANCE_BASE = 50;
const MAG_BALANCE_PER_INT = 0.35;
const MAG_BALANCE_PER_LEVEL = 0.25;

const HIT_RATE_BASE = 32;
const HIT_RATE_PER_LEVEL = 1.9;
const HIT_RATE_PER_STR = 1.55;

const PARRY_RATIO_BASE = 24;
const PARRY_RATIO_PER_LEVEL = 1.7;
const PARRY_RATIO_PER_INT = 1.2;

const EXP_CURVE_COEFFICIENT = 980;
const EXP_CURVE_EXPONENT = 2.5;

export const computeMaxHP = ({ level, strength }: CoreStats): number =>
  Math.round(HP_BASE + level * HP_PER_LEVEL + strength * HP_PER_STR);

export const computeMaxMP = ({ level, intelligence }: CoreStats): number =>
  Math.round(MP_BASE + level * MP_PER_LEVEL + intelligence * MP_PER_INT);

export const computeDerivedStats = ({
  level,
  strength,
  intelligence,
}: CoreStats): DerivedStats => {
  const phyAtkMin =
    PHY_ATK_MIN_BASE +
    level * PHY_ATK_MIN_PER_LEVEL +
    strength * PHY_ATK_MIN_PER_STR;

  const phyAtkMax = phyAtkMin + strength * PHY_ATK_RANGE_PER_STR;

  const magAtkMin =
    MAG_ATK_MIN_BASE +
    level * MAG_ATK_MIN_PER_LEVEL +
    intelligence * MAG_ATK_MIN_PER_INT;

  const magAtkMax = magAtkMin + intelligence * MAG_ATK_RANGE_PER_INT;

  const phyDef =
    PHY_DEF_BASE + level * PHY_DEF_PER_LEVEL + strength * PHY_DEF_PER_STR;
  const magDef =
    MAG_DEF_BASE + level * MAG_DEF_PER_LEVEL + intelligence * MAG_DEF_PER_INT;

  const phyBalance = clamp(
    PHY_BALANCE_BASE +
      strength * PHY_BALANCE_PER_STR +
      level * PHY_BALANCE_PER_LEVEL,
    0,
    100,
  );
  const magBalance = clamp(
    MAG_BALANCE_BASE +
      intelligence * MAG_BALANCE_PER_INT +
      level * MAG_BALANCE_PER_LEVEL,
    0,
    100,
  );

  const hitRate =
    HIT_RATE_BASE + level * HIT_RATE_PER_LEVEL + strength * HIT_RATE_PER_STR;
  const parryRatio =
    PARRY_RATIO_BASE +
    level * PARRY_RATIO_PER_LEVEL +
    intelligence * PARRY_RATIO_PER_INT;

  return {
    phyAtkMin: Math.round(phyAtkMin),
    phyAtkMax: Math.round(phyAtkMax),
    magAtkMin: Math.round(magAtkMin),
    magAtkMax: Math.round(magAtkMax),
    phyDef: Math.round(phyDef),
    magDef: Math.round(magDef),
    phyBalance: Math.round(phyBalance),
    magBalance: Math.round(magBalance),
    hitRate: Math.round(hitRate),
    parryRatio: Math.round(parryRatio),
  };
};

export const requiredExpForLevel = (level: number): number =>
  Math.round(
    EXP_CURVE_COEFFICIENT * Math.pow(Math.max(level, 1), EXP_CURVE_EXPONENT),
  );

export const totalExpForLevel = (level: number): number => {
  if (level <= 1) {
    return 0;
  }

  let total = 0;
  for (let idx = 1; idx < level; idx += 1) {
    total += requiredExpForLevel(idx);
  }
  return total;
};

export const buildStatSummary = (
  core: CoreStats,
  totalExp: number,
): StatSummary => {
  const hpMax = computeMaxHP(core);
  const mpMax = computeMaxMP(core);
  const derived = computeDerivedStats(core);

  const currentLevelBase = totalExpForLevel(core.level);
  const nextLevelBase = totalExpForLevel(core.level + 1);
  const required = Math.max(nextLevelBase - currentLevelBase, 1);
  const current = clamp(totalExp - currentLevelBase, 0, required);
  const percent = clamp((current / required) * 100, 0, 100);

  return {
    vitals: {
      hp: {
        current: hpMax,
        max: hpMax,
      },
      mp: {
        current: mpMax,
        max: mpMax,
      },
    },
    derived,
    exp: {
      currentLevelBase,
      nextLevelBase,
      current,
      required,
      percent,
    },
  };
};
