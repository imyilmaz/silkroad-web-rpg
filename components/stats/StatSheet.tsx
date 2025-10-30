'use client';

import type { StatSummary } from "@/lib/game/statFormulas";

type StatSheetProps = {
  name: string;
  level: number;
  statPoints: number;
  strength: number;
  intelligence: number;
  summary: StatSummary;
  honorPoints?: number | null;
  onAllocate: (attribute: "strength" | "intelligence") => void;
  allocating?: "strength" | "intelligence" | null;
};

const formatValue = (value: number) =>
  value.toLocaleString("tr-TR", { maximumFractionDigits: 0 });

const safePercent = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

export default function StatSheet({
  name,
  level,
  statPoints,
  strength,
  intelligence,
  summary,
  honorPoints,
  onAllocate,
  allocating = null,
}: StatSheetProps) {
  const hp = summary.vitals.hp;
  const mp = summary.vitals.mp;
  const exp = summary.exp;
  const hpPercent =
    hp.max > 0 ? safePercent((hp.current / hp.max) * 100) : 0;
  const mpPercent =
    mp.max > 0 ? safePercent((mp.current / mp.max) * 100) : 0;
  const expPercent = safePercent(exp.percent);

  const disableStrength = statPoints <= 0 || allocating === "strength";
  const disableIntelligence = statPoints <= 0 || allocating === "intelligence";

  return (
    <div className="stat-sheet">
      <header className="stat-sheet__header">
        <div>
          <h2>{name}</h2>
          <span>Lv {level}</span>
        </div>
        <button
          type="button"
          className="stat-sheet__header-button"
          disabled
        >
          {statPoints} Stat Point
        </button>
      </header>

      <section className="stat-sheet__exp">
        <div className="stat-sheet__exp-row">
          <span>Current Exp.</span>
          <strong>{formatValue(exp.current)}</strong>
        </div>
        <div className="stat-sheet__exp-row">
          <span>Next Exp.</span>
          <strong>{formatValue(exp.required)}</strong>
        </div>
        <div className="stat-sheet__exp-row">
          <span>Honor Point</span>
          <strong>{honorPoints ?? "N/A"}</strong>
        </div>
        <div className="stat-sheet__exp-bar">
          <div
            className="stat-sheet__exp-fill"
            style={{ width: `${expPercent}%` }}
          />
        </div>
      </section>

      <div className="stat-sheet__attributes">
        <div className="stat-sheet__column stat-sheet__column--strength">
          <div className="stat-sheet__stat-control">
            <div>
              <span className="label">Str</span>
              <strong>{strength}</strong>
            </div>
            <button
              type="button"
              onClick={() => onAllocate("strength")}
              disabled={disableStrength}
            >
              +
            </button>
          </div>

          <div className="stat-sheet__bar stat-sheet__bar--hp">
            <div className="stat-sheet__bar-header">
              <span>HP</span>
              <span>
                {formatValue(hp.current)} / {formatValue(hp.max)}
              </span>
            </div>
            <div className="stat-sheet__track">
              <div
                className="stat-sheet__fill"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          <ul className="stat-sheet__list">
            <li>
              <span>Phy. atk</span>
              <strong>
                {formatValue(summary.derived.phyAtkMin)} ~{" "}
                {formatValue(summary.derived.phyAtkMax)}
              </strong>
            </li>
            <li>
              <span>Phy. def</span>
              <strong>{formatValue(summary.derived.phyDef)}</strong>
            </li>
            <li>
              <span>Phy. balance</span>
              <strong>{summary.derived.phyBalance}%</strong>
            </li>
            <li>
              <span>Hit rate</span>
              <strong>{formatValue(summary.derived.hitRate)}</strong>
            </li>
          </ul>
        </div>

        <div className="stat-sheet__column stat-sheet__column--intelligence">
          <div className="stat-sheet__stat-control">
            <div>
              <span className="label">Int</span>
              <strong>{intelligence}</strong>
            </div>
            <button
              type="button"
              onClick={() => onAllocate("intelligence")}
              disabled={disableIntelligence}
            >
              +
            </button>
          </div>

          <div className="stat-sheet__bar stat-sheet__bar--mp">
            <div className="stat-sheet__bar-header">
              <span>MP</span>
              <span>
                {formatValue(mp.current)} / {formatValue(mp.max)}
              </span>
            </div>
            <div className="stat-sheet__track">
              <div
                className="stat-sheet__fill"
                style={{ width: `${mpPercent}%` }}
              />
            </div>
          </div>

          <ul className="stat-sheet__list">
            <li>
              <span>Mag. atk</span>
              <strong>
                {formatValue(summary.derived.magAtkMin)} ~{" "}
                {formatValue(summary.derived.magAtkMax)}
              </strong>
            </li>
            <li>
              <span>Mag. def</span>
              <strong>{formatValue(summary.derived.magDef)}</strong>
            </li>
            <li>
              <span>Mag. balance</span>
              <strong>{summary.derived.magBalance}%</strong>
            </li>
            <li>
              <span>Parry ratio</span>
              <strong>{formatValue(summary.derived.parryRatio)}</strong>
            </li>
          </ul>
        </div>
      </div>

      <footer className="stat-sheet__jobs">
        <div className="stat-sheet__jobs-row">
          <span>Trader 1 level Apprentice Trader Lv1</span>
          <span>0% (0)</span>
        </div>
        <div className="stat-sheet__jobs-row">
          <span>Hunter 1 level Novice Hunter Lv1</span>
          <span>0% (0)</span>
        </div>
        <div className="stat-sheet__jobs-row">
          <span>Thief 1 level Novice Thief Lv1</span>
          <span>0% (0)</span>
        </div>
      </footer>
    </div>
  );
}
