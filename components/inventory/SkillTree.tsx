'use client'

import SkillBranch from './SkillBranch'
import SkillTreeHeader from './SkillTreeHeader'

type Skill = {
  icon: string
  levelReq: number
  learned: boolean
  maxed: boolean
  locked: boolean
}

type Branch = {
  passiveIcon: string
  skills: Skill[]
}

type Props = {
  mastery: string
  masteryLevel: number
  branches: Branch[]
}

export default function SkillTree({ mastery, masteryLevel, branches }: Props) {
  return (
    <div className="skill-tree">
      <SkillTreeHeader mastery={mastery} level={masteryLevel} />
      <div className="branches">
        {branches.map((branch, i) => (
          <SkillBranch key={i} {...branch} />
        ))}
      </div>
    </div>
  )
}
