'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useActiveCharacter } from "@/context/ActiveCharacterContext";

type InventoryItem = {
  id: string;
  name: string;
  icon: string;
  slotIndex: number;
  quantity: number;
};

type InventoryContextValue = {
  items: InventoryItem[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const InventoryContext = createContext<InventoryContextValue | undefined>(
  undefined,
);

export const InventoryProvider = ({ children }: { children: React.ReactNode }) => {
  const { character } = useActiveCharacter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    if (!character?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/character/${character.id}/inventory`);
      if (!response.ok) {
        throw new Error(`Inventory fetch failed with status ${response.status}`);
      }
      const payload = await response.json();
      setItems(payload.items ?? []);
    } catch (inventoryError) {
      console.error("Inventory fetch failed:", inventoryError);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [character?.id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const value = useMemo<InventoryContextValue>(
    () => ({
      items,
      loading,
      refresh: fetchInventory,
    }),
    [items, loading, fetchInventory],
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return context;
};
