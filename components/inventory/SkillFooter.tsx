'use client'

type Props = {
  skillPoints: number;
  masteryLevel: number;
  masteryLimit: number;
  gold?: number;
};

export default function SkillFooter({
  skillPoints,
  masteryLevel,
  masteryLimit,
  gold,
}: Props) {
  return (
    <div className="skill-footer">
      <div className="footer-row">
        <span>Skill point:</span>
        <span>{skillPoints.toLocaleString()}</span>
      </div>
      <div className="footer-row">
        <span>Mastery level total:</span>
        <span>
          {masteryLevel} / {masteryLimit}
        </span>
      </div>
      {typeof gold === "number" && (
        <div className="footer-row">
          <span>Kalan altın:</span>
          <span>{gold.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
