import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

type RouteContext = {
  params: {
    id: string;
  };
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

export async function GET(_request: Request, { params }: RouteContext) {
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
    select: { id: true, gold: true },
  });

  if (!character) {
    return errorResponse("Karakter bulunamadı veya bu kullanıcıya ait değil.", 404);
  }

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
    },
    disciplines: Array.from(disciplines.values()),
  });
}
