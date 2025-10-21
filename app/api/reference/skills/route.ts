import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

export async function GET() {
  try {
    const [disciplines, masteryMultiplier] = await Promise.all([
      prisma.skillDiscipline.findMany({
        orderBy: { id: "asc" },
        include: {
          skills: {
            orderBy: { requiredLevel: "asc" },
            include: {
              prerequisite: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      }),
      getMasteryMultiplier(),
    ]);

    return NextResponse.json({
      masteryMultiplier,
      disciplines: disciplines.map((discipline) => ({
        slug: discipline.slug,
        name: discipline.name,
        description: discipline.description,
        element: discipline.element,
        skills: discipline.skills.map((skill) => ({
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          type: skill.type,
          rankMax: skill.rankMax,
          resourceCost: skill.resourceCost,
          cooldownSeconds: skill.cooldownSeconds,
          requiredLevel: skill.requiredLevel,
          unlockCost: skill.unlockCost,
          rankCost: skill.rankCost,
          prerequisiteSlug: skill.prerequisite?.slug ?? null,
        })),
      })),
    });
  } catch (error) {
    console.error("Skills API error:", error);
    return NextResponse.json(
      { message: "Yetenek listesi getirilemedi." },
      { status: 500 },
    );
  }
}
