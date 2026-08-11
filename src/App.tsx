// @ts-nocheck
import React, { useState, useEffect } from "react";

// Custom Hooks & Config
import { useAllianceState } from "./hooks/useAllianceState";
import { useAnalytics } from "./hooks/useAnalytics";
import { apiFetch, API_BASE } from "./apiConfig";

// Layout & Navigation
import Sidebar from "./components/Sidebar";

// Tabs & Views
import LandingTab from "./pages/LandingTab";
import OverviewTab from "./pages/OverviewTab";
import PlayersTab from "./pages/PlayersTab";
import RosterTab from "./pages/RosterTab";
import MemberPortalTab from "./pages/MemberPortalTab";
import WarLogsTab from "./pages/WarLogsTab";
import SettingsTab from "./pages/SettingsTab";

import { AlertTriangle } from "lucide-react";

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
  // Navigation State
  const deepLink = getDeepLinkParams();
  const [activeTab, setActiveTab] = useState(deepLink.tab || "landing");
  const [selectedPlayerId, setSelectedPlayerId] = useState(deepLink.player);
  const [rosterSubView, setRosterSubView] = useState("active");
  const [showImportModal, setShowImportModal] = useState(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Sidebar UI State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(deepLink.tab === "member");

  // Editable Council Identity State
  const [profile, setProfile] = useState(() => {
    const cached = localStorage.getItem("dragon_council_officer_profile");
    if (cached) {
      try { return JSON.parse(cached); } catch (_) {}
    }
    return { rank: "R5", ingameName: "Officer Sam", memberId: "OS-7712" };
  });

  useEffect(() => {
    localStorage.setItem("dragon_council_officer_profile", JSON.stringify(profile));
  }, [profile]);

  // Theme State
  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem("dragon_council_theme");
    return (saved && ["slate", "obsidian", "sepia"].includes(saved)) ? saved : "slate"; 
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("dragon_council_theme", activeTheme);
  }, [activeTheme]);

  // --- DATA & ANALYTICS ENGINES ---
  const {
    players, setPlayers,
    snapshots, setSnapshots,
    importSessions, setImportSessions,
    overrides, setOverrides,
    notes, setNotes,
    settings, setSettings,
    backendStatusMessage, setBackendStatusMessage
  } = useAllianceState();

  const {
    cumulativeSnapshots,
    activeSnapshots,
    classifications,
    evaluations,
    recommendations,
    setRecommendations
  } = useAnalytics(players, snapshots, overrides, settings);

  // --- AUTHENTICATION HANDLERS ---
  const handleLogout = () => {
    setCurrentUser(null);
    setIsProfileOpen(false);
    apiFetch("/api/auth/logout", { method: "POST" }).catch(console.warn);
  };

  const handleLoginWithDiscord = async () => {
    try {
      const response = await apiFetch("/api/auth/discord/url");
      if (!response.ok) throw new Error("Failed to get Discord URL");
      const { url } = await response.json();
      window.open(url, "discord_oauth_popup", "width=500,height=680");
    } catch (err) {
      console.error("Error initiating Discord login:", err);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const expectedOrigin = API_BASE ? new URL(API_BASE).origin : window.location.origin;
      if (event.origin !== expectedOrigin && !event.origin.includes("localhost")) return;

      if (event.data?.type === "OAUTH_AUTH_SUCCESS" && event.data?.user) {
        setCurrentUser(event.data.user);
        setProfile((prev: any) => prev.ingameName === "Officer Sam" ? { ...prev, ingameName: event.data.user.username } : prev);
        
        handleAddNote("usr_officer_sam", `[Officer Sync] Command Officer "${event.data.user.username}" authenticated successfully via Discord.`);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    apiFetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => { if (data?.user) setCurrentUser(data.user); })
      .catch(console.warn);
  }, []);

  // --- ALLIANCE LOGIC HANDLERS ---
  const handleAddNote = (playerId: string, content: string) => {
    const authorName = `[${profile.rank}] ${profile.ingameName}`;
    const authorId = currentUser?.id ? `usr_officer_${currentUser.id}` : `usr_officer_${profile.memberId}`;
    setNotes([{
      id: `note_${Date.now()}`, playerId, authorId, authorName, content,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }, ...notes]);
  };

  const handleDeleteNote = (noteId: string) => setNotes(notes.filter((n: any) => n.id !== noteId));

  const handleApplyOverride = (playerId: string, role: any, reason: string) => {
    const cleanOverrides = overrides.filter((o: any) => o.playerId !== playerId);
    setOverrides([...cleanOverrides, {
      id: `override_${Date.now()}`, playerId, role, reason,
      createdBy: `[${profile.rank}] ${profile.ingameName}`, createdAt: new Date().toISOString()
    }]);
  };

  const handleRemoveOverride = (playerId: string) => setOverrides(overrides.filter((o: any) => o.playerId !== playerId));

  const handleResolveRecommendation = (recommendationId: string, decision: "ACCEPTED" | "REJECTED" | "OVERRIDDEN", reason: string) => {
    setRecommendations(recommendations.map((r: any) => r.id === recommendationId ? { ...r, status: decision } : r));
    const rec = recommendations.find((r: any) => r.id === recommendationId);
    if (rec) handleAddNote(rec.playerId, `[Recommendation Resolved] ${decision}: ${reason}`);
  };

  const handleImportSnapshots = (newPlayers: any[], newSnapshots: any[], sessions: any[]) => {
    const uniquePlayersMap = new Map(players.map((p: any) => [String(p.characterId).trim(), p]));
    newPlayers.forEach(np => {
      const cid = String(np.characterId).trim();
      if (!uniquePlayersMap.has(cid)) uniquePlayersMap.set(cid, np);
      else {
        const existing = uniquePlayersMap.get(cid)!;
        uniquePlayersMap.set(cid, { ...existing, currentName: np.currentName });
      }
    });
    
    const uniqueSnapshotsMap = new Map(snapshots.map((s: any) => [s.id, s]));
    newSnapshots.forEach(ns => uniqueSnapshotsMap.set(ns.id, ns));

    setPlayers(Array.from(uniquePlayersMap.values()));
    setSnapshots(Array.from(uniqueSnapshotsMap.values()));
    setImportSessions([...sessions, ...importSessions]);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSnapshots = snapshots.filter((s: any) => s.importId !== sessionId);
    const activePlayerIds = new Set(updatedSnapshots.map((s: any) => s.playerId));
    
    setImportSessions(importSessions.filter((s: any) => s.id !== sessionId));
    setSnapshots(updatedSnapshots);
    setPlayers(players.filter((p: any) => activePlayerIds.has(p.characterId)));
  };

  const handleApplyForRecruitment = (applicant: any) => {
    const newCharacterId = `p_rec_${Date.now()}`;
    setPlayers([{ characterId: newCharacterId, currentName: applicant.characterName, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...players]);
    
    setSnapshots([{
      id: `snap_${Date.now()}`, playerId: newCharacterId, playerName: applicant.characterName, allianceId: settings.allianceId, importId: "import_portal",
      currentPower: applicant.power, highestPower: applicant.power, merits: applicant.merits,
      t4Deaths: applicant.troopTier === "T5" ? 20000 : 10000, t5Deaths: applicant.troopTier === "T5" ? 15000 : 0,
      gathering: 50000000, healing: 200000, donations: 500, buildTime: 3600, destructionTime: 1800,
      resourceAssistance: 1000000, behemothWins: 3, allianceHelp: 150,
      recordedAt: new Date().toISOString(), createdAt: new Date().toISOString()
    }, ...snapshots]);
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gothic-void text-gothic-silver flex flex-col md:flex-row min-w-0">

      {/* Connection Warning Banner */}
      {backendStatusMessage && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500/95 text-[#1A1400] text-xs font-mono font-semibold px-4 py-2 flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2"><AlertTriangle size={14} /> {backendStatusMessage}</span>
          <button onClick={() => setBackendStatusMessage(null)} className="font-bold px-2">✕</button>
        </div>
      )}

      {/* Extracted Navigation Sidebar */}
      <Sidebar activeTab={activeTab} />
      </div>
  );
}