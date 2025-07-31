'use client'

import SkillTree from './SkillTree'

type Props = {
  mainTab: 'weapon' | 'force'
  mastery: 'bicheon' | 'heuksal' | 'pacheon' | 'cold' | 'lightning' | 'fire' | 'force'
}

// Geçici örnek veriler
const masteryData: Record<string, {
  level: number;
  branches: {
    passiveIcon: string;
    skills: {
      icon: string;
      levelReq: number;
      learned: boolean;
      maxed: boolean;
      locked: boolean;
    }[];
  }[];
}> = {
  bicheon: {
    level: 130,
    branches: [
      {
        passiveIcon: '/icons/passives/defense.png',
        skills: [
          { icon: '/icons/skills/bicheon/attack1.png', levelReq: 5, learned: true, maxed: false, locked: false },
          { icon: '/icons/skills/bicheon/attack2.png', levelReq: 10, learned: false, maxed: false, locked: true }
        ]
      },
      {
        passiveIcon: '/icons/passives/stun.png',
        skills: [
          { icon: '/icons/skills/bicheon/slash1.png', levelReq: 7, learned: true, maxed: true, locked: false },
          { icon: '/icons/skills/bicheon/slash2.png', levelReq: 14, learned: false, maxed: false, locked: true }
        ]
      }
    ]
  },

  cold: {
    level: 92,
    branches: [
      {
        passiveIcon: '/icons/passives/freeze.png',
        skills: [
          { icon: '/icons/skills/cold/ice1.png', levelReq: 5, learned: true, maxed: false, locked: false },
          { icon: '/icons/skills/cold/ice2.png', levelReq: 9, learned: false, maxed: false, locked: true }
        ]
      }
    ]
  }

  // Diğer mastery’ler buraya eklenebilir...
}

export default function SkillTab({ mainTab, mastery }: Props) {
  const masteryInfo = masteryData[mastery]

  if (!masteryInfo) {
    return <div className="skill-tab">Veri bulunamadı.</div>
  }

  return (
    <div className="skill-tab">
      <SkillTree
        mastery={mastery}
        masteryLevel={masteryInfo.level}
        branches={masteryInfo.branches}
      />
    </div>
  )
}
