// inventory/SkillTreeHeader.tsx
'use client'
type Props = {
  mastery: string
  level: number
}

export default function SkillTreeHeader({ mastery, level }: Props) {
  return (
    <div className="skill-tree-header">
      <img src={`/icons/mastery/${mastery}.png`} alt={mastery} />
      <span>{mastery.charAt(0).toUpperCase() + mastery.slice(1)} Mastery</span>
      <span className="level">Lv. {level}</span>
    </div>
  )
}
