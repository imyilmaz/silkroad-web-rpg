'use client';

import { useEffect, useMemo, useState } from "react";
import SkillTabsNavigation from "./SkillTabsNavigation";
import SkillMasteryTabs from "./SkillMasteryTabs";
import SkillGrid from "./SkillGrid";
import SkillFooter from "./SkillFooter";
import { useActiveCharacter } from "@/context/ActiveCharacterContext";

type SkillResponse = {
  slug: string;
  name: string;
  description: string;
  type: string;
  rankMax: number;
  resourceCost: number | null;
  cooldownSeconds: number | null;
  requiredLevel: number;
  unlockCost: number;
  rankCost: number;
  prerequisiteSlug: string | null;
  characterState: {
    rank: number;
    unlocked: boolean;
  } | null;
};

type DisciplineResponse = {
  slug: string;
  name: string;
  description: string;
  element: string | null;
  skills: SkillResponse[];
};

type DisciplinesApiResponse = {
  disciplines: DisciplineResponse[];
  character?: {
    gold: number;
  };
};

type SkillPanelProps = {
  characterId?: string | number;
};

type ActiveSkill = {
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

const fallbackElementLabel = "Element Yok";

const formatLabel = (input: string | null | undefined) => {
  if (!input) return fallbackElementLabel;
  return input
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const elementKey = (value: string | null | undefined) =>
  value ?? fallbackElementLabel;

export default function SkillPanel({ characterId }: SkillPanelProps) {
  const { character: activeCharacter, updateGold, refresh } =
    useActiveCharacter();
  const [disciplines, setDisciplines] = useState<DisciplineResponse[]>([]);
  const [characterGold, setCharacterGold] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<string>(fallbackElementLabel);
  const [activeDiscipline, setActiveDiscipline] = useState<string>("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const endpoint = characterId
          ? `/api/character/${characterId}/skills`
          : "/api/reference/skills";
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error("Yetenek listesi getirilemedi.");
        }
        const payload = (await response.json()) as DisciplinesApiResponse;
        if (!isMounted) return;

        const received = payload.disciplines ?? [];
        setDisciplines(received);

        if (typeof payload.character?.gold === "number") {
          setCharacterGold(payload.character.gold);
          if (
            activeCharacter &&
            characterId &&
            Number(characterId) === activeCharacter.id
          ) {
            updateGold(payload.character.gold);
          }
        } else if (!characterId) {
          setCharacterGold(null);
        }

        setError(null);
      } catch (fetchError) {
        if (!isMounted) return;
        console.error(fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Yetenek listesi alınamadı.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [characterId, refreshToken, activeCharacter, updateGold]);

  useEffect(() => {
    if (disciplines.length === 0) {
      setActiveElement(fallbackElementLabel);
      setActiveDiscipline("");
      return;
    }

    setActiveElement((current) => {
      const availableElements = disciplines.map((d) => elementKey(d.element));
      if (availableElements.includes(current)) {
        return current;
      }
      return availableElements[0] ?? fallbackElementLabel;
    });
  }, [disciplines]);

  useEffect(() => {
    if (disciplines.length === 0) {
      setActiveDiscipline("");
      return;
    }

    const elementDisciplines = disciplines.filter(
      (discipline) => elementKey(discipline.element) === activeElement,
    );

    if (elementDisciplines.length === 0) {
      setActiveDiscipline("");
      return;
    }

    setActiveDiscipline((current) => {
      const availableSlugs = elementDisciplines.map((d) => d.slug);
      if (availableSlugs.includes(current)) {
        return current;
      }
      return availableSlugs[0] ?? "";
    });
  }, [disciplines, activeElement]);

  const groupedByElement = useMemo(() => {
    const map = new Map<string, DisciplineResponse[]>();
    disciplines.forEach((discipline) => {
      const key = elementKey(discipline.element);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(discipline);
    });
    return map;
  }, [disciplines]);

  const elementTabs = useMemo(
    () =>
      Array.from(groupedByElement.keys()).map((key) => ({
        key,
        label: formatLabel(key),
      })),
    [groupedByElement],
  );

  const disciplineTabs = useMemo(() => {
    const list = groupedByElement.get(activeElement) ?? [];
    return list.map((item) => ({
      key: item.slug,
      label: item.name,
    }));
  }, [groupedByElement, activeElement]);

  const globalStateMap = useMemo(() => {
    const map = new Map<string, { rank: number; unlocked: boolean }>();
    disciplines.forEach((discipline) => {
      discipline.skills.forEach((skill) => {
        map.set(
          skill.slug,
          skill.characterState ?? { rank: 0, unlocked: false },
        );
      });
    });
    return map;
  }, [disciplines]);

  const activeSkills: ActiveSkill[] = useMemo(() => {
    const list = groupedByElement.get(activeElement) ?? [];
    const discipline = list.find((item) => item.slug === activeDiscipline);
    if (!discipline) return [];

    return discipline.skills.map((skill) => {
      const state = skill.characterState ?? { rank: 0, unlocked: false };
      const prerequisiteUnlocked =
        !skill.prerequisiteSlug ||
        (globalStateMap.get(skill.prerequisiteSlug)?.unlocked ?? false);
      const isLocked = !prerequisiteUnlocked;

      return {
        slug: skill.slug,
        name: skill.name,
        description: skill.description,
        type: skill.type,
        requiredLevel: skill.requiredLevel,
        rankMax: skill.rankMax,
        resourceCost: skill.resourceCost,
        cooldownSeconds: skill.cooldownSeconds,
        unlockCost: skill.unlockCost,
        rankCost: skill.rankCost,
        rank: state.rank,
        unlocked: state.unlocked,
        isLocked,
      };
    });
  }, [groupedByElement, globalStateMap, activeElement, activeDiscipline]);

  const learnedCount = useMemo(
    () => activeSkills.filter((skill) => skill.unlocked).length,
    [activeSkills],
  );

  const totalRank = useMemo(
    () => activeSkills.reduce((total, skill) => total + skill.rank, 0),
    [activeSkills],
  );

  const totalRankLimit = useMemo(
    () => activeSkills.reduce((total, skill) => total + skill.rankMax, 0),
    [activeSkills],
  );

  const handleSkillUpdated = (updatedGold?: number) => {
    if (
      typeof updatedGold === "number" &&
      characterId &&
      activeCharacter &&
      Number(characterId) === activeCharacter.id
    ) {
      updateGold(updatedGold);
      setCharacterGold(updatedGold);
    } else if (updatedGold !== undefined) {
      setCharacterGold(updatedGold);
    } else if (characterId) {
      refresh();
    }

    setRefreshToken((value) => value + 1);
  };

  if (loading) {
    return (
      <div className="skill-panel">
        <p>Yetenek ağı yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="skill-panel">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (disciplines.length === 0) {
    return (
      <div className="skill-panel">
        <p>Henüz tanımlı bir disiplin bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="skill-panel">
      <SkillTabsNavigation
        tabs={elementTabs}
        activeKey={activeElement}
        onChange={(key) => setActiveElement(key)}
      />

      <SkillMasteryTabs
        tabs={disciplineTabs}
        activeKey={activeDiscipline}
        onSelect={(key) => setActiveDiscipline(key)}
      />

      <SkillGrid
        skills={activeSkills}
        characterId={characterId}
        availableGold={characterGold ?? undefined}
        onSkillUpdated={handleSkillUpdated}
      />

      <SkillFooter
        skillPoints={learnedCount}
        masteryLevel={totalRank}
        masteryLimit={totalRankLimit}
        gold={characterGold ?? undefined}
      />
    </div>
  );
}
