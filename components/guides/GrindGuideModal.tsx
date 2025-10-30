'use client';

import { useEffect, useMemo, useState } from "react";
import { grindRoutes, type GrindRoute } from "@/lib/game/grindRoutes";
import { useActiveCharacter } from "@/context/ActiveCharacterContext";

type GrindGuideModalProps = {
  onClose: () => void;
  engagedRouteId?: string | null;
  onStartRoute: (route: GrindRoute) => void;
  onStopRoute: () => void;
};

const formatLevelRange = (route: GrindRoute) =>
  `${route.levelRange.min} - ${route.levelRange.max}`;

const pickInitialRoute = (
  routes: GrindRoute[],
  level?: number | null,
) => {
  if (typeof level === "number") {
    const match = routes.find(
      (route) =>
        level >= route.levelRange.min && level <= route.levelRange.max,
    );
    if (match) {
      return match.id;
    }
  }

  return routes[0]?.id ?? "";
};

const formatReward = (value: number) =>
  value >= 1000 ? `${Math.round(value / 100) / 10}k` : value.toString();

export default function GrindGuideModal({
  onClose,
  engagedRouteId = null,
  onStartRoute,
  onStopRoute,
}: GrindGuideModalProps) {
  const { character } = useActiveCharacter();
  const characterLevel = character?.level ?? null;
  const [selectedRouteId, setSelectedRouteId] = useState(() =>
    pickInitialRoute(grindRoutes, characterLevel),
  );

  useEffect(() => {
    if (engagedRouteId) {
      setSelectedRouteId(engagedRouteId);
    }
  }, [engagedRouteId]);

  const activeRoute = useMemo(
    () => grindRoutes.find((route) => route.id === selectedRouteId) ?? null,
    [selectedRouteId],
  );

  const difficultyLabel = (route: GrindRoute) => {
    switch (route.difficulty) {
      case "kolay":
        return "Kolay";
      case "orta":
        return "Orta";
      case "zor":
        return "Zor";
      default:
        return route.difficulty;
    }
  };

  return (
    <div className="grind-guide-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="grind-guide-modal__scrim"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div className="grind-guide-modal__content">
        <header className="grind-guide-modal__header">
          <div>
            <h2>Kasilma Rehberi</h2>
            <span>
              {character?.name
                ? `${character.name} • Lv ${character.level}`
                : "Aktif karakter yok"}
            </span>
          </div>
          <button
            type="button"
            className="grind-guide-modal__close"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
        </header>

        <div className="grind-guide-modal__timeline">
          {grindRoutes.map((route) => {
            const isActive = route.id === selectedRouteId;
            const isEngaged = route.id === engagedRouteId;
            const isUpcoming =
              characterLevel !== null && characterLevel < route.levelRange.min;

            return (
              <button
                key={route.id}
                type="button"
                className={`grind-guide-timeline__item${
                  isActive ? " grind-guide-timeline__item--active" : ""
                }${
                  isEngaged ? " grind-guide-timeline__item--engaged" : ""
                }${
                  isUpcoming ? " grind-guide-timeline__item--upcoming" : ""
                }`}
                onClick={() => setSelectedRouteId(route.id)}
              >
                <span className="grind-guide-timeline__range">
                  {formatLevelRange(route)}
                </span>
                <span className="grind-guide-timeline__title">
                  {route.title}
                </span>
              </button>
            );
          })}
        </div>

        {activeRoute ? (
          <div className="grind-guide">
            <section className="grind-guide__summary">
              <div className="grind-guide__summary-top">
                <div>
                  <h3>{activeRoute.title}</h3>
                  <p>{activeRoute.focus}</p>
                </div>
                <div className="grind-guide__badge">
                  <span>Lv {formatLevelRange(activeRoute)}</span>
                  <small>{difficultyLabel(activeRoute)}</small>
                </div>
                <div className="grind-guide__summary-actions">
                  <button
                    type="button"
                    className={`grind-guide__action-button${
                      engagedRouteId === activeRoute.id
                        ? " grind-guide__action-button--stop"
                        : ""
                    }`}
                    onClick={() =>
                      engagedRouteId === activeRoute.id
                        ? onStopRoute()
                        : onStartRoute(activeRoute)
                    }
                  >
                    {engagedRouteId === activeRoute.id
                      ? "Kasilmayi Durdur"
                      : "Kasilmayi Baslat"}
                  </button>
                  {engagedRouteId === activeRoute.id ? (
                    <span className="grind-guide__summary-active">
                      Kasilma aktif
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grind-guide__preparation">
                {activeRoute.preparation.map((phase) => (
                  <article key={phase.title} className="grind-guide-prep__card">
                    <h4>{phase.title}</h4>
                    <p>{phase.description}</p>
                    {phase.checklist ? (
                      <ul>
                        {phase.checklist.map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="grind-guide__spots">
              <article className="grind-guide-spot grind-guide-spot--primary">
                <header>
                  <h4>Birincil Rota: {activeRoute.primarySpot.name}</h4>
                  <span>
                    {activeRoute.primarySpot.regionSlug.toUpperCase()} • {" "}
                    {activeRoute.primarySpot.coordinates ?? "Koordinat yok"}
                  </span>
                </header>
                <div className="grind-guide-spot__body">
                  <div className="grind-guide-spot__meta">
                    <div>
                      <strong>Moblar</strong>
                      <ul>
                        {activeRoute.primarySpot.mobs.map((mob) => (
                          <li key={mob}>{mob}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Oneri</strong>
                      <ul>
                        {activeRoute.primarySpot.recommendedStats.str ? (
                          <li>
                            STR ? {activeRoute.primarySpot.recommendedStats.str}
                          </li>
                        ) : null}
                        {activeRoute.primarySpot.recommendedStats.int ? (
                          <li>
                            INT ? {activeRoute.primarySpot.recommendedStats.int}
                          </li>
                        ) : null}
                        {activeRoute.primarySpot.recommendedStats.weapon ? (
                          <li>{activeRoute.primarySpot.recommendedStats.weapon}</li>
                        ) : null}
                      </ul>
                    </div>
                    <div>
                      <strong>Saatlik kazanc</strong>
                      <ul>
                        <li>
                          EXP {" "}
                          {formatReward(activeRoute.primarySpot.rewards.expPerHour)}
                        </li>
                        <li>
                          SP {" "}
                          {formatReward(activeRoute.primarySpot.rewards.spPerHour)}
                        </li>
                        <li>
                          Altin {" "}
                          {formatReward(activeRoute.primarySpot.rewards.goldPerHour)}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="grind-guide-spot__notes">
                    <p>{activeRoute.primarySpot.notes}</p>
                    {activeRoute.primarySpot.drops ? (
                      <footer>
                        Onemli drop: {activeRoute.primarySpot.drops.join(", ")}
                      </footer>
                    ) : null}
                  </div>
                </div>
              </article>

              {activeRoute.alternativeSpots?.length ? (
                <div className="grind-guide__alternatives">
                  <h4>Alternatif Rotalar</h4>
                  <div className="grind-guide-alternatives__grid">
                    {activeRoute.alternativeSpots.map((spot) => (
                      <article
                        key={spot.name}
                        className="grind-guide-spot grind-guide-spot--alt"
                      >
                        <header>
                          <h5>{spot.name}</h5>
                          <span>
                            {spot.regionSlug.toUpperCase()} {" "}
                            {spot.coordinates ? `• ${spot.coordinates}` : ""}
                          </span>
                        </header>
                        <div className="grind-guide-spot__body">
                          <div className="grind-guide-spot__meta">
                            <div>
                              <strong>Moblar</strong>
                              <ul>
                                {spot.mobs.map((mob) => (
                                  <li key={mob}>{mob}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <strong>Oneri</strong>
                              <ul>
                                {spot.recommendedStats.str ? (
                                  <li>STR ? {spot.recommendedStats.str}</li>
                                ) : null}
                                {spot.recommendedStats.int ? (
                                  <li>INT ? {spot.recommendedStats.int}</li>
                                ) : null}
                                {spot.recommendedStats.weapon ? (
                                  <li>{spot.recommendedStats.weapon}</li>
                                ) : null}
                              </ul>
                            </div>
                          </div>
                          <p>{spot.notes}</p>
                          <footer>
                            Saatlik EXP {formatReward(spot.rewards.expPerHour)} • SP {formatReward(spot.rewards.spPerHour)}
                          </footer>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {activeRoute.milestones?.length ? (
              <section className="grind-guide__milestones">
                <h4>Milestone Adimlari</h4>
                <div className="grind-guide-milestones__list">
                  {activeRoute.milestones.map((milestone) => (
                    <article key={milestone.title} className="grind-guide-milestone">
                      <strong>{milestone.title}</strong>
                      <p>{milestone.description}</p>
                      {milestone.checklist ? (
                        <ul>
                          {milestone.checklist.map((entry) => (
                            <li key={entry}>{entry}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="grind-guide__empty">
            <p>Bu seviye araligi icin rota bulunamadi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
