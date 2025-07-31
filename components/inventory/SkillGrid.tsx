'use client'

type Props = {
  mainTab: 'weapon' | 'force'
  mastery: 'bicheon' | 'heuksal' | 'pacheon' | 'cold' | 'lightning' | 'fire' | 'force'
}

const dummySkill = {
  icon: 'placeholder.png',
  name: 'Cold Wave',
  level: 5,
  isLocked: false,
  isMaxed: false,
}

export default function SkillGrid({ mainTab, mastery }: Props) {
  const { icon, name, level, isLocked, isMaxed } = dummySkill

  return (
    <div className="skill-grid">
      <div className={`skill-slot ${isLocked ? 'locked' : ''} ${isMaxed ? 'maxed' : ''}`}>
        <div className="skill-box">
          <div className="icon-box" />
          {/* Görsel yerine boş kutu */}
        </div>
        <span className="level-indicator">{isMaxed ? 'MAX' : `Lv. ${level}`}</span>
        <div className="buttons">
          <button disabled={isMaxed}>▲</button>
          <button disabled={level === 0}>▼</button>
        </div>
      </div>

      <p>Main tab: {mainTab}</p>
      <p>Mastery: {mastery}</p>
    </div>
  )
}
