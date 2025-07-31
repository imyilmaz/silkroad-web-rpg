'use client'

import SkillSlot from "./SkillSLot"



type Skill = {
  icon: string
  levelReq: number
  learned: boolean
  maxed: boolean
  locked: boolean
}

type Props = {
  passiveIcon: string
  skills: Skill[]
}

export default function SkillBranch({ passiveIcon, skills }: Props) {
  return (
    <div className="skill-branch">
      <div className="passive-info">
        <img src={passiveIcon} alt="info" title="Passive effect" />
      </div>
      <div className="skill-row">
        {skills.map((skill, index) => (
          <SkillSlot key={index} {...skill} />
        ))}
      </div>
    </div>
  )
}
