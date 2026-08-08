import React, { useState, useEffect, useRef } from "react";
import { 
  Player, 
  Snapshot, 
  AllianceSettings, 
  PlayerNote, 
  RoleOverride,
  PlayerClassification,
  PerformanceEvaluation,
  Recommendation,
  AccountRole,
  RecommendationType,
  ImportSession
} from "./types";
import { 
  buildCohort, 
  classifyPlayer, 
  evaluatePerformance, 
  generateRecommendation,
  reconstructSnapshots,
  getAggregatedPlayerSnapshot
} from "./utils/analytics";

// Import separate tab views
import OverviewTab from "./components/OverviewTab";
import PlayersTab from "./pages/PlayersTab";
import RosterTab from "./pages/RosterTab";
import ReviewTab from "./pages/ReviewTab";
import SettingsTab, { THEME_OPTIONS } from "./pages/SettingsTab";
import ImportTab from "./components/ImportTab";
import WarLogsTab from "./pages/WarLogsTab";
import LandingTab from "./pages/LandingTab";
import MemberPortalTab from "./pages/MemberPortalTab";
import MigrationReconcilerTab from "./pages/MigrationReconcilerTab";
import { apiFetch, API_BASE } from "./apiConfig";

// Navigation icons
import { 
  LayoutDashboard, 
  UserSquare2, 
  TableProperties, 
  ShieldAlert, 
  AlertTriangle,
  SlidersHorizontal, 
  History as HistoryIcon,
  TrendingUp,
  Compass,
  Users,
  FileText,
  Download,
  Sliders,
  Compass,
  Scroll,
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Palette,
  Shuffle,
  Flame
} from "lucide-react";

// No pre-loaded import history — officers populate this via the Import Manager.
const initialImportSessions: ImportSession[] = [];

// Baseline alliance configuration. These are real default values (not mock
// player data) that every alliance starts with and can freely tune from the
// Settings tab — they are what powers the classification/scoring engine
// before an officer customizes anything.
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
    thresholds: {
      below: 45,
      meets: 75
    },
    seasonalPowerBaselines: {
      S1: 5000000,
      S2: 10000000,
      S3: 15000000,
      SoS: 20000000
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

const VALID_TABS = ["landing", "overview", "players", "member", "roster", "warlogs", "settings"];

function getDeepLinkParams(): { tab: string | null; player: string | null } {
  try {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const playerParam = params.get("player");
    return {
      tab: tabParam && VALID_TABS.includes(tabParam) ? tabParam : null,
      player: playerParam || null
    };
  } catch (_) {
    return { tab: null, player: null };
  }
}

export default function App() {
  // Navigation State — supports deep-linking via ?tab=member&player=CHAR_ID
  // so officers can share a direct link for members to self-service (e.g.
  // linking farm accounts) without needing to explain in-app navigation.
  const deepLink = getDeepLinkParams();
  const [activeTab, setActiveTab] = useState<string>(deepLink.tab || "landing");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(deepLink.player);
  const [rosterSubView, setRosterSubView] = useState<"active" | "transitions">("active");
  const [showImportModal, setShowImportModal] = useState(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    email?: string;
    avatarUrl?: string;
  } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(deepLink.tab === "member");

  // Editable Council Identity State
  const [profile, setProfile] = useState<{
    rank: "R5" | "R4";
    ingameName: string;
    memberId: string;
  }>(() => {
    const cached = localStorage.getItem("dragon_council_officer_profile");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }
    return {
      rank: "R5",
      ingameName: "Officer Sam",
      memberId: "OS-7712"
    };
  });

  // Keep profile local storage in sync
  useEffect(() => {
    localStorage.setItem("dragon_council_officer_profile", JSON.stringify(profile));
  }, [profile]);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsProfileOpen(false);
    apiFetch("/api/auth/logout", { method: "POST" }).catch((err) =>
      console.warn("Failed to invalidate session on the server:", err)
    );
  };

  const handleLoginWithDiscord = async () => {
    try {
      const response = await apiFetch("/api/auth/discord/url");
      if (!response.ok) {
        throw new Error("Failed to get Discord authorization URL");
      }
      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        "discord_oauth_popup",
        "width=500,height=680"
      );
      
      if (!authWindow) {
        alert("Please allow popups to log in with Discord.");
      }
    } catch (err) {
      console.error("Error initiating Discord login:", err);
    }
  };

  // Listen for Discord login success messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // The OAuth popup is served by the API backend, so trust messages from
      // that backend's own origin (works for any host — Render, Cloud Run,
      // localhost, etc. — rather than hardcoding one platform's domain).
      const expectedOrigin = API_BASE ? new URL(API_BASE).origin : window.location.origin;
      if (origin !== expectedOrigin && !origin.includes("localhost") && !origin.includes("0.0.0.0")) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS" && event.data?.user) {
        setCurrentUser(event.data.user);
        
        // Update in-game name if it was default
        setProfile((prev) => {
          if (prev.ingameName === "Officer Sam") {
            return {
              ...prev,
              ingameName: event.data.user.username
            };
          }
          return prev;
        });

        // Log the authenticating event as a global note or record
        const username = event.data.user.username;
        const newNote: PlayerNote = {
          id: `note_${Date.now()}`,
          playerId: "usr_officer_sam",
          authorId: `usr_officer_${event.data.user.id}`,
          authorName: `Officer ${username}`,
          content: `[Officer Sync] Command Officer "${username}" authenticated successfully via Discord.`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setNotes((prevNotes) => [newNote, ...prevNotes]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Core Data State
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    const saved = localStorage.getItem("dragon_council_theme");
    if (saved && ["slate", "obsidian", "sepia"].includes(saved)) {
      return saved;
    }
    return "slate"; // Modern Slate (Default Light Theme)
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("dragon_council_theme", activeTheme);
  }, [activeTheme]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [importSessions, setImportSessions] = useState<ImportSession[]>([]);
  const [overrides, setOverrides] = useState<RoleOverride[]>([]);
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [settings, setSettings] = useState<AllianceSettings>(defaultAllianceSettings);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [backendStatusMessage, setBackendStatusMessage] = useState<string | null>(null);

  // Derived Analytics State
  const [classifications, setClassifications] = useState<PlayerClassification[]>([]);
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Get active snapshots list (most recent snapshots of current roster)
  const cumulativeSnapshots = React.useMemo(() => {
    return reconstructSnapshots(
      snapshots,
      settings?.configuration?.seasonStartDate,
      settings?.configuration?.seasonEndDate
    );
  }, [snapshots, settings]);

  const activeSnapshots = React.useMemo(() => {
    return players.map((p) => {
      const pSnaps = cumulativeSnapshots.filter((s) => s.playerId === p.characterId);
      return pSnaps.length > 0 ? getAggregatedPlayerSnapshot(pSnaps) : null;
    }).filter(Boolean) as Snapshot[];
  }, [players, cumulativeSnapshots]);

  // 1. Initial Load & Hydrate from the backend (SQLite via /api/state)
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

      // Deduplicate players by characterId to prevent React duplicate key warning
      const uniquePlayersMap = new Map<string, Player>();
      loadedPlayers.forEach((p) => {
        if (p && p.characterId) {
          const cid = String(p.characterId).trim();
          uniquePlayersMap.set(cid, {
            ...p,
            characterId: cid
          });
        }
      });
      const sanitizedPlayers = Array.from(uniquePlayersMap.values());

      // Deduplicate snapshots by id to prevent React duplicate key warning
      const uniqueSnapshotsMap = new Map<string, Snapshot>();
      loadedSnapshots.forEach((s) => {
        if (s && s.id) {
          uniqueSnapshotsMap.set(s.id, s);
        }
      });
      const sanitizedSnapshots = Array.from(uniqueSnapshotsMap.values());

      setPlayers(sanitizedPlayers);
      setSnapshots(sanitizedSnapshots);
      setOverrides(loadedOverrides);
      setNotes(loadedNotes);
      setSettings(loadedSettings);
      setImportSessions(loadedSessions);

      // Only default to the first player if nothing was already selected —
      // preserves a shared ?player= deep link instead of overwriting it.
      setSelectedPlayerId((prev) => prev || (sanitizedPlayers.length > 0 ? sanitizedPlayers[0].characterId : null));

      setIsLoadingState(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 1b. Hydrate the current Discord identity from the server-verified session
  // (rather than trusting a locally cached, unverifiable copy).
  useEffect(() => {
    apiFetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.warn("Failed to load Discord session:", err));
  }, []);

  // 2. Persist core alliance state to the backend whenever it changes,
  // debounced so rapid edits don't fire a request per keystroke.
  const stateSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoadingState) return; // don't overwrite the backend before the initial load completes

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

  // 3. Recalculate derived analytics whenever roster/telemetry/settings change
  useEffect(() => {
    if (players.length === 0 || snapshots.length === 0 || !settings) {
      // Nothing imported yet (or everything was cleared) — reset derived state
      // instead of leaving stale classifications/evaluations around.
      setClassifications([]);
      setEvaluations([]);
      setRecommendations([]);
      return;
    }

    // Recalculate using reconstructed cumulative snapshots
    const cumulativeSnaps = reconstructSnapshots(
      snapshots,
      settings.configuration.seasonStartDate,
      settings.configuration.seasonEndDate
    );

    // A. Extract aggregated snapshot across all sessions for each player to build the cohort context
    const latestSnaps: Snapshot[] = [];
    players.forEach((p) => {
      const pSnaps = cumulativeSnaps.filter((s) => s.playerId === p.characterId);
      if (pSnaps.length > 0) {
        latestSnaps.push(getAggregatedPlayerSnapshot(pSnaps));
      }
    });

    const cohort = buildCohort(latestSnaps);

    // B. Classify role for each player
    const newClassifications = players.map((p) => {
      const pSnaps = cumulativeSnaps.filter((s) => s.playerId === p.characterId);
      const manualOvr = overrides.find((o) => o.playerId === p.characterId)?.role;
      return classifyPlayer(p.characterId, pSnaps, cohort, settings, manualOvr);
    });

    // C. Evaluate role-specific performance score vectors
    const newEvaluations = players.map((p) => {
      const pSnaps = cumulativeSnaps.filter((s) => s.playerId === p.characterId);
      const classification = newClassifications.find((c) => c.playerId === p.characterId)!;
      return evaluatePerformance(p.characterId, pSnaps, cohort, classification, settings);
    });

    // D. Generate advisory strategic recommendations
    const newRecommendations = players.map((p) => {
      const pSnaps = cumulativeSnaps.filter((s) => s.playerId === p.characterId);
      const cl = newClassifications.find((c) => c.playerId === p.characterId)!;
      const ev = newEvaluations.find((e) => e.playerId === p.characterId)!;
      return generateRecommendation(p.characterId, cl, ev, pSnaps);
    });

    setClassifications(newClassifications);
    setEvaluations(newEvaluations);
    setRecommendations(newRecommendations);

  }, [players, snapshots, overrides, settings]);

  // Handler Callbacks
  const handleUpdateSettings = (newSettings: AllianceSettings) => {
    setSettings(newSettings);
  };

  const handleAddNote = (playerId: string, content: string) => {
    const authorName = `[${profile.rank}] ${profile.ingameName}`;
    const authorId = currentUser?.id ? `usr_officer_${currentUser.id}` : `usr_officer_${profile.memberId || "sam"}`;
    const newNote: PlayerNote = {
      id: `note_${Date.now()}`,
      playerId,
      authorId,
      authorName,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter((n) => n.id !== noteId));
  };

  const handleApplyOverride = (playerId: string, role: AccountRole, reason: string) => {
    // Check if override already exists, remove it
    const cleanOverrides = overrides.filter((o) => o.playerId !== playerId);
    
    const newOverride: RoleOverride = {
      id: `override_${Date.now()}`,
      playerId,
      role,
      reason,
      createdBy: `[${profile.rank}] ${profile.ingameName}`,
      createdAt: new Date().toISOString()
    };

    setOverrides([...cleanOverrides, newOverride]);
  };

  const handleRemoveOverride = (playerId: string) => {
    setOverrides(overrides.filter((o) => o.playerId !== playerId));
  };

  const handleResolveRecommendation = (
    recommendationId: string, 
    decision: "ACCEPTED" | "REJECTED" | "OVERRIDDEN", 
    reason: string
  ) => {
    // Find the recommendation to update its status or override
    const updatedRecommendations = recommendations.map((r) => {
      if (r.id === recommendationId) {
        return {
          ...r,
          status: decision === "ACCEPTED" ? ("ACCEPTED" as const) : ("REJECTED" as const)
        };
      }
      return r;
    });
    setRecommendations(updatedRecommendations);

    // If accepted or overridden remove trigger by applying note or setting status
    const rec = recommendations.find(r => r.id === recommendationId);
    if (rec) {
      handleAddNote(rec.playerId, `[Recommendation Resolved] ${decision}: ${reason}`);
    }
  };

  // Ingestion Inporter Callback with strict duplicate cleansing
  const handleImportSnapshots = (
    newPlayers: Player[],
    newSnapshots: Snapshot[],
    sessions: ImportSession[]
  ) => {
    // Clean duplicates and merge in player lists using a Map
    const uniquePlayersMap = new Map<string, Player>();
    players.forEach((p) => {
      if (p && p.characterId) {
        uniquePlayersMap.set(String(p.characterId).trim(), p);
      }
    });

    newPlayers.forEach((np) => {
      if (np && np.characterId) {
        const cid = String(np.characterId).trim();
        if (!uniquePlayersMap.has(cid)) {
          uniquePlayersMap.set(cid, np);
        } else {
          // Update name and update time if changed
          const existing = uniquePlayersMap.get(cid)!;
          existing.currentName = np.currentName;
          existing.updatedAt = new Date().toISOString();
          uniquePlayersMap.set(cid, existing);
        }
      }
    });
    const mergedPlayers = Array.from(uniquePlayersMap.values());

    // Merge snapshots with a unique ID check using a Map
    const uniqueSnapshotsMap = new Map<string, Snapshot>();
    snapshots.forEach((s) => {
      if (s && s.id) {
        uniqueSnapshotsMap.set(s.id, s);
      }
    });
    newSnapshots.forEach((ns) => {
      if (ns && ns.id) {
        uniqueSnapshotsMap.set(ns.id, ns);
      }
    });
    const mergedSnapshots = Array.from(uniqueSnapshotsMap.values());

    setPlayers(mergedPlayers);
    setSnapshots(mergedSnapshots);
    setImportSessions((prev) => [...sessions, ...prev]);

    // Log the import event as a global note or record
    sessions.forEach((session) => {
      const draftSnapsCount = newSnapshots.filter((s) => s.importId === session.id).length;
      handleAddNote("usr_officer_sam", `[Ingestion Complete] Batch imported ${draftSnapsCount} snapshot records from ${session.source} in file "${session.filename}".`);
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = importSessions.filter((s) => s.id !== sessionId);
    const updatedSnapshots = snapshots.filter((s) => s.importId !== sessionId);
    
    // Check if any players have zero snapshots remaining. If so, remove them
    // to keep the active database perfectly synchronized
    const activePlayerIds = new Set(updatedSnapshots.map((s) => s.playerId));
    const updatedPlayers = players.filter((p) => activePlayerIds.has(p.characterId));

    setImportSessions(updatedSessions);
    setSnapshots(updatedSnapshots);
    setPlayers(updatedPlayers);

    handleAddNote("usr_officer_sam", `[Telemetry Rollback] Rolled back and purged telemetry document with ID "${sessionId}". Associated snapshots and idle rosters were synchronized.`);
  };

  const handleRenameSession = (sessionId: string, newFilename: string) => {
    const updatedSessions = importSessions.map((s) => {
      if (s.id === sessionId) {
        return { ...s, filename: newFilename };
      }
      return s;
    });
    setImportSessions(updatedSessions);
    handleAddNote("usr_officer_sam", `[Document Renamed] Renamed telemetry document reference to "${newFilename}".`);
  };

  const handleApplyForRecruitment = (applicant: {
    characterName: string;
    power: number;
    merits: number;
    troopTier: string;
    preferredRole: string;
  }) => {
    const newCharacterId = `p_rec_${Date.now()}`;
    const newPlayer: Player = {
      characterId: newCharacterId,
      currentName: applicant.characterName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newSnap: Snapshot = {
      id: `snap_${Date.now()}`,
      playerId: newCharacterId,
      playerName: applicant.characterName,
      allianceId: settings.allianceId,
      importId: "import_portal",
      currentPower: applicant.power,
      highestPower: applicant.power,
      merits: applicant.merits,
      t4Deaths: applicant.troopTier === "T5" ? 20000 : 10000,
      t5Deaths: applicant.troopTier === "T5" ? 15000 : 0,
      gathering: 50000000,
      healing: 200000,
      donations: 500,
      buildTime: 3600,
      destructionTime: 1800,
      resourceAssistance: 1000000,
      behemothWins: 3,
      allianceHelp: 150,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setPlayers((prev) => [newPlayer, ...prev]);
    setSnapshots((prev) => [newSnap, ...prev]);

    handleAddNote(
      newCharacterId,
      `[Recruitment Portal] Candidate "${applicant.characterName}" submitted an application. Power: ${(applicant.power / 1000000).toFixed(1)}M, Merits: ${(applicant.merits / 1000000).toFixed(1)}M, Preferred Role: ${applicant.preferredRole}.`
    );
  };

  const actionItemsCount = React.useMemo(() => {
    let count = 0;
    activeSnapshots.forEach((snap) => {
      const pid = snap.playerId;
      const cl = classifications.find(c => c.playerId === pid);
      const ev = evaluations.find(e => e.playerId === pid);
      const rec = recommendations.find(r => r.playerId === pid);

      const isInactive = cl?.role === "INACTIVE" || ev?.eligibilityStatus === "LIKELY_INACTIVE";
      const isNeedsReview = cl?.role === "NEEDS_REVIEW" || rec?.recommendation === "MANUAL_REVIEW";
      const isRemovalRec = rec?.recommendation === "REMOVE";
      const isBelowTier = ev?.performanceTier === "BELOW";
      const isSupportOrMonitorRec = rec?.recommendation === "SUPPORT" || rec?.recommendation === "MONITOR";

      if (isRemovalRec || isInactive || isNeedsReview || isBelowTier || isSupportOrMonitorRec) {
        count++;
      }
    });
    return count;
  }, [activeSnapshots, classifications, evaluations, recommendations]);

  const activeSeasonName = settings?.configuration?.activeSeason || "S3";
  const powerBaselineVal = settings?.configuration?.seasonalPowerBaselines[activeSeasonName] || 10000000;

  return (
    <div className="min-h-screen bg-gothic-void text-gothic-silver flex flex-col md:flex-row min-w-0">

      {/* Backend Connectivity Status Banner */}
      {backendStatusMessage && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500/95 text-[#1A1400] text-xs font-mono font-semibold px-4 py-2 flex items-center justify-between gap-3 shadow-lg">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} />
            {backendStatusMessage}
          </span>
          <button
            onClick={() => setBackendStatusMessage(null)}
            className="text-[#1A1400]/70 hover:text-[#1A1400] font-bold cursor-pointer px-2"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#222831] border-b border-[#4B5563]/30 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <Compass size={20} className="text-[#06B6D4]" />
          <div className="font-display tracking-[0.15em] text-xs uppercase text-[#F2F0E8]">
            <span className="block font-bold">Dragon</span>
            <span className="block text-[10px] text-[#C8CCD2]/60 -mt-1">Council</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded bg-[#16181D] border border-[#4B5563]/40 text-[#F2F0E8] hover:text-white cursor-pointer"
        >
          {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop overlay for mobile menu */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen bg-[#222831] border-r border-[#4B5563]/30 flex flex-col justify-between transition-all duration-300 ${
          isMobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${isSidebarCollapsed ? "md:w-20" : "md:w-64"} flex-shrink-0`}
      >
        {/* Top Header of Sidebar */}
        <div className="p-4 border-b border-[#4B5563]/30 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? "md:justify-center md:w-full" : ""}`}>
            <div className="w-9 h-9 rounded-lg bg-[#2F3743] border border-[#06B6D4]/40 flex items-center justify-center flex-shrink-0 text-[#06B6D4] shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Compass size={20} />
            </div>
            {!isSidebarCollapsed && (
              <div className="font-display tracking-[0.15em] text-xs uppercase text-[#F2F0E8] leading-tight">
                <span className="block font-bold text-sm">Dragon</span>
                <span className="block text-[10px] text-[#C8CCD2]/60">Council Workspace</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg bg-[#16181D] border border-[#4B5563]/40 text-[#C8CCD2] hover:text-white hover:border-[#D4B26A]/50 transition-all cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {!isSidebarCollapsed && (
            <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#E5C8C7]/40">
              Command Ledger
            </div>
          )}

          {[
            { id: "landing", label: "Council Hall", icon: <Home size={18} /> },
            { id: "overview", label: "Leadership Hub", icon: <LayoutDashboard size={18} /> },
            { id: "member", label: "Account Registry", icon: <UserSquare2 size={18} /> },
            { id: "roster", label: "Alliance Registry", icon: <TableProperties size={18} /> },
            { id: "warlogs", label: "Alliance Chronicle", icon: <Scroll size={18} /> },
            { id: "settings", label: "Settings", icon: <Sliders size={18} /> }
          ].map((navItem) => {
            const isActive = activeTab === navItem.id;
            return (
              <button
                key={navItem.id}
                id={`tab-btn-${navItem.id}`}
                onClick={() => {
                  setActiveTab(navItem.id);
                  setIsMobileSidebarOpen(false);
                }}
                title={isSidebarCollapsed ? navItem.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] ${
                  isSidebarCollapsed ? "justify-center px-0" : ""
                } ${
                  isActive
                    ? "text-[#F2F0E8] bg-[#2F3743] border-[#D4B26A] shadow-[0_0_12px_rgba(212,178,106,0.25)] font-bold"
                    : "border-transparent text-[#C8CCD2]/70 hover:text-white hover:bg-[#2F3743]/50 hover:border-[#4B5563]/40"
                }`}
              >
                <div className={`${isActive ? "text-[#D4B26A]" : "text-[#8B96A5]"}`}>
                  {navItem.icon}
                </div>
                {!isSidebarCollapsed && (
                  <span className="truncate">{navItem.label}</span>
                )}
              </button>
            );
          })}

          {/* Dedicated Custom Loading Bar Trigger */}
          <div className="pt-2 border-t border-[#4B5563]/20">
            <button
              onClick={() => setIsLoaderShowcaseOpen(true)}
              title={isSidebarCollapsed ? "Custom Loading Bar Engine" : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#D4B26A]/30 bg-[#D4B26A]/10 hover:bg-[#D4B26A]/20 text-[#D4B26A] transition-all cursor-pointer text-xs font-mono font-bold uppercase tracking-wider ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              }`}
            >
              <Flame size={16} className="text-[#D4B26A] animate-pulse" />
              {!isSidebarCollapsed && (
                <span className="truncate">Loading Engine</span>
              )}
            </button>
          </div>

        </div>

        {/* Sidebar Footer: Officer Profile Toggle */}
        <div className="p-3 border-t border-[#4B5563]/30 bg-[#16181D]/80 relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg bg-[#16181D] border border-[#4B5563]/40 hover:border-[#D4B26A]/60 hover:bg-[#2F3743]/50 transition-all cursor-pointer text-left select-none group ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
          >
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={profile.ingameName} 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-[#D4B26A]/60 shadow-[0_0_8px_rgba(212,178,106,0.3)] object-cover group-hover:border-[#D4B26A] transition-colors flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2F3743] border border-[#D4B26A]/60 flex items-center justify-center text-xs font-display font-bold text-[#D4B26A] shadow-[0_0_8px_rgba(212,178,106,0.2)] group-hover:border-white transition-colors flex-shrink-0">
                {profile.ingameName.substring(0, 2).toUpperCase()}
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="overflow-hidden leading-tight flex-1">
                <span className="block text-[9px] uppercase tracking-widest text-[#8B96A5] font-display group-hover:text-[#D4B26A] transition-colors">
                  {profile.rank} OFFICER
                </span>
                <span className="text-xs font-bold text-[#F2F0E8] truncate block group-hover:text-white transition-colors">
                  {profile.ingameName}
                </span>
              </div>
            )}
          </button>

          {/* Profile Modal Popover */}
          {isProfileOpen && (
            <div className="absolute left-full bottom-3 ml-3 z-[100] w-80 bg-[#222831] border border-[#4B5563]/50 rounded-lg p-5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4B26A] via-[#7FA8C9] to-[#B85A5A]" />
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-display text-[#D4B26A] font-bold">Officer Credentials</h4>
                  <p className="text-[10px] text-[#C8CCD2]/60 font-mono">Dragon Council Authorization</p>
                </div>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="text-xs text-[#C8CCD2]/60 hover:text-white font-display cursor-pointer bg-transparent border-0"
                >
                  ✕
                </button>
              </div>

              {/* EDIT PROFILE SECTION */}
              <div className="space-y-3 bg-[#16181D]/80 border border-[#4B5563]/30 p-3.5 rounded mb-4">
                <h5 className="text-[10px] uppercase tracking-wider font-display font-bold text-[#D4B26A]">Council Identity</h5>
                
                {/* In-game name input */}
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-[#C8CCD2]/60 font-mono">In-Game Name</label>
                  <input
                    type="text"
                    value={profile.ingameName}
                    onChange={(e) => setProfile(prev => ({ ...prev, ingameName: e.target.value }))}
                    className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4B26A] font-medium"
                    placeholder="In-Game Name"
                  />
                </div>

                {/* Rank selections (R5, R4) */}
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-[#C8CCD2]/60 font-mono">Council Rank</label>
                  <div className="flex gap-2">
                    {(["R5", "R4"] as const).map((rankOption) => {
                      const isSelected = profile.rank === rankOption;
                      return (
                        <button
                          key={rankOption}
                          type="button"
                          onClick={() => setProfile(prev => ({ ...prev, rank: rankOption }))}
                          className={`flex-1 py-1 text-xs font-bold font-display rounded border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#D4B26A]/20 border-[#D4B26A] text-[#D4B26A] shadow-[0_0_8px_rgba(212,178,106,0.3)]"
                              : "bg-[#16181D] border-[#4B5563]/30 text-[#C8CCD2]/60 hover:border-[#4B5563]/60 hover:text-white"
                          }`}
                        >
                          {rankOption}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Member ID input */}
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-[#C8CCD2]/60 font-mono">Member ID</label>
                  <input
                    type="text"
                    value={profile.memberId}
                    onChange={(e) => setProfile(prev => ({ ...prev, memberId: e.target.value }))}
                    className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4B26A] font-mono"
                    placeholder="Member ID"
                  />
                </div>
              </div>

              {/* EXTERNAL DISCORD CONNECTION */}
              <div className="mb-4">
                <span className="block text-[9px] uppercase tracking-wider text-[#C8CCD2]/60 font-mono mb-1.5">External Sync Status</span>
                {currentUser ? (
                  <div className="flex items-center gap-2.5 bg-[#5865F2]/10 border border-[#5865F2]/30 p-2.5 rounded">
                    {currentUser.avatarUrl ? (
                      <img 
                        src={currentUser.avatarUrl} 
                        alt={currentUser.username} 
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-[#5865F2]/50 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/50 flex items-center justify-center text-[10px] font-display font-bold text-[#FFFFFF]">
                        {currentUser.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden leading-tight">
                      <span className="block text-xs font-bold text-white font-display truncate">{currentUser.username}</span>
                      <span className="block text-[9px] text-[#C8CCD2]/60 font-mono truncate">Discord Active</span>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleLoginWithDiscord}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-[10px] font-bold font-display uppercase tracking-wider rounded border border-[#5865F2]/40 transition-all shadow-[0_0_12px_rgba(88,101,242,0.15)] cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 127.14 96.36">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53a105.73,105.73,0,0,0,32,16.14,79.5,79.5,0,0,0,6.71-11,68.42,68.42,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.65-2.1a75.22,75.22,0,0,0,73.5,0c.84.73,1.74,1.43,2.65,2.1a68.51,68.51,0,0,1-10.64,5.12,79.5,79.5,0,0,0,6.71,11,105.73,105.73,0,0,0,32-16.14C129.66,48.24,123.39,25.43,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                    </svg>
                    <span>Connect Discord</span>
                  </button>
                )}
              </div>

              {/* COGNITIVE DETAILS */}
              <div className="space-y-2.5 text-xs mb-4">
                <div className="flex justify-between border-b border-[#4B5563]/20 pb-1.5">
                  <span className="text-[#C8CCD2]/60">Command Rank:</span>
                  <span className="font-bold text-[#F2F0E8]">{profile.rank} Member</span>
                </div>
                <div className="flex justify-between border-b border-[#4B5563]/20 pb-1.5">
                  <span className="text-[#C8CCD2]/60">Session Log Entries:</span>
                  <span className="font-bold text-[#D4B26A] font-mono">
                    {notes.filter(n => n.authorId.includes(currentUser?.id || "---") || n.authorName.includes(profile.ingameName)).length} Active
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#4B5563]/20 pb-1.5">
                  <span className="text-[#C8CCD2]/60">Authority Domain:</span>
                  <span className="font-bold text-[#B85A5A]">Tactical Strategy</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[#C8CCD2]/60">Member ID:</span>
                  <span className="font-mono text-[#F2F0E8]">{profile.memberId}</span>
                </div>
              </div>

              <div className="border-t border-[#4B5563]/30 pt-4 flex gap-2">
                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-1.5 bg-[#B85A5A]/10 hover:bg-[#B85A5A]/30 border border-[#B85A5A]/40 rounded text-[10px] uppercase tracking-wider font-bold text-red-300 hover:text-white transition-all cursor-pointer text-center"
                  >
                    Disconnect
                  </button>
                )}
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex-1 py-1.5 bg-[#2F3743] hover:bg-[#2F3743]/80 border border-[#4B5563]/50 rounded text-[10px] uppercase tracking-wider font-bold text-[#F2F0E8] hover:text-white transition-all cursor-pointer text-center"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === "landing" && (
          <LandingTab
            players={players}
            snapshots={activeSnapshots}
            settings={settings}
            evaluations={evaluations}
            onNavigateToTab={setActiveTab}
            onSelectPlayer={(id) => {
              setSelectedPlayerId(id);
              setActiveTab("players");
            }}
            onApplyForRecruitment={handleApplyForRecruitment}
          />
        )}

        {activeTab === "overview" && (
          <div className="space-y-8">
            <OverviewTab
              playersCount={players.length}
              latestSnapshots={activeSnapshots}
              snapshots={cumulativeSnapshots}
              classifications={classifications}
              evaluations={evaluations}
              settings={settings}
              onNavigateToTab={setActiveTab}
              onSelectPlayer={(id) => {
                setSelectedPlayerId(id);
                setActiveTab("players");
              }}
              notes={notes}
              overrides={overrides}
              recommendations={recommendations}
              onAddNote={handleAddNote}
              onApplyOverride={handleApplyOverride}
              onResolveRecommendation={handleResolveRecommendation}
            />

            <div className="pt-2 border-t border-gothic-silver/10">
              <h2 className="text-lg font-display font-bold text-gothic-silver mb-4 mt-6">Advisory Queue</h2>
              <ReviewTab
                players={players}
                snapshots={cumulativeSnapshots}
                classifications={classifications}
                evaluations={evaluations}
                recommendations={recommendations}
                overrides={overrides}
                onApplyOverride={handleApplyOverride}
                onRemoveOverride={handleRemoveOverride}
                onResolveRecommendation={handleResolveRecommendation}
                onSelectPlayer={setSelectedPlayerId}
                onNavigateToTab={setActiveTab}
                settings={settings}
              />
            </div>
          </div>
        )}

        {activeTab === "players" && (
          <PlayersTab
            players={players}
            snapshots={cumulativeSnapshots}
            classifications={classifications}
            evaluations={evaluations}
            recommendations={recommendations}
            notes={notes}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            settings={settings}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "member" && (
          <MemberPortalTab
            players={players}
            snapshots={activeSnapshots}
            settings={settings}
            evaluations={evaluations}
            classifications={classifications}
            notes={notes}
            onAddNote={handleAddNote}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "roster" && (
          <div className="space-y-4">
            {/* Active Members / Arrivals & Departures toggle + Import trigger */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-lg bg-gothic-ink border border-gothic-silver/20 gap-1">
                <button
                  onClick={() => setRosterSubView("active")}
                  className={`px-4 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                    rosterSubView === "active"
                      ? "bg-gothic-silver text-[#111113]"
                      : "text-gothic-rose/60 hover:text-gothic-silver"
                  }`}
                >
                  Active Members
                </button>
                <button
                  onClick={() => setRosterSubView("transitions")}
                  className={`px-4 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                    rosterSubView === "transitions"
                      ? "bg-gothic-silver text-[#111113]"
                      : "text-gothic-rose/60 hover:text-gothic-silver"
                  }`}
                >
                  Arrivals & Departures
                </button>
              </div>

              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gothic-silver hover:bg-white text-[#111113] font-mono font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
              >
                <Download size={13} /> Import Snapshot
              </button>
            </div>

            {rosterSubView === "active" ? (
              <RosterTab
                players={players}
                snapshots={cumulativeSnapshots}
                classifications={classifications}
                evaluations={evaluations}
                recommendations={recommendations}
                importSessions={importSessions}
                onSelectPlayer={setSelectedPlayerId}
                onNavigateToTab={setActiveTab}
                settings={settings}
              />
            ) : (
              <MigrationReconcilerTab
                snapshots={cumulativeSnapshots}
                importSessions={importSessions}
                players={players}
                settings={settings}
              />
            )}
          </div>
        )}

        {activeTab === "warlogs" && (
          <WarLogsTab
            players={players}
            onSelectPlayer={(id) => {
              setSelectedPlayerId(id);
              setActiveTab("players");
            }}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            activeTheme={activeTheme}
            onUpdateTheme={setActiveTheme}
          />
        )}

      </main>

      {/* Persistent platform footer */}
      <footer className="bg-gothic-void border-t border-gothic-silver/20 py-8 text-center text-[11px] font-display uppercase tracking-[0.15em] text-gothic-rose/40 space-y-2">
        <p className="font-semibold text-gothic-silver/60">Dragon Council Intelligence Workspace • Call of Dragons Alliance Management Suite</p>
        <p className="font-ledger normal-case tracking-normal text-xs text-gothic-rose/30 italic">Aesthetic design system matching Antique Silver highlights and responsive gothic telemetry ledger dashboards.</p>
      </footer>
      </div>

      {/* Import Snapshot Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gothic-velvet border border-gothic-silver/30 rounded-xl shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gothic-velvet border-b border-gothic-silver/20">
              <h2 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">Import Snapshot</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg hover:bg-gothic-ink text-gothic-rose/60 hover:text-gothic-silver transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <ImportTab
                importSessions={importSessions}
                onImportSnapshots={handleImportSnapshots}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                snapshots={cumulativeSnapshots}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
