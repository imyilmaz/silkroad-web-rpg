import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import {
  findGrindRoute,
  computeRewardsForDuration,
  applyLevelUps,
} from "@/lib/game/grindRoutes";
import {
  buildStatSummary,
  requiredExpForLevel,
} from "@/lib/game/statFormulas";

type RouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

type CompleteBody = {
  routeId?: string;
  durationMs?: number;
};

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status });

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const characterId = Number(id);

  if (!characterId || Number.isNaN(characterId)) {
    return errorResponse("Gecersiz karakter kimligi.");
  }

  const user = await getUserFromToken();
  if (!user) {
    return errorResponse("Yetkisiz erisim.", 401);
  }

  const body = (await request.json().catch(() => ({}))) as CompleteBody;
  const { routeId, durationMs } = body;

  if (!routeId || typeof routeId !== "string") {
    return errorResponse("Rota kimligi belirtilmedi.");
  }

  const route = findGrindRoute(routeId);
  if (!route) {
    return errorResponse("Belirtilen kasilma rotasi bulunamadi.", 404);
  }

  const durationSeconds = Math.max(
    1,
    Math.floor((typeof durationMs === "number" ? durationMs : 0) / 1000),
  );

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: {
      id: true,
      name: true,
      level: true,
      exp: true,
      statPoints: true,
      skillPoints: true,
      gold: true,
      strength: true,
      intelligence: true,
    },
  });

  if (!character) {
    return errorResponse("Karaktere erisim reddedildi.", 403);
  }

  if (character.level < route.levelRange.min) {
    return errorResponse(
      `Bu rota icin minimum seviye ${route.levelRange.min}.`,
    );
  }

  const rewardSnapshot = computeRewardsForDuration(
    route,
    character.level,
    durationSeconds,
  );

  const rewards = {
    exp: rewardSnapshot.xp,
    sp: rewardSnapshot.sp,
    gold: rewardSnapshot.gold,
    drops: rewardSnapshot.drops,
  };

  const levelProgress = applyLevelUps(
    character.level,
    character.exp,
    rewards.exp,
    requiredExpForLevel,
  );

  const updated = await prisma.character.update({
    where: { id: characterId },
    data: {
      level: levelProgress.level,
      exp: levelProgress.exp,
      statPoints: character.statPoints + levelProgress.statPointsGained,
      skillPoints: character.skillPoints + rewards.sp,
      gold: character.gold + rewards.gold,
    },
    select: {
      id: true,
      name: true,
      level: true,
      exp: true,
      statPoints: true,
      skillPoints: true,
      gold: true,
      strength: true,
      intelligence: true,
    },
  });

  const summary = buildStatSummary(
    {
      level: updated.level,
      strength: updated.strength ?? 0,
      intelligence: updated.intelligence ?? 0,
    },
    updated.exp,
  );

  return NextResponse.json({
    message: "Kasilma odulleri uygulandi.",
    rewards,
    levelUps: levelProgress.level - character.level,
    character: {
      id: updated.id,
      name: updated.name,
      level: updated.level,
      exp: updated.exp,
      statPoints: updated.statPoints,
      skillPoints: updated.skillPoints,
      gold: updated.gold,
      summary,
    },
  });
}
