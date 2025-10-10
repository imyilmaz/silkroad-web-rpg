'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ActiveCharacter = {
  id: number;
  name: string;
  gold: number | null;
  level?: number;
  race?: string;
};

type ActiveCharacterContextValue = {
  character: ActiveCharacter | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateGold: (gold: number) => void;
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
          gold: payload.character.gold ?? null,
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

  const value = useMemo<ActiveCharacterContextValue>(
    () => ({
      character,
      loading,
      refresh: fetchSession,
      updateGold: (gold: number) => {
        setCharacter((prev) => (prev ? { ...prev, gold } : prev));
      },
    }),
    [character, loading, fetchSession],
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
