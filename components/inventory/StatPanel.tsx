'use client';

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import StatSheet from "@/components/stats/StatSheet";
import {
  fetchStats,
  allocateStat,
  type StatResponse,
  type AllocateTarget,
  type StatSnapshot,
} from "@/components/stats/statApi";
import { useActiveCharacter } from "@/context/ActiveCharacterContext";

type StatPanelProps = {
  characterId?: number;
};

export default function StatPanel({ characterId }: StatPanelProps) {
  const { character: activeCharacter, updateStats } = useActiveCharacter();
  const resolvedId = characterId ?? activeCharacter?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statData, setStatData] = useState<StatResponse["character"] | null>(
    null,
  );
  const [allocating, setAllocating] = useState<AllocateTarget | null>(null);

  const isActiveCharacter =
    activeCharacter && resolvedId !== null && resolvedId === activeCharacter.id;

  const syncSnapshot = useCallback(
    (payload: StatResponse["character"]) => {
      setStatData(payload);
      const snapshot: StatSnapshot = {
        statPoints: payload.statPoints,
        strength: payload.strength,
        intelligence: payload.intelligence,
        summary: payload.summary,
      };

      if (isActiveCharacter) {
        updateStats(snapshot);
      }
    },
    [isActiveCharacter, updateStats],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!resolvedId) {
        setLoading(false);
        setError("Aktif karakter bulunamadı.");
        return;
      }

      try {
        setLoading(true);
        const payload = await fetchStats(resolvedId);
        if (!cancelled) {
          syncSnapshot(payload.character);
          setError(null);
        }
      } catch (reason) {
        if (!cancelled) {
          console.error("Stat panel load failed:", reason);
          setError(
            reason instanceof Error
              ? reason.message
              : "Stat bilgileri alınamadı.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [resolvedId, syncSnapshot]);

  const handleAllocate = useCallback(
    async (target: AllocateTarget) => {
      if (!resolvedId || !statData || statData.statPoints <= 0) {
        return;
      }

      try {
        setAllocating(target);
        const payload = await allocateStat(resolvedId, target);
        syncSnapshot(payload.character);
        toast.success(
          target === "strength"
            ? "STR 1 puan arttırıldı."
            : "INT 1 puan arttırıldı.",
        );
      } catch (reason) {
        console.error("Stat allocation error:", reason);
        toast.error(
          reason instanceof Error
            ? reason.message
            : "Stat dağıtımı sırasında hata oluştu.",
        );
      } finally {
        setAllocating(null);
      }
    },
    [resolvedId, statData, syncSnapshot],
  );

  if (!resolvedId) {
    return (
      <div className="stat-panel">
        <p>Aktif karakter bulunamadı.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stat-panel">
        <p>Stat bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-panel">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!statData) {
    return null;
  }

  return (
    <div className="stat-panel stat-panel--sheet">
      <StatSheet
        name={statData.name}
        level={statData.level}
        statPoints={statData.statPoints}
        strength={statData.strength}
        intelligence={statData.intelligence}
        summary={statData.summary}
        honorPoints={statData.honorPoints}
        onAllocate={handleAllocate}
        allocating={allocating}
      />
    </div>
  );
}
