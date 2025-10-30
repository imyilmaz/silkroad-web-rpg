'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { StatSummary } from "@/lib/game/statFormulas";

type ActiveCharacter = {
  id: number;
  name: string;
  gold: number | null;
  skillPoints: number | null;
  statPoints: number | null;
  strength: number | null;
  intelligence: number | null;
  summary?: StatSummary;
  level?: number;
  race?: string;
  exp?: number;
};

type ActiveCharacterContextValue = {
  character: ActiveCharacter | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateGold: (gold: number) => void;
  updateSkillPoints: (skillPoints: number) => void;
  updateStats: (
    stats: Pick<
      ActiveCharacter,
      "statPoints" | "strength" | "intelligence" | "summary"
    >,
  ) => void;
};

const ActiveCharacterContext = createContext<
  ActiveCharacterContextValue | undefined
>(undefined);

export const ActiveCharacterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [character, setCharacter] = useState<ActiveCharacter | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/character/session");
      if (!response.ok) {
        setCharacter(null);
        return;
      }
      const payload = await response.json();
      if (payload.selected && payload.character) {
        setCharacter({
          id: payload.character.id,
          name: payload.character.name,
          level: payload.character.level,
          race: payload.character.race,
          exp: payload.character.exp,
          gold: payload.character.gold ?? null,
          skillPoints: payload.character.skillPoints ?? null,
          statPoints: payload.character.statPoints ?? null,
          strength: payload.character.strength ?? null,
          intelligence: payload.character.intelligence ?? null,
          summary: payload.character.summary,
        });
      } else {
        setCharacter(null);
      }
    } catch (error) {
      console.error("Active character fetch failed:", error);
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const updateGold = useCallback((gold: number) => {
    setCharacter((prev) => (prev ? { ...prev, gold } : prev));
  }, []);

  const updateSkillPoints = useCallback((skillPoints: number) => {
    setCharacter((prev) => (prev ? { ...prev, skillPoints } : prev));
  }, []);

  const updateStats = useCallback(
    (
      stats: Pick<
        ActiveCharacter,
        "statPoints" | "strength" | "intelligence" | "summary"
      >,
    ) => {
      setCharacter((prev) => (prev ? { ...prev, ...stats } : prev));
    },
  []);

  const value = useMemo<ActiveCharacterContextValue>(
    () => ({
      character,
      loading,
      refresh: fetchSession,
      updateGold,
      updateSkillPoints,
      updateStats,
    }),
    [character, loading, fetchSession, updateGold, updateSkillPoints, updateStats],
  );

  return (
    <ActiveCharacterContext.Provider value={value}>
      {children}
    </ActiveCharacterContext.Provider>
  );
};

export const useActiveCharacter = () => {
  const context = useContext(ActiveCharacterContext);
  if (!context) {
    throw new Error(
      "useActiveCharacter must be used within ActiveCharacterProvider",
    );
  }
  return context;
};
