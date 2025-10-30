import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import {
  buildStatSummary,
  type CoreStats,
} from "@/lib/game/statFormulas";

type RouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

const parseCharacterId = (id?: string) => {
  const value = Number(id);
  if (!id || Number.isNaN(value) || value <= 0) {
    return null;
  }
  return value;
};

const isSchemaMismatchError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeKnown = error as Partial<Prisma.PrismaClientKnownRequestError>;
  if (maybeKnown.code && typeof maybeKnown.code === "string") {
    if (["P2021", "P2022", "P2009", "P2010"].includes(maybeKnown.code)) {
      return true;
    }
  }

  if (error instanceof Error) {
    return /Unknown field/i.test(error.message);
  }

  return false;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const characterId = parseCharacterId(id);
  if (!characterId) {
    return errorResponse("Geçersiz karakter kimliği.", 400);
  }

  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erişim.", 401);
  }

  try {
    const character = await prisma.character.findFirst({
      where: { id: characterId, userId: user.id },
      select: {
        id: true,
        name: true,
        level: true,
        exp: true,
        statPoints: true,
        strength: true,
        intelligence: true,
      },
    });

    if (!character) {
      return errorResponse("Karakter erişimi reddedildi.", 403);
    }

    const coreStats: CoreStats = {
      level: character.level,
      strength: character.strength,
      intelligence: character.intelligence,
    };
    const summary = buildStatSummary(coreStats, character.exp);

    return NextResponse.json({
      character: {
        ...character,
        summary,
        honorPoints: null,
      },
    });
  } catch (error) {
    console.error("Character stats load failed:", error);
    if (isSchemaMismatchError(error)) {
      return errorResponse(
        "Stat alanları Prisma client ile eşleşmiyor. `npx prisma migrate deploy` ve ardından `npx prisma generate` komutlarını çalıştırıp sunucuyu yeniden başlatın.",
        500,
      );
    }
    return errorResponse("Stat bilgileri alınamadı.", 500);
  }
}

type AllocateBody = {
  strength?: number;
  intelligence?: number;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const characterId = parseCharacterId(id);
  if (!characterId) {
    return errorResponse("Geçersiz karakter kimliği.", 400);
  }

  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erişim.", 401);
  }

  const payload = (await request.json().catch(() => ({}))) as AllocateBody;
  const strengthGain = Number(payload.strength ?? 0);
  const intelligenceGain = Number(payload.intelligence ?? 0);

  if (
    !Number.isInteger(strengthGain) ||
    !Number.isInteger(intelligenceGain) ||
    strengthGain < 0 ||
    intelligenceGain < 0
  ) {
    return errorResponse("Stat artışı pozitif tam sayı olmalıdır.");
  }

  const totalSpend = strengthGain + intelligenceGain;
  if (totalSpend <= 0) {
    return errorResponse("En az bir stat puanı harcanmalıdır.");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const character = await tx.character.findFirst({
        where: { id: characterId, userId: user.id },
        select: {
          id: true,
          name: true,
          level: true,
          exp: true,
          statPoints: true,
          strength: true,
          intelligence: true,
        },
      });

      if (!character) {
        throw new Error("NOT_FOUND");
      }

      if (totalSpend > character.statPoints) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      const result = await tx.character.update({
        where: { id: characterId },
        data: {
          statPoints: { decrement: totalSpend },
          strength: { increment: strengthGain },
          intelligence: { increment: intelligenceGain },
        },
        select: {
          id: true,
          name: true,
          level: true,
          exp: true,
          statPoints: true,
          strength: true,
          intelligence: true,
        },
      });

      return result;
    });

    const coreStats: CoreStats = {
      level: updated.level,
      strength: updated.strength,
      intelligence: updated.intelligence,
    };
    const summary = buildStatSummary(coreStats, updated.exp);

    return NextResponse.json({
      character: {
        ...updated,
        summary,
        honorPoints: null,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return errorResponse("Karakter erişimi reddedildi.", 403);
      }
      if (error.message === "INSUFFICIENT_POINTS") {
        return errorResponse("Yeterli stat puanı yok.", 400);
      }
    }
    console.error("Stat allocation failed:", error);
    if (isSchemaMismatchError(error)) {
      return errorResponse(
        "Stat alanları Prisma client ile eşleşmiyor. `npx prisma migrate deploy` ve `npx prisma generate` komutlarını çalıştırıp sunucuyu yeniden başlatın.",
        500,
      );
    }
    return errorResponse("İşlem tamamlanamadı.", 500);
  }
}
