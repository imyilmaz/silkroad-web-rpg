'use client';

import SkillPanel from "@/components/inventory/SkillPanel";

type SkillModalProps = {
  characterId: number;
  characterName: string;
  characterLevel: number;
  skillPoints: number;
  onClose: () => void;
  onSkillPointsChange?: (nextSkillPoints: number) => void;
};

export default function SkillModal({
  characterId,
  characterName,
  characterLevel,
  skillPoints,
  onClose,
  onSkillPointsChange,
}: SkillModalProps) {
  return (
    <div className="skill-modal" role="dialog" aria-modal="true">
      <div
        className="skill-modal__scrim"
        role="presentation"
        onClick={onClose}
      />

      <div className="skill-modal__content">
        <header className="skill-modal__header">
          <div className="skill-modal__title">
            <h2>Yetenekler</h2>
            <span>
              {characterName} · Lv {characterLevel}
            </span>
          </div>
          <div className="skill-modal__resources">
            <span>
              Yetenek Puanı: <strong>{skillPoints}</strong>
            </span>
          </div>
          <button
            type="button"
            className="skill-modal__close"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
        </header>

        <div className="skill-modal__body">
          <SkillPanel
            characterId={characterId}
            onSkillPointsChange={onSkillPointsChange}
          />
        </div>
      </div>
    </div>
  );
}
