import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

type RouteContext = {
  params: {
    id: string;
  };
};

type SkillActionRequest = {
  skillSlug?: string;
  action?: "unlock" | "rank-up";
};

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

export async function POST(request: Request, { params }: RouteContext) {
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

  if (!["unlock", "rank-up"].includes(action)) {
    return errorResponse("Geçersiz işlem türü.");
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
  });

  if (!character) {
    return errorResponse("Karakter bulunamadı veya bu kullanıcıya ait değil.", 404);
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

  const prerequisiteSlug = skill.prerequisite?.slug ?? null;

  if (prerequisiteSlug) {
    const prerequisiteState = await prisma.characterSkill.findFirst({
      where: {
        characterId,
        skill: { slug: prerequisiteSlug },
      },
      select: {
        unlocked: true,
      },
    });

    if (!prerequisiteState?.unlocked) {
      return errorResponse("Ön koşul yetenek henüz açılmamış.");
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
      characterGold: character.gold,
    });
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

  if (cost > character.gold) {
    return errorResponse("Bu işlem için yeterli altınınız yok.");
  }

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      let updatedSkillRecord;

      if (action === "unlock") {
        if (existingSkill) {
          updatedSkillRecord = await tx.characterSkill.update({
            where: { id: existingSkill.id },
            data: {
              unlocked: true,
              rank: existingSkill.rank > 0 ? existingSkill.rank : 1,
            },
          });
        } else {
          updatedSkillRecord = await tx.characterSkill.create({
            data: {
              characterId,
              skillId: skill.id,
              unlocked: true,
              rank: 1,
            },
          });
        }
      } else {
        updatedSkillRecord = await tx.characterSkill.update({
          where: { id: existingSkill!.id },
          data: {
            rank: existingSkill!.rank + 1,
          },
        });
      }

      let updatedGold = character.gold;
      if (cost > 0) {
        const current = await tx.character.findUnique({
          where: { id: characterId },
          select: { gold: true },
        });

        if (!current || current.gold < cost) {
          throw new Error("INSUFFICIENT_GOLD");
        }

        const updatedCharacter = await tx.character.update({
          where: { id: characterId },
          data: { gold: { decrement: cost } },
          select: { gold: true },
        });
        updatedGold = updatedCharacter.gold;
      }

      return {
        updatedSkillRecord,
        updatedGold,
      };
    });

    return NextResponse.json({
      message: "Yetenek güncellendi.",
      skill: {
        slug: skill.slug,
        rank: transactionResult.updatedSkillRecord.rank,
        unlocked: transactionResult.updatedSkillRecord.unlocked,
      },
      characterGold: transactionResult.updatedGold,
    });
  } catch (transactionError) {
    if (
      transactionError instanceof Error &&
      transactionError.message === "INSUFFICIENT_GOLD"
    ) {
      return errorResponse("Bu işlem için yeterli altınınız yok.", 400);
    }
    console.error("Skill update failed:", transactionError);
    return errorResponse("Yetenek işlemi sırasında bir hata oluştu.", 500);
  }
}
