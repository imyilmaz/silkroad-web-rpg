'use client'

import { useState } from 'react'
import SkillTabsNavigation from './SkillTabsNavigation'
import SkillMasteryTabs from './SkillMasteryTabs'
import SkillGrid from './SkillGrid'
import SkillFooter from './SkillFooter'

type MainTab = 'weapon' | 'force'
type MasteryTab = 'bicheon' | 'heuksal' | 'pacheon' | 'cold' | 'lightning' | 'fire' | 'force'

export default function SkillPanel() {
  const [mainTab, setMainTab] = useState<MainTab>('weapon')
  const [masteryTab, setMasteryTab] = useState<MasteryTab>('bicheon')

  return (
    <div className="skill-panel">
      <SkillTabsNavigation
        activeTab={mainTab}
        onChange={(tab: MainTab) => {
          setMainTab(tab)
          setMasteryTab(tab === 'weapon' ? 'bicheon' : 'cold') // ilk alt sekme default
        }}
      />
      <SkillMasteryTabs
        mainTab={mainTab}
        activeMastery={masteryTab}
        onSelect={(tab: MasteryTab) => setMasteryTab(tab)}
      />
      <SkillGrid mainTab={mainTab} mastery={masteryTab} />
      <SkillFooter skillPoints={6231768} masteryLevel={830} masteryLimit={900}/>
    </div>
  )
}
