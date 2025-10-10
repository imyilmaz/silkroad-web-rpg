'use client';

type Props = {
  tabs: Array<{ key: string; label: string }>;
  activeKey: string;
  onSelect: (key: string) => void;
};

export default function SkillMasteryTabs({
  tabs,
  activeKey,
  onSelect,
}: Props) {
  return (
    <div className="skill-mastery-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={activeKey === tab.key ? "active" : ""}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
