'use client';

type Props = {
  skillPoints?: number;
  masteryTotal?: number;
  masteryLimit?: number;
  masteryMultiplier?: number;
  learnedCount?: number;
};

export default function SkillFooter({
  skillPoints,
  masteryTotal,
  masteryLimit,
  masteryMultiplier,
  learnedCount,
}: Props) {
  const formattedSkillPoints =
    typeof skillPoints === "number"
      ? skillPoints.toLocaleString("tr-TR")
      : "-";

  const formattedMastery =
    masteryTotal !== undefined && masteryLimit !== undefined
      ? `${(masteryTotal ?? 0).toLocaleString("tr-TR")} / ${
          masteryLimit ?? 0
        }`
      : "-";

  return (
    <div className="skill-footer">
      <div className="footer-row">
        <span>Kalan yetenek puani:</span>
        <span>{formattedSkillPoints}</span>
      </div>
      <div className="footer-row">
        <span>Toplam ustalik:</span>
        <span>{formattedMastery}</span>
      </div>
      {typeof masteryMultiplier === "number" && (
        <div className="footer-row">
          <span>Limit carpani:</span>
          <span>x{masteryMultiplier}</span>
        </div>
      )}
      {typeof learnedCount === "number" && (
        <div className="footer-row">
          <span>Aktif sekmede ogrenilen:</span>
          <span>{learnedCount.toLocaleString("tr-TR")}</span>
        </div>
      )}
    </div>
  );
}
