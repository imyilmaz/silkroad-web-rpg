'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import StatSheet from "./StatSheet";
import {
  fetchStats,
  allocateStat,
  type StatSnapshot,
  type StatResponse,
  type AllocateTarget,
} from "./statApi";
import { useActiveCharacter } from "@/context/ActiveCharacterContext";

type StatModalProps = {
  characterId: number;
  characterName: string;
  characterLevel: number;
  onClose: () => void;
  onStatsUpdated?: (stats: StatSnapshot) => void;
};

export default function StatModal({
  characterId,
  characterName,
  characterLevel,
  onClose,
  onStatsUpdated,
}: StatModalProps) {
  const { character: activeCharacter, updateStats } = useActiveCharacter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statData, setStatData] = useState<StatResponse["character"] | null>(
    null,
  );
  const [allocating, setAllocating] = useState<AllocateTarget | null>(null);

  const isActiveCharacter =
    activeCharacter && activeCharacter.id === characterId;

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
      onStatsUpdated?.(snapshot);
    },
    [isActiveCharacter, onStatsUpdated, updateStats],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const payload = await fetchStats(characterId);
        if (!cancelled) {
          syncSnapshot(payload.character);
          setError(null);
        }
      } catch (reason) {
        console.error("Stat modal load failed:", reason);
        if (!cancelled) {
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
  }, [characterId, syncSnapshot]);

  const handleAllocate = useCallback(
    async (target: AllocateTarget) => {
      if (!statData || statData.statPoints <= 0) {
        return;
      }

      try {
        setAllocating(target);
        const payload = await allocateStat(characterId, target);
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
    [characterId, statData, syncSnapshot],
  );

  const modalTitle = useMemo(
    () => `${characterName} • Lv ${characterLevel}`,
    [characterName, characterLevel],
  );

  return (
    <div className="stat-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="stat-modal__scrim"
        onClick={onClose}
        aria-label="Kapat"
      />

      <div className="stat-modal__content">
        <header className="stat-modal__header">
          <div>
            <h2>Statlar</h2>
            <span>{modalTitle}</span>
          </div>
          <button
            type="button"
            className="stat-modal__close"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
        </header>

        <div className="stat-modal__body">
          {loading ? (
            <div className="stat-modal__state">
              <span>Stat bilgileri yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="stat-modal__state">
              <span className="error">{error}</span>
            </div>
          ) : statData ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
