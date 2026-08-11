import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../apiConfig";
import { 
  Player, 
  Snapshot, 
  AllianceSettings, 
  PlayerNote, 
  RoleOverride,
  ImportSession
} from "../types";

const initialImportSessions: ImportSession[] = [];

const defaultAllianceSettings: AllianceSettings = {
  allianceId: "Dragon Council",
  activeProfile: "STANDARD",
  configuration: {
    weights: {
      FIGHTER: { combat: 0.6, contribution: 0.2, activity: 0.2 },
      SUPPORT: { combat: 0.2, contribution: 0.6, activity: 0.2 },
      FARM: { combat: 0.1, contribution: 0.7, activity: 0.2 },
      INACTIVE: { combat: 0, contribution: 0, activity: 1 },
      NEEDS_REVIEW: { combat: 0.34, contribution: 0.33, activity: 0.33 }
    },
    thresholds: { below: 45, meets: 75 },
    seasonalPowerBaselines: {
      S1: 5000000, S2: 10000000, S3: 15000000, SoS: 20000000
    },
    activeSeason: "S3",
    seasonStartDate: "2026-06-19",
    finalZoneOpenDate: "2026-07-17",
    seasonSummaryDate: "2026-07-29",
    seasonEndDate: "2026-07-31",
    complianceTargets: {
      meritRatioPct: 10,
      deathsMin: 50000,
      activityRequired: true
    }
  },
  updatedAt: new Date().toISOString()
};

export function useAllianceState() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [importSessions, setImportSessions] = useState<ImportSession[]>([]);
  const [overrides, setOverrides] = useState<RoleOverride[]>([]);
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [settings, setSettings] = useState<AllianceSettings>(defaultAllianceSettings);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [backendStatusMessage, setBackendStatusMessage] = useState<string | null>(null);

  // 1. Initial Load & Hydrate from the backend
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let loadedPlayers: Player[] = [];
      let loadedSnapshots: Snapshot[] = [];
      let loadedOverrides: RoleOverride[] = [];
      let loadedNotes: PlayerNote[] = [];
      let loadedSettings = defaultAllianceSettings;
      let loadedSessions = initialImportSessions;

      try {
        const response = await apiFetch("/api/state");
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const { state } = await response.json();

        if (state && typeof state === "object") {
          if (Array.isArray(state.players)) loadedPlayers = state.players;
          if (Array.isArray(state.snapshots)) loadedSnapshots = state.snapshots;
          if (Array.isArray(state.overrides)) loadedOverrides = state.overrides;
          if (Array.isArray(state.notes)) loadedNotes = state.notes;
          if (Array.isArray(state.importSessions)) loadedSessions = state.importSessions;
          if (state.settings && typeof state.settings === "object") {
            loadedSettings = {
              ...defaultAllianceSettings,
              ...state.settings,
              configuration: {
                ...defaultAllianceSettings.configuration,
                ...(state.settings.configuration || {}),
                weights: {
                  ...defaultAllianceSettings.configuration.weights,
                  ...(state.settings.configuration?.weights || {})
                },
                thresholds: {
                  ...defaultAllianceSettings.configuration.thresholds,
                  ...(state.settings.configuration?.thresholds || {})
                },
                seasonalPowerBaselines: {
                  ...defaultAllianceSettings.configuration.seasonalPowerBaselines,
                  ...(state.settings.configuration?.seasonalPowerBaselines || {})
                },
                customScoringWeights: {
                  ...defaultAllianceSettings.configuration.customScoringWeights,
                  ...(state.settings.configuration?.customScoringWeights || {})
                },
                complianceTargets: {
                  ...defaultAllianceSettings.configuration.complianceTargets,
                  ...(state.settings.configuration?.complianceTargets || {})
                }
              }
            };
          }
        }
      } catch (err) {
        console.error("Failed to load alliance state from the backend:", err);
        if (!cancelled) {
          setBackendStatusMessage("Couldn't reach the backend server — working in a temporary in-memory session. Make sure the server is running; changes won't be saved until it's reachable.");
        }
      }

      if (cancelled) return;

      const uniquePlayersMap = new Map<string, Player>();
      loadedPlayers.forEach((p) => {
        if (p && p.characterId) {
          const cid = String(p.characterId).trim();
          uniquePlayersMap.set(cid, { ...p, characterId: cid });
        }
      });
      const sanitizedPlayers = Array.from(uniquePlayersMap.values());

      const uniqueSnapshotsMap = new Map<string, Snapshot>();
      loadedSnapshots.forEach((s) => {
        if (s && s.id) uniqueSnapshotsMap.set(s.id, s);
      });
      const sanitizedSnapshots = Array.from(uniqueSnapshotsMap.values());

      setPlayers(sanitizedPlayers);
      setSnapshots(sanitizedSnapshots);
      setOverrides(loadedOverrides);
      setNotes(loadedNotes);
      setSettings(loadedSettings);
      setImportSessions(loadedSessions);
      setIsLoadingState(false);
    })();

    return () => { cancelled = true; };
  }, []);

  // 2. Persist core alliance state to the backend whenever it changes
  const stateSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoadingState) return;

    if (stateSaveTimeoutRef.current) {
      clearTimeout(stateSaveTimeoutRef.current);
    }
    stateSaveTimeoutRef.current = setTimeout(() => {
      apiFetch("/api/state", {
        method: "PUT",
        body: JSON.stringify({ players, snapshots, overrides, notes, settings, importSessions })
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Server responded with ${res.status}`);
          setBackendStatusMessage(null);
        })
        .catch((err) => {
          console.error("Failed to save alliance state to the backend:", err);
          setBackendStatusMessage("Couldn't save your latest changes to the backend — check that the server is running.");
        });
    }, 600);

    return () => {
      if (stateSaveTimeoutRef.current) clearTimeout(stateSaveTimeoutRef.current);
    };
  }, [players, snapshots, overrides, notes, settings, importSessions, isLoadingState]);

  return {
    players, setPlayers,
    snapshots, setSnapshots,
    importSessions, setImportSessions,
    overrides, setOverrides,
    notes, setNotes,
    settings, setSettings,
    isLoadingState,
    backendStatusMessage, setBackendStatusMessage
  };
}