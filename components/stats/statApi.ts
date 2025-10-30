'use client';

import type { StatSummary } from "@/lib/game/statFormulas";

export type StatSnapshot = {
  statPoints: number;
  strength: number;
  intelligence: number;
  summary: StatSummary;
};

export type StatResponse = {
  character: {
    id: number;
    name: string;
    level: number;
    exp: number;
    statPoints: number;
    strength: number;
    intelligence: number;
    summary: StatSummary;
    honorPoints: number | null;
  };
};

export type AllocateTarget = "strength" | "intelligence";

export const fetchStats = async (
  characterId: number,
): Promise<StatResponse> => {
  const response = await fetch(`/api/character/${characterId}/stats`);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Stat bilgileri alınamadı.");
  }
  return (await response.json()) as StatResponse;
};

export const allocateStat = async (
  characterId: number,
  target: AllocateTarget,
): Promise<StatResponse> => {
  const body =
    target === "strength"
      ? { strength: 1 }
      : { intelligence: 1 };

  const response = await fetch(`/api/character/${characterId}/stats`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Stat dağıtımı başarısız oldu.");
  }

  return (await response.json()) as StatResponse;
};
