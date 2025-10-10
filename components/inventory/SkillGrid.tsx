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
  rank: number;
  unlocked: boolean;
  isLocked: boolean;
};

type Props = {
  skills: SkillEntry[];
  characterId?: string | number;
  availableGold?: number;
  onSkillUpdated?: (updatedGold?: number) => void;
};

export default function SkillGrid({
  skills,
  characterId,
  availableGold,
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
      availableGold !== undefined &&
      availableGold !== null &&
      cost > availableGold
    ) {
      toast.error("Bu işlem için yeterli altınınız yok.");
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
            : "Yetenek güncellemesi başarısız oldu.";
        toast.error(message);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.success(
          data.message ??
            (action === "unlock"
              ? `${skill.name} açıldı!`
              : `${skill.name} seviyesi arttı!`),
        );
        onSkillUpdated?.(typeof data.characterGold === "number" ? data.characterGold : undefined);
      }
    } catch (error) {
      console.error("Skill update error:", error);
      toast.error("Yetenek güncellemesi sırasında hata oluştu.");
    } finally {
      setPendingSkill(null);
    }
  };

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
          availableGold === undefined ||
          availableGold === null ||
          skill.unlockCost <= availableGold;
        const rankAffordable =
          availableGold === undefined ||
          availableGold === null ||
          skill.rankCost <= availableGold;

        const canUnlock =
          hasCharacter && !skill.unlocked && !skill.isLocked && unlockAffordable;
        const canRankUp =
          hasCharacter &&
          skill.unlocked &&
          skill.rank < skill.rankMax &&
          rankAffordable;

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
                <span>Maliyet: {skill.resourceCost}</span>
              )}
              {skill.cooldownSeconds !== null && (
                <span>Bekleme: {skill.cooldownSeconds}s</span>
              )}
              {skill.unlockCost > 0 && (
                <span>Kilit açma: {skill.unlockCost} altın</span>
              )}
              {skill.rankCost > 0 && (
                <span>Seviye artışı: {skill.rankCost} altın</span>
              )}
            </div>
            {hasCharacter && (
              <div className="skill-actions">
                {canUnlock && (
                  <button
                    disabled={pendingSkill === skill.slug}
                    onClick={() => handleAction(skill, "unlock")}
                  >
                    Kilidi Aç
                  </button>
                )}
                {canRankUp && (
                  <button
                    disabled={pendingSkill === skill.slug}
                    onClick={() => handleAction(skill, "rank-up")}
                  >
                    Seviye Artır
                  </button>
                )}
                {!canUnlock && !skill.unlocked && !skill.isLocked && !unlockAffordable && (
                  <span className="skill-warning">Altın yetersiz</span>
                )}
                {skill.unlocked && skill.rank < skill.rankMax && !canRankUp && !rankAffordable && (
                  <span className="skill-warning">Altın yetersiz</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
