'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import CharacterSidebar from '@/components/inventory/CharacterSidebar'
import InventoryGrid from '@/components/inventory/inventoryGrid'
import EquipmentSlots from '@/components/inventory/EquipmentSlots'
import StatPanel from '@/components/inventory/StatPanel'
import SkillPanel from '@/components/inventory/SkillPanel'

type InventoryItemClient = {
    id: string
    name: string
    icon: string
    slotIndex: number
    quantity: number
}

export default function CharacterInventoryPage() {
    const { id } = useParams()
    const [items, setItems] = useState<InventoryItemClient[]>([])
    const [activePanel, setActivePanel] = useState<'inventory' | 'stat' | 'skill'>('inventory')
    useEffect(() => {
        fetch(`/api/character/${id}/inventory`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then(data => setItems(data.items))
            .catch(err => console.error('Inventory error:', err))
    }, [id])

    return (
        <main className="character-inventory-screen">
            <CharacterSidebar onSelect={setActivePanel} />
            {activePanel === 'stat' ? (
                <StatPanel />
            ) : activePanel === 'skill' ? (
                <SkillPanel />
            ) : (
                <div className="inventory-content">
                    <InventoryGrid items={items} />
                    <EquipmentSlots />
                </div>
            )}
        </main>
    )
}
