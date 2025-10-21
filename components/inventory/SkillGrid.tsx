"use client";

import { useState } from "react";
import { toast } from "sonner";

type SkillEntry = {
  slug: string;
  name: string;
  description: string;
  type: string;
  requiredLevel: number;
  rankMax: number;
  resourceCost: number | null;
  cooldownSeconds: number | null;
  unlockCost: number;
  rankCost: number;
  rank: number;
  unlocked: boolean;
  isLocked: boolean;
};

type SkillUpdatePayload = {
  skillPoints?: number;
  masteryTotal?: number;
  masteryLimit?: number;
};

type Props = {
  skills: SkillEntry[];
  characterId?: string | number;
  availableSkillPoints?: number;
  masteryTotal?: number;
  masteryLimit?: number;
  onSkillUpdated?: (payload?: SkillUpdatePayload) => void;
};

export default function SkillGrid({
  skills,
  characterId,
  availableSkillPoints,
  masteryTotal,
  masteryLimit,
  onSkillUpdated,
}: Props) {
  const [pendingSkill, setPendingSkill] = useState<string | null>(null);
  const hasCharacter = Boolean(characterId);

  const handleAction = async (
    skill: SkillEntry,
    action: "unlock" | "rank-up",
  ) => {
    if (!characterId) return;

    const cost = action === "unlock" ? skill.unlockCost : skill.rankCost;
    if (
      availableSkillPoints !== undefined &&
      availableSkillPoints !== null &&
      cost > availableSkillPoints
    ) {
      toast.error("Bu islem icin yeterli yetenek puaniniz yok.");
      return;
    }

    setPendingSkill(skill.slug);
    try {
      const response = await fetch(
        `/api/character/${characterId}/skills/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillSlug: skill.slug,
            action,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          typeof data.message === "string"
            ? data.message
            : "Yetenek guncellemesi basarisiz oldu.";
        toast.error(message);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.success(
          data.message ??
            (action === "unlock"
              ? `${skill.name} ogrenildi!`
              : `${skill.name} seviyesi artti!`),
        );
        onSkillUpdated?.({
          skillPoints:
            typeof data.characterSkillPoints === "number"
              ? data.characterSkillPoints
              : undefined,
          masteryTotal:
            typeof data.masteryTotal === "number"
              ? data.masteryTotal
              : undefined,
          masteryLimit:
            typeof data.masteryLimit === "number"
              ? data.masteryLimit
              : undefined,
        });
      }
    } catch (error) {
      console.error("Skill update error:", error);
      toast.error("Yetenek guncellemesi sirasinda hata olustu.");
    } finally {
      setPendingSkill(null);
    }
  };

  const limit = masteryLimit ?? Infinity;
  const total = masteryTotal ?? 0;

  return (
    <div className="skill-grid">
      {skills.map((skill) => {
        const classNames = ["skill-slot"];
        if (skill.isLocked) {
          classNames.push("locked");
        } else if (skill.unlocked) {
          classNames.push(skill.rank >= skill.rankMax ? "maxed" : "learned");
        } else {
          classNames.push("available");
        }

        const unlockAffordable =
          availableSkillPoints === undefined ||
          availableSkillPoints === null ||
          skill.unlockCost <= availableSkillPoints;
        const rankAffordable =
          availableSkillPoints === undefined ||
          availableSkillPoints === null ||
          skill.rankCost <= availableSkillPoints;

        const projectedUnlockTotal =
          total - skill.rank + (skill.rank > 0 ? skill.rank : 1);
        const projectedRankTotal = total - skill.rank + (skill.rank + 1);

        const unlockWithinLimit = projectedUnlockTotal <= limit;
        const rankWithinLimit = projectedRankTotal <= limit;

        const canUnlock =
          hasCharacter &&
          !skill.unlocked &&
          !skill.isLocked &&
          unlockAffordable &&
          unlockWithinLimit;
        const canRankUp =
          hasCharacter &&
          skill.unlocked &&
          skill.rank < skill.rankMax &&
          rankAffordable &&
          rankWithinLimit;

        return (
          <div
            key={skill.slug}
            className={classNames.join(" ")}
            title={skill.description}
          >
            <span className="skill-name">{skill.name}</span>
            <span className="level-indicator">Lv. {skill.requiredLevel}</span>
            <span className="rank-indicator">
              {skill.rank}/{skill.rankMax}
            </span>
            <div className="skill-meta">
              <span>{skill.type}</span>
              {skill.resourceCost !== null && (
                <span>Kaynak: {skill.resourceCost}</span>
              )}
              {skill.cooldownSeconds !== null && (
                <span>Bekleme: {skill.cooldownSeconds}s</span>
              )}
              {skill.unlockCost > 0 && (
                <span>Acma maliyeti: {skill.unlockCost} puan</span>
              )}
              {skill.rankCost > 0 && (
                <span>Seviye artisi: {skill.rankCost} puan</span>
              )}
            </div>
            {hasCharacter && (
              <div className="skill-actions">
                {canUnlock && (
                  <button
                    disabled={pendingSkill === skill.slug}
                    onClick={() => handleAction(skill, "unlock")}
                  >
                    Ogren
                  </button>
                )}
                {canRankUp && (
                  <button
                    disabled={pendingSkill === skill.slug}
                    onClick={() => handleAction(skill, "rank-up")}
                  >
                    Seviye Arttir
                  </button>
                )}
                {!canUnlock &&
                  !skill.unlocked &&
                  !skill.isLocked &&
                  !unlockAffordable && (
                    <span className="skill-warning">Puan yetersiz</span>
                  )}
                {!canUnlock &&
                  !skill.unlocked &&
                  !skill.isLocked &&
                  unlockAffordable &&
                  !unlockWithinLimit && (
                    <span className="skill-warning">Ustalik siniri dolu</span>
                  )}
                {skill.unlocked &&
                  skill.rank < skill.rankMax &&
                  !canRankUp &&
                  !rankAffordable && (
                    <span className="skill-warning">Puan yetersiz</span>
                  )}
                {skill.unlocked &&
                  skill.rank < skill.rankMax &&
                  rankAffordable &&
                  !rankWithinLimit && (
                    <span className="skill-warning">Ustalik siniri dolu</span>
                  )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
