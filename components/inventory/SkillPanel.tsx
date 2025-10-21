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

type CharacterMasteryPayload = {
  total: number;
  limit: number;
  multiplier: number;
};

type DisciplinesApiResponse = {
  disciplines: DisciplineResponse[];
  character?: {
    gold?: number;
    level?: number;
    skillPoints?: number;
    mastery?: CharacterMasteryPayload;
  };
  masteryMultiplier?: number;
};

type SkillPanelProps = {
  characterId?: string | number;
  onSkillPointsChange?: (nextSkillPoints: number) => void;
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

type SkillUpdateState = {
  skillPoints?: number;
  masteryTotal?: number;
  masteryLimit?: number;
};

const fallbackElementLabel = "Element Yok";
const DEFAULT_MASTERY_MULTIPLIER = 3;

const formatLabel = (input: string | null | undefined) => {
  if (!input) return fallbackElementLabel;
  return input
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const elementKey = (value: string | null | undefined) =>
  value ?? fallbackElementLabel;

export default function SkillPanel({
  characterId,
  onSkillPointsChange,
}: SkillPanelProps) {
  const { character: activeCharacter, updateSkillPoints, refresh } =
    useActiveCharacter();
  const activeCharacterId = activeCharacter?.id;
  const [disciplines, setDisciplines] = useState<DisciplineResponse[]>([]);
  const [characterSkillPoints, setCharacterSkillPoints] = useState<number | null>(
    null,
  );
  const [characterLevel, setCharacterLevel] = useState<number | null>(null);
  const [masteryTotal, setMasteryTotal] = useState<number | null>(null);
  const [masteryLimit, setMasteryLimit] = useState<number | null>(null);
  const [masteryMultiplier, setMasteryMultiplier] = useState<number>(
    DEFAULT_MASTERY_MULTIPLIER,
  );
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

        const payloadMultiplier =
          typeof payload.character?.mastery?.multiplier === "number"
            ? payload.character.mastery.multiplier
            : typeof payload.masteryMultiplier === "number"
              ? payload.masteryMultiplier
              : DEFAULT_MASTERY_MULTIPLIER;
        setMasteryMultiplier(payloadMultiplier);

        if (payload.character) {
          if (typeof payload.character.skillPoints === "number") {
            setCharacterSkillPoints(payload.character.skillPoints);
            if (
              activeCharacterId &&
              characterId &&
              Number(characterId) === activeCharacterId
            ) {
              updateSkillPoints(payload.character.skillPoints);
            }
            onSkillPointsChange?.(payload.character.skillPoints);
          } else if (!characterId) {
            setCharacterSkillPoints(null);
          }

          if (typeof payload.character.level === "number") {
            setCharacterLevel(payload.character.level);
          } else if (!characterId) {
            setCharacterLevel(null);
          }

          const masteryPayload = payload.character.mastery ?? null;
          if (masteryPayload) {
            setMasteryTotal(masteryPayload.total ?? 0);
            if (typeof masteryPayload.limit === "number") {
              setMasteryLimit(masteryPayload.limit);
            } else if (typeof payload.character.level === "number") {
              setMasteryLimit(
                payload.character.level *
                  (masteryPayload.multiplier ?? payloadMultiplier),
              );
            } else {
              setMasteryLimit(null);
            }
          } else {
            setMasteryTotal(null);
            if (typeof payload.character.level === "number") {
              setMasteryLimit(payload.character.level * payloadMultiplier);
            } else if (!characterId) {
              setMasteryLimit(null);
            }
          }
        } else {
          if (!characterId) {
            setCharacterSkillPoints(null);
            setCharacterLevel(null);
            setMasteryTotal(null);
            setMasteryLimit(null);
          }
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
  }, [characterId, refreshToken, activeCharacterId, updateSkillPoints, onSkillPointsChange]);

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

    const skills: ActiveSkill[] = [];

    discipline.skills.forEach((skill) => {
      const state = skill.characterState ?? { rank: 0, unlocked: false };
      const meetsLevel =
        characterLevel === null ||
        characterLevel === undefined ||
        characterLevel >= skill.requiredLevel ||
        state.unlocked;

      if (!meetsLevel && !state.unlocked) {
        return;
      }

      const prerequisiteUnlocked =
        !skill.prerequisiteSlug ||
        (globalStateMap.get(skill.prerequisiteSlug)?.unlocked ?? false);
      const isLocked = !state.unlocked && !prerequisiteUnlocked;

      skills.push({
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
      });
    });

    return skills;
  }, [
    groupedByElement,
    globalStateMap,
    activeElement,
    activeDiscipline,
    characterLevel,
  ]);

  const learnedCount = useMemo(
    () => activeSkills.filter((skill) => skill.unlocked).length,
    [activeSkills],
  );

  const handleSkillUpdated = (update?: SkillUpdateState) => {
    if (
      update &&
      typeof update.skillPoints === "number" &&
      characterId &&
      activeCharacter &&
      Number(characterId) === activeCharacter.id
    ) {
      updateSkillPoints(update.skillPoints);
      setCharacterSkillPoints(update.skillPoints);
      onSkillPointsChange?.(update.skillPoints);
    } else if (update && typeof update.skillPoints === "number") {
      setCharacterSkillPoints(update.skillPoints);
      onSkillPointsChange?.(update.skillPoints);
    } else if (!update && characterId) {
      void refresh();
    }

    if (update && typeof update.masteryTotal === "number") {
      setMasteryTotal(update.masteryTotal);
    }
    if (update && typeof update.masteryLimit === "number") {
      setMasteryLimit(update.masteryLimit);
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
        availableSkillPoints={characterSkillPoints ?? undefined}
        masteryTotal={masteryTotal ?? undefined}
        masteryLimit={masteryLimit ?? undefined}
        onSkillUpdated={handleSkillUpdated}
      />

      <SkillFooter
        skillPoints={characterSkillPoints ?? undefined}
        masteryTotal={masteryTotal ?? undefined}
        masteryLimit={masteryLimit ?? undefined}
        masteryMultiplier={masteryMultiplier}
        learnedCount={learnedCount}
      />
    </div>
  );
}
