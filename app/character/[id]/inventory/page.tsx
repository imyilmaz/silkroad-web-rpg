'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import CharacterSidebar from '@/components/inventory/CharacterSidebar';
import InventoryGrid from '@/components/inventory/inventoryGrid';
import EquipmentSlots from '@/components/inventory/EquipmentSlots';
import StatPanel from '@/components/inventory/StatPanel';
import SkillPanel from '@/components/inventory/SkillPanel';
import { useActiveCharacter } from '@/context/ActiveCharacterContext';
import { useInventory } from '@/context/InventoryContext';

type Panel = 'inventory' | 'stat' | 'skill';

export default function CharacterInventoryPage() {
  const params = useParams();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { character, loading: characterLoading, refresh } = useActiveCharacter();
  const {
    items,
    loading: inventoryLoading,
    refresh: refreshInventory,
  } = useInventory();
  const [activePanel, setActivePanel] = useState<Panel>('inventory');

  const activeCharacterMatches =
    character && idParam && Number(idParam) === character.id;

  useEffect(() => {
    if (!activeCharacterMatches && idParam) {
      refresh();
    }
  }, [activeCharacterMatches, idParam, refresh]);

  const itemsToDisplay = useMemo(() => {
    if (!activeCharacterMatches) return [];
    return items;
  }, [activeCharacterMatches, items]);

  const handleRefresh = async () => {
    await Promise.all([refresh(), refreshInventory()]);
  };

  return (
    <main className="character-inventory-screen">
      <header className="inventory-header">
        {characterLoading ? (
          <span>Karakter bilgisi yükleniyor...</span>
        ) : character ? (
          <div className="character-info">
            <span>
              Karakter: <strong>{character.name}</strong>
            </span>
            {character.gold !== null && (
              <span>
                Altın:{' '}
                <strong>
                  {character.gold.toLocaleString('tr-TR')}
                </strong>
              </span>
            )}
          </div>
        ) : (
          <span>Aktif karakter bulunamadı.</span>
        )}
        <button className="btn" onClick={handleRefresh}>
          Bilgileri Yenile
        </button>
      </header>

      <div className="inventory-body">
        <CharacterSidebar onSelect={setActivePanel} />

        {activePanel === 'stat' ? (
          <StatPanel />
        ) : activePanel === 'skill' ? (
          <SkillPanel characterId={idParam} />
        ) : (
          <div className="inventory-content">
            {inventoryLoading ? (
              <p>Envanter yükleniyor...</p>
            ) : (
              <>
                <InventoryGrid items={itemsToDisplay} />
                <EquipmentSlots />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
