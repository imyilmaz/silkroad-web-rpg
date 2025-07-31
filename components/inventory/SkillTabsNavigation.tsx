type Props = {
  activeTab: 'weapon' | 'force'
  onChange: (tab: 'weapon' | 'force') => void
}

export default function SkillTabsNavigation({ activeTab, onChange }: Props) {
  return (
    <div className="skill-tabs">
      <button
        className={activeTab === 'weapon' ? 'active' : ''}
        onClick={() => onChange('weapon')}
      >
        Weapon
      </button>
      <button
        className={activeTab === 'force' ? 'active' : ''}
        onClick={() => onChange('force')}
      >
        Force
      </button>
    </div>
  )
}
