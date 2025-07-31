// components/CharacterSidebar.tsx
'use client'
type Props = {
    onSelect: (panel: 'inventory' | 'stat' | 'skill') => void
}
export default function CharacterSidebar({ onSelect }: Props) {
    return (
        <div className="sidebar">
            <button onClick={() => onSelect('inventory')}>Inventory</button>
            <button onClick={() => onSelect('stat')}>Stat</button>
            <button onClick={() => onSelect('skill')}>Skill</button>
        </div>
    )
}