import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const disciplines = await prisma.skillDiscipline.findMany({
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
    });

    return NextResponse.json({
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
