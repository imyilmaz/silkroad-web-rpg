import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

const DEFAULT_MASTERY_MULTIPLIER = 3;

const resolveNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "object" && value !== null) {
    if ("multiplier" in value) {
      const nested = (value as Record<string, unknown>).multiplier;
      if (typeof nested === "number" && Number.isFinite(nested) && nested > 0) {
        return nested;
      }
    }
    if ("value" in value) {
      const nested = (value as Record<string, unknown>).value;
      if (typeof nested === "number" && Number.isFinite(nested) && nested > 0) {
        return nested;
      }
    }
  }
  return null;
};

const getMasteryMultiplier = async (): Promise<number> => {
  const setting = await prisma.gameSetting.findUnique({
    where: { key: "skillMasteryMultiplier" },
  });

  const parsed = resolveNumeric(setting?.value);
  return parsed ?? DEFAULT_MASTERY_MULTIPLIER;
};

type RouteParams = {
  id: string;
};

type RouteContext = {
  params: RouteParams | Promise<RouteParams>;
};

type SkillResponse = {
  slug: string;
  name: string;
  description: string;
  type: string;
  rankMax: number;
  resourceCost: number | null;
  cooldownSeconds: number | null;
  requiredLevel: number;
  unlockCost: number;
  rankCost: number;
  prerequisiteSlug: string | null;
  characterState: {
    rank: number;
    unlocked: boolean;
  } | null;
};

type DisciplineResponse = {
  slug: string;
  name: string;
  description: string;
  element: string | null;
  skills: SkillResponse[];
};

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

export async function GET(_request: Request, context: RouteContext) {
  const params = await Promise.resolve(context.params);

  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erişim.", 401);
  }

  const characterId = Number(params.id);
  if (!characterId || Number.isNaN(characterId)) {
    return errorResponse("Geçerli bir karakter kimliği gerekli.");
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, gold: true, level: true, skillPoints: true },
  });

  if (!character) {
    return errorResponse(
      "Karakter bulunamadı veya bu kullanıcıya ait değil.",
      404,
    );
  }

  const masteryMultiplier = await getMasteryMultiplier();
  const masteryLimit = character.level * masteryMultiplier;

  const masterySumResult = await prisma.characterSkill.aggregate({
    where: { characterId },
    _sum: { rank: true },
  });
  const masteryTotal = masterySumResult._sum.rank ?? 0;

  const skills = await prisma.skill.findMany({
    orderBy: [{ disciplineId: "asc" }, { requiredLevel: "asc" }],
    include: {
      discipline: true,
      prerequisite: {
        select: {
          slug: true,
        },
      },
      characterRanks: {
        where: { characterId },
        select: {
          rank: true,
          unlocked: true,
        },
      },
    },
  });

  const disciplines = new Map<string, DisciplineResponse>();

  skills.forEach((skill) => {
    let disciplineEntry = disciplines.get(skill.discipline.slug);

    if (!disciplineEntry) {
      disciplineEntry = {
        slug: skill.discipline.slug,
        name: skill.discipline.name,
        description: skill.discipline.description,
        element: skill.discipline.element,
        skills: [],
      };
      disciplines.set(skill.discipline.slug, disciplineEntry);
    }

    const state = skill.characterRanks[0] ?? null;

    disciplineEntry.skills.push({
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      type: skill.type,
      rankMax: skill.rankMax,
      resourceCost: skill.resourceCost ?? null,
      cooldownSeconds: skill.cooldownSeconds ?? null,
      requiredLevel: skill.requiredLevel,
      unlockCost: skill.unlockCost,
      rankCost: skill.rankCost,
      prerequisiteSlug: skill.prerequisite?.slug ?? null,
      characterState: state
        ? { rank: state.rank, unlocked: state.unlocked }
        : null,
    });
  });

  return NextResponse.json({
    character: {
      gold: character.gold,
      level: character.level,
      skillPoints: character.skillPoints,
      mastery: {
        total: masteryTotal,
        limit: masteryLimit,
        multiplier: masteryMultiplier,
      },
    },
    disciplines: Array.from(disciplines.values()),
  });
}
