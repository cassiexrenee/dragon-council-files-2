import { useState, useEffect, useMemo } from "react";
import {
  Player,
  Snapshot,
  RoleOverride,
  AllianceSettings,
  PlayerClassification,
  PerformanceEvaluation,
  Recommendation
} from "../types";
import {
  buildCohort,
  classifyPlayer,
  evaluatePerformance,
  generateRecommendation,
  reconstructSnapshots,
  getAggregatedPlayerSnapshot
} from "../utils/analytics";

export function useAnalytics(
  players: Player[],
  snapshots: Snapshot[],
  overrides: RoleOverride[],
  settings: AllianceSettings
) {
  const [classifications, setClassifications] = useState<PlayerClassification[]>([]);
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Memoize the computationally heavy snapshot reconstruction
  const cumulativeSnapshots = useMemo(() => {
    if (!settings?.configuration) return [];
    return reconstructSnapshots(
      snapshots,
      settings.configuration.seasonStartDate,
      settings.configuration.seasonEndDate
    );
  }, [snapshots, settings]);

  // Memoize the active current-state roster snapshots
  const activeSnapshots = useMemo(() => {
    return players
      .map((p) => {
        const pSnaps = cumulativeSnapshots.filter((s) => s.playerId === p.characterId);
        return pSnaps.length > 0 ? getAggregatedPlayerSnapshot(pSnaps) : null;
      })
      .filter(Boolean) as Snapshot[];
  }, [players, cumulativeSnapshots]);

  // Recalculate derived analytics whenever core telemetry or settings change
  useEffect(() => {
    if (players.length === 0 || snapshots.length === 0 || !settings) {
      setClassifications([]);
      setEvaluations([]);
      setRecommendations([]);
      return;
    }

    // A. Extract aggregated snapshot across all sessions for each player
    const latestSnaps: Snapshot[] = [];
    players.forEach((p) => {
      const pSnaps = cumulativeSnapshots.filter((s) => s.playerId === p.characterId);
      if (pSnaps.length > 0) {
        latestSnaps.push(getAggregatedPlayerSnapshot(pSnaps));
      }
    });

    const cohort = buildCohort(latestSnaps);

    // B. Classify role for each player
    const newClassifications = players.map((p) => {
      const pSnaps = cumulativeSnapshots.filter((s) => s.playerId === p.characterId);
      const manualOvr = overrides.find((o) => o.playerId === p.characterId)?.role;
      return classifyPlayer(p.characterId, pSnaps, cohort, settings, manualOvr);
    });

    // C. Evaluate role-specific performance score vectors
    const newEvaluations = players.map((p) => {
      const pSnaps = cumulativeSnapshots.filter((s) => s.playerId === p.characterId);
      const classification = newClassifications.find((c) => c.playerId === p.characterId)!;
      return evaluatePerformance(p.characterId, pSnaps, cohort, classification, settings);
    });

    // D. Generate advisory strategic recommendations
    const newRecommendations = players.map((p) => {
      const pSnaps = cumulativeSnapshots.filter((s) => s.playerId === p.characterId);
      const cl = newClassifications.find((c) => c.playerId === p.characterId)!;
      const ev = newEvaluations.find((e) => e.playerId === p.characterId)!;
      return generateRecommendation(p.characterId, cl, ev, pSnaps);
    });

    setClassifications(newClassifications);
    setEvaluations(newEvaluations);
    setRecommendations(newRecommendations);

  }, [players, snapshots, overrides, settings, cumulativeSnapshots]);

  return {
    cumulativeSnapshots,
    activeSnapshots,
    classifications,
    setClassifications,
    evaluations,
    setEvaluations,
    recommendations,
    setRecommendations
  };
}