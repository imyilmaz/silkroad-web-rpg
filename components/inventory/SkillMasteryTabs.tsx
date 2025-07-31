type Mastery =
  | 'bicheon'
  | 'heuksal'
  | 'pacheon'
  | 'cold'
  | 'lightning'
  | 'fire'
  | 'force'

type Props = {
  mainTab: 'weapon' | 'force'
  activeMastery: Mastery
  onSelect: (tab: Props['activeMastery']) => void
}

export default function SkillMasteryTabs({
  mainTab,
  activeMastery,
  onSelect,
}: Props) {
  const tabs =
    mainTab === 'weapon'
      ? ['bicheon', 'heuksal', 'pacheon']
      : ['cold', 'lightning', 'fire', 'force']

  return (
    <div className="mastery-tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeMastery === tab ? 'active' : ''}
          onClick={() => onSelect(tab as Mastery)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
