'use client'

type Props = {
  icon: string
  levelReq: number
  learned: boolean
  maxed: boolean
  locked: boolean
}

export default function SkillSlot({ icon, levelReq, learned, maxed, locked }: Props) {
  let className = 'skill-slot'
  if (locked) className += ' locked'
  else if (maxed) className += ' maxed'
  else if (learned) className += ' learned'
  else className += ' available'

  return (
    <div className={className} title={`Required Lv: ${levelReq}`}>
      <img src={icon} alt="skill" />
      {maxed && <span className="max-label">max</span>}
    </div>
  )
}
