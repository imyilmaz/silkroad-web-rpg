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

type SkillActionRequest = {
  skillSlug?: string;
  action?: "unlock" | "rank-up";
};

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

export async function POST(request: Request, context: RouteContext) {
  const params = await Promise.resolve(context.params);

  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erişim.", 401);
  }

  const characterId = Number(params.id);
  if (!characterId || Number.isNaN(characterId)) {
    return errorResponse("Geçerli bir karakter kimliği gerekli.");
  }

  const body = (await request.json()) as SkillActionRequest;
  const skillSlug = body.skillSlug;
  const action = body.action ?? "unlock";

  if (!skillSlug) {
    return errorResponse("İşleme tabi tutulacak yetenek belirtilmedi.");
  }

  if (action !== "unlock" && action !== "rank-up") {
    return errorResponse("Geçersiz işlem türü.");
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
  });

  if (!character) {
    return errorResponse(
      "Karakter bulunamadı veya bu kullanıcıya ait değil.",
      404,
    );
  }

  const skill = await prisma.skill.findUnique({
    where: { slug: skillSlug },
    include: {
      prerequisite: {
        select: { slug: true },
      },
    },
  });

  if (!skill) {
    return errorResponse("Belirtilen yetenek bulunamadı.", 404);
  }

  if (skill.prerequisite?.slug) {
    const prerequisiteState = await prisma.characterSkill.findFirst({
      where: {
        characterId,
        skill: { slug: skill.prerequisite.slug },
      },
      select: {
        unlocked: true,
      },
    });

    if (!prerequisiteState?.unlocked) {
      return errorResponse("Ön koşul yetenek henüz açılmadı.");
    }
  }

  const existingSkill = await prisma.characterSkill.findFirst({
    where: {
      characterId,
      skillId: skill.id,
    },
  });

  if (action === "unlock" && existingSkill?.unlocked) {
    return NextResponse.json({
      message: "Yetenek zaten açık.",
      skill: {
        slug: skill.slug,
        rank: existingSkill.rank,
        unlocked: existingSkill.unlocked,
      },
      characterSkillPoints: character.skillPoints,
    });
  }

  if (character.level < skill.requiredLevel) {
    return errorResponse("Karakter seviyeniz bu yetenek için yetersiz.");
  }

  if (action === "rank-up") {
    if (!existingSkill || !existingSkill.unlocked) {
      return errorResponse("Yetenek önce açılmalı.");
    }

    if (existingSkill.rank >= skill.rankMax) {
      return errorResponse("Yetenek zaten maksimum seviyede.");
    }
  }

  const cost = action === "unlock" ? skill.unlockCost : skill.rankCost;

  if (cost > character.skillPoints) {
    return errorResponse("Yeterli yetenek puanınız yok.");
  }

  const masteryMultiplier = await getMasteryMultiplier();
  const masteryLimit = character.level * masteryMultiplier;

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      const currentSkillRecord = await tx.characterSkill.findFirst({
        where: { characterId, skillId: skill.id },
      });

      const totals = await tx.characterSkill.aggregate({
        where: { characterId },
        _sum: { rank: true },
      });

      const currentTotal = totals._sum.rank ?? 0;
      const previousRank = currentSkillRecord?.rank ?? 0;
      const nextRank =
        action === "unlock"
          ? currentSkillRecord
            ? currentSkillRecord.rank > 0
              ? currentSkillRecord.rank
              : 1
            : 1
          : (currentSkillRecord?.rank ?? 0) + 1;

      const nextTotal = currentTotal - previousRank + nextRank;
      if (nextTotal > masteryLimit) {
        throw new Error("MASTERY_CAP");
      }

      let updatedSkillRecord;

      if (action === "unlock") {
        if (currentSkillRecord) {
          updatedSkillRecord = await tx.characterSkill.update({
            where: { id: currentSkillRecord.id },
            data: {
              unlocked: true,
              rank: nextRank,
            },
          });
        } else {
          updatedSkillRecord = await tx.characterSkill.create({
            data: {
              characterId,
              skillId: skill.id,
              unlocked: true,
              rank: nextRank,
            },
          });
        }
      } else {
        updatedSkillRecord = await tx.characterSkill.update({
          where: { id: currentSkillRecord!.id },
          data: {
            rank: nextRank,
          },
        });
      }

      let updatedSkillPoints = character.skillPoints;
      if (cost > 0) {
        const wallet = await tx.character.findUnique({
          where: { id: characterId },
          select: { skillPoints: true },
        });

        if (!wallet || wallet.skillPoints < cost) {
          throw new Error("INSUFFICIENT_SKILL_POINTS");
        }

        const updatedCharacter = await tx.character.update({
          where: { id: characterId },
          data: { skillPoints: { decrement: cost } },
          select: { skillPoints: true },
        });
        updatedSkillPoints = updatedCharacter.skillPoints;
      }

      return {
        updatedSkillRecord,
        updatedSkillPoints,
        masteryTotal: nextTotal,
      };
    });

    return NextResponse.json({
      message: "Yetenek güncellendi.",
      skill: {
        slug: skill.slug,
        rank: transactionResult.updatedSkillRecord.rank,
        unlocked: transactionResult.updatedSkillRecord.unlocked,
      },
      characterSkillPoints: transactionResult.updatedSkillPoints,
      masteryTotal: transactionResult.masteryTotal,
      masteryLimit,
    });
  } catch (transactionError) {
    if (
      transactionError instanceof Error &&
      transactionError.message === "INSUFFICIENT_SKILL_POINTS"
    ) {
      return errorResponse("Yeterli yetenek puanınız kalmadı.", 400);
    }
    if (
      transactionError instanceof Error &&
      transactionError.message === "MASTERY_CAP"
    ) {
      return errorResponse("Ustalık sınırına ulaştınız. Daha fazla seviye yükseltemezsiniz.", 400);
    }
    console.error("Skill update failed:", transactionError);
    return errorResponse("Yetenek işlemi sırasında bir hata oluştu.", 500);
  }
}
