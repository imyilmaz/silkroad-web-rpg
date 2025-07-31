// components/InventoryGrid.tsx
'use client'

type InventorySlot = {
  id?: string
  name?: string
  icon?: string
  slotIndex: number
  quantity?: number
}

type Props = {
  items: InventorySlot[]
}

export default function InventoryGrid({ items }: Props) {
  const filledSlots = new Map(items.map(i => [i.slotIndex, i]))

  return (
    <div className="inventory-grid">
      {[...Array(96)].map((_, i) => {
        const slot = filledSlots.get(i)
        return (
          <div key={i} className="inventory-slot">
            {slot ? (
              <img src={`/icons/${slot.icon}`} alt={slot.name} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}