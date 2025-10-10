'use client';

type TabOption = {
  key: string;
  label: string;
};

type Props = {
  tabs: TabOption[];
  activeKey: string;
  onChange: (key: string) => void;
};

export default function SkillTabsNavigation({
  tabs,
  activeKey,
  onChange,
}: Props) {
  return (
    <div className="skill-tabs-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={activeKey === tab.key ? "active" : ""}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
