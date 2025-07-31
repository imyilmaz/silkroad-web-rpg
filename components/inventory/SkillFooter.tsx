'use client'

type Props = {
  skillPoints: number
  masteryLevel: number
  masteryLimit: number
}

export default function SkillFooter({ skillPoints, masteryLevel, masteryLimit }: Props) {
  return (
    <div className="skill-footer">
      <div className="footer-row">
        <span>Skill point:</span>
        <span>{skillPoints.toLocaleString()}</span>
      </div>
      <div className="footer-row">
        <span>Mastery level total:</span>
        <span>{masteryLevel} / {masteryLimit}</span>
      </div>
    </div>
  )
}
