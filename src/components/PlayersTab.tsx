import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Shield,
  User,
  Activity,
  Award,
  AlertTriangle,
  FileText,
  Save,
  Trash2,
  Calendar,
  Sparkles,
  Flame,
  X,
  TrendingUp,
  UserCheck,
  Filter
} from "lucide-react";
import {
  Player,
  Snapshot,
  PlayerClassification,
  PerformanceEvaluation,
  Recommendation,
  PlayerNote,
  PerformanceTier,
  RecommendationType,
  AllianceSettings
} from "../types";
import { getAggregatedPlayerSnapshot, getLastActivityInfo, formatWholeNumber } from "../utils/analytics";

interface PlayersTabProps {
  players: Player[];
  snapshots: Snapshot[];
  classifications: PlayerClassification[];
  evaluations: PerformanceEvaluation[];
  recommendations: Recommendation[];
  notes: PlayerNote[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  onAddNote: (playerId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  settings?: AllianceSettings;
  onNavigateToTab?: (tab: string) => void;
}

export default function PlayersTab({
  players,
  snapshots,
  evaluations,
  recommendations,
  notes,
  selectedPlayerId,
  onSelectPlayer,
  onAddNote,
  onDeleteNote,
  settings,
  onNavigateToTab
}: PlayersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [hideUnderBaseline, setHideUnderBaseline] = useState<boolean>(true);
  const [activeTimelineMetric, setActiveTimelineMetric] = useState<"power" | "merits">("power");

  // Calculate seasonal power baseline
  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 10000000;

  // Local state for forms
  const [noteContent, setNoteContent] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filter & sort players list (sorted alphabetically by default)
  const filteredPlayers = React.useMemo(() => {
    return players.filter((player) => {
      const playerSnaps = snapshots.filter((s) => s.playerId === player.characterId);
      const latestSnap = playerSnaps.length > 0 ? getAggregatedPlayerSnapshot(playerSnaps) : null;
      const evaluation = evaluations.find((e) => e.playerId === player.characterId);

      const nameMatches = player.currentName.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatches = player.characterId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const tierMatches = tierFilter === "ALL" || (evaluation && evaluation.performanceTier === tierFilter);
      const powerMatches = !hideUnderBaseline || (latestSnap && latestSnap.currentPower >= powerBaseline);

      return (nameMatches || idMatches) && tierMatches && powerMatches;
    }).sort((a, b) => a.currentName.localeCompare(b.currentName));
  }, [players, snapshots, evaluations, searchQuery, tierFilter, hideUnderBaseline, powerBaseline]);

  // Selected Player details
  const activePlayer = players.find((p) => p.characterId === selectedPlayerId) || filteredPlayers[0] || null;
  
  React.useEffect(() => {
    if (activePlayer && selectedPlayerId !== activePlayer.characterId) {
      onSelectPlayer(activePlayer.characterId);
    }
  }, [activePlayer, selectedPlayerId, onSelectPlayer]);

  if (!activePlayer) {
    return (
      <div className="p-8 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
        <Search size={48} className="mx-auto mb-3 opacity-40 text-gothic-silver" />
        <h3 className="text-lg font-bold text-gothic-silver font-display">No Players Located</h3>
        {players.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs mt-1 font-mono">No alliance roster has been imported yet.</p>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab("imports")}
                className="px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
              >
                Go to Import Manager
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs mt-1 font-mono">Adjust search parameters or filters to expand discovery query.</p>
        )}
      </div>
    );
  }

  // Gather specific records for selected player
  const playerSnapshots = snapshots.filter((s) => s.playerId === activePlayer.characterId)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const latestSnapshot = playerSnapshots[playerSnapshots.length - 1];
  
  const playerEvaluation = evaluations.find((e) => e.playerId === activePlayer.characterId);
  const playerLastActivity = getLastActivityInfo(playerSnapshots);
  const playerRecommendation = recommendations.find((r) => r.playerId === activePlayer.characterId);
  const playerNotes = notes.filter((n) => n.playerId === activePlayer.characterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Formatting helpers
  const formatNum = (num?: number) => {
    if (num === undefined) return "0";
    return num.toLocaleString();
  };

  const getTierColor = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS": return "text-gothic-silver bg-gothic-silver/10 border-gothic-silver/20";
      case "MEETS": return "text-[#89A6B8] bg-[#89A6B8]/10 border-[#89A6B8]/20";
      case "BELOW": return "text-amber-300 bg-amber-500/10 border-amber-500/20";
      case "INACTIVE": return "text-red-300 bg-red-500/10 border-red-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getTierLabel = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS": return "Exceeds Expectations";
      case "MEETS": return "Meets Expectations";
      case "BELOW": return "Below Expectations";
      case "INACTIVE": return "Inactive";
      default: return "Meets Expectations";
    }
  };

  // Timeline Custom SVG Calculations
  const drawTimelinePath = () => {
    if (playerSnapshots.length < 2) return "";
    
    let values: number[] = [];
    if (activeTimelineMetric === "power") {
      values = playerSnapshots.map((s) => s.currentPower);
    } else {
      values = playerSnapshots.map((s) => s.merits);
    }

    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const valRange = maxVal - minVal || 1;

    const width = 500;
    const height = 120;
    const points = playerSnapshots.map((s, i) => {
      const x = (i / (playerSnapshots.length - 1)) * (width - 40) + 20;
      const y = height - ((values[i] - minVal) / valRange) * (height - 30) - 15;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    onAddNote(activePlayer.characterId, noteContent.trim());
    setNoteContent("");
    setFeedbackMsg(`✓ Officer note appended for ${activePlayer.currentName}. Record saved to ledger.`);
    setTimeout(() => setFeedbackMsg(null), 8000);
  };

  return (
    <div className="space-y-6 font-sans text-gothic-silver pb-12">
      {feedbackMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400/60 hover:text-emerald-200 cursor-pointer">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Character Selector */}
        <div className="lg:col-span-1 p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 h-fit max-h-[85vh] flex flex-col shadow-xl">
          <div className="border-b border-gothic-silver/20 pb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wider text-gothic-silver uppercase font-mono">
              Lord Directory ({filteredPlayers.length})
            </h2>
            <span className="text-[10px] text-gothic-rose/50 font-mono">Alphabetical</span>
          </div>
          
          {/* Search input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gothic-rose/50" />
            <input
              id="player-search-input"
              type="text"
              placeholder="Search Lord name / ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-silver pl-9 pr-3 py-2 rounded-lg outline-none focus:border-[#89A6B8] font-mono transition-all"
            />
          </div>

          {/* Quick filters */}
          <div className="grid grid-cols-1 gap-2">
            <select
              id="sidebar-tier-filter"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-gothic-ink border border-gothic-silver/20 text-[10px] text-gothic-rose/90 p-2 rounded-lg outline-none focus:border-[#89A6B8] font-mono"
            >
              <option value="ALL">All Categories</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BELOW">Below Expectations</option>
              <option value="MEETS">Meets Expectations</option>
              <option value="EXCEEDS">Exceeds Expectations</option>
            </select>
          </div>

          {/* Baseline Power Filter Button */}
          <button
            id="sidebar-baseline-filter-btn"
            onClick={() => setHideUnderBaseline(!hideUnderBaseline)}
            className={`w-full py-1.5 px-2 rounded-md text-[10px] font-mono font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
              hideUnderBaseline
                ? "bg-amber-950/20 text-amber-300 border-amber-500/40 hover:bg-amber-950/40"
                : "bg-gothic-ink text-gothic-rose/50 border-gothic-silver/20 hover:text-gothic-silver"
            }`}
          >
            <Filter size={10} />
            {hideUnderBaseline ? `Baseline Filter (≥ ${(powerBaseline / 1000000).toFixed(1)}M)` : `Show All Powers`}
          </button>

          {/* Players Clickable List */}
          <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-2">
            {filteredPlayers.map((player) => {
              const playerTier = evaluations.find((e) => e.playerId === player.characterId)?.performanceTier;
              const pSnaps = snapshots.filter((s) => s.playerId === player.characterId);
              const playerPowerVal = pSnaps.slice(-1)[0]?.currentPower || 0;
              const isSelected = player.characterId === activePlayer.characterId;

              return (
                <div
                  key={player.characterId}
                  onClick={() => onSelectPlayer(player.characterId)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-gothic-ink border-gothic-silver shadow-md"
                      : "bg-gothic-velvet border-gothic-silver/20 hover:bg-gothic-ink/50 hover:border-[#89A6B8]/40"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-gothic-silver truncate font-mono">{player.currentName}</span>
                    <span className="text-[10px] font-mono text-gothic-rose/90 shrink-0">{formatWholeNumber(playerPowerVal)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] font-mono text-gothic-rose/50">{player.characterId}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${getTierColor(playerTier)}`}>
                      {getTierLabel(playerTier)}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredPlayers.length === 0 && (
              <p className="text-[11px] text-gothic-rose/50 text-center py-8 font-mono">No matching lords found.</p>
            )}
          </div>
        </div>

        {/* Right Main Detail Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Core Header Dossier Card */}
          <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-display font-bold text-gothic-silver">{activePlayer.currentName}</h1>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded border ${getTierColor(playerEvaluation?.performanceTier)}`}>
                    {getTierLabel(playerEvaluation?.performanceTier)}
                  </span>
                </div>
                <p className="text-xs font-mono text-gothic-rose/60 mt-1">
                  Character ID: <span className="font-bold text-gothic-silver">{activePlayer.characterId}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 ${playerLastActivity.isInactive ? "bg-red-950/40 text-red-300 border border-red-500/30" : "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"}`}>
                    <Activity size={12} /> Last Telemetry: {playerLastActivity.summary}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-right font-mono">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gothic-rose/50 font-mono">Current Power</p>
                  <p className="text-2xl font-bold text-gothic-silver">{formatNum(latestSnapshot?.currentPower)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gothic-rose/50 font-mono">Historical Peak</p>
                  <p className="text-2xl font-bold text-amber-300">{formatNum(latestSnapshot?.highestPower)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1">
              <span className="text-[10px] uppercase text-gothic-rose/50 font-bold block">Seasonal Merits</span>
              <span className="text-xl font-bold text-red-400 block">{formatNum(latestSnapshot?.merits)}</span>
              <span className="text-[10px] text-gothic-rose/60 block">
                {(((latestSnapshot?.merits || 0) / Math.max(1, latestSnapshot?.currentPower || 1)) * 100).toFixed(1)}% Merit / Power Ratio
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1">
              <span className="text-[10px] uppercase text-gothic-rose/50 font-bold block">Troop Casualties</span>
              <span className="text-xl font-bold text-[#89A6B8] block">
                {formatNum((latestSnapshot?.t4Deaths || 0) + (latestSnapshot?.t5Deaths || 0))}
              </span>
              <span className="text-[10px] text-gothic-rose/60 block">
                Target: {formatNum(settings?.configuration?.complianceTargets?.deathsMin || 50000)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1">
              <span className="text-[10px] uppercase text-gothic-rose/50 font-bold block">Resource Gathering</span>
              <span className="text-xl font-bold text-gothic-silver block">{formatNum(latestSnapshot?.gathering)}</span>
              <span className="text-[10px] text-gothic-rose/60 block">Resource RSS collected</span>
            </div>

            <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1">
              <span className="text-[10px] uppercase text-gothic-rose/50 font-bold block">Hospital Healing</span>
              <span className="text-xl font-bold text-emerald-300 block">{formatNum(latestSnapshot?.healing)}</span>
              <span className="text-[10px] text-gothic-rose/60 block">Medical healing volume</span>
            </div>
          </div>

          {/* Historical Growth Timeline Sparkline Chart */}
          <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gothic-silver/20 pb-3">
              <div>
                <h3 className="text-xs font-bold text-gothic-silver uppercase tracking-wider font-mono flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#89A6B8]" /> Growth Timeline Trajectory
                </h3>
                <p className="text-[11px] text-gothic-rose/60 font-mono">
                  Telemetry progress curves recorded across imported snapshots
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => setActiveTimelineMetric("power")}
                  className={`px-3 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                    activeTimelineMetric === "power"
                      ? "bg-gothic-silver text-[#111113] border-gothic-silver"
                      : "bg-gothic-ink text-gothic-rose/60 border-gothic-silver/20"
                  }`}
                >
                  Power Progression
                </button>
                <button
                  onClick={() => setActiveTimelineMetric("merits")}
                  className={`px-3 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                    activeTimelineMetric === "merits"
                      ? "bg-gothic-silver text-[#111113] border-gothic-silver"
                      : "bg-gothic-ink text-gothic-rose/60 border-gothic-silver/20"
                  }`}
                >
                  Merit Growth
                </button>
              </div>
            </div>

            {playerSnapshots.length >= 2 ? (
              <div className="space-y-4">
                <div className="bg-gothic-ink p-4 rounded-xl border border-gothic-silver/10 overflow-hidden">
                  <svg viewBox="0 0 500 120" className="w-full h-32 overflow-visible">
                    <path
                      d={drawTimelinePath()}
                      fill="none"
                      stroke="#89A6B8"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 text-center text-[10px] font-mono text-gothic-rose/50 gap-2">
                  {playerSnapshots.map((s) => (
                    <div key={s.id} className="p-2 bg-gothic-ink rounded-lg border border-gothic-silver/10">
                      <p className="text-gothic-silver font-bold">{new Date(s.recordedAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-[#89A6B8]">
                        {activeTimelineMetric === "power" ? `${(s.currentPower / 1000000).toFixed(1)}M Power` : `${(s.merits / 1000000).toFixed(1)}M Merits`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-gothic-rose/50 text-center py-6">
                Single snapshot recorded. Import additional telemetry files in Ingestion Workspace to render timeline curves.
              </p>
            )}
          </div>

          {/* Officer Notes Ledger */}
          <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-gothic-silver uppercase tracking-wider font-mono flex items-center gap-2 border-b border-gothic-silver/20 pb-3">
              <FileText size={16} className="text-[#89A6B8]" /> Officer Notes Ledger
            </h3>

            <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
              <input
                id="officer-note-input"
                type="text"
                placeholder="Log qualitative observations, activity notes, attendance remarks..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-silver p-2.5 rounded-xl outline-none focus:border-[#89A6B8] font-mono"
              />
              <button
                id="officer-note-submit"
                type="submit"
                className="px-4 py-2.5 bg-gothic-silver hover:bg-white text-[#111113] font-mono font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <Save size={14} /> Save Note
              </button>
            </form>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {playerNotes.map((nt) => (
                <div key={nt.id} className="p-3.5 rounded-xl bg-gothic-ink border border-gothic-silver/10 space-y-1.5 relative group">
                  <div className="flex justify-between items-start font-mono text-[10px]">
                    <span className="font-bold text-gothic-silver">{nt.authorName}</span>
                    <span className="text-gothic-rose/50">{new Date(nt.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gothic-rose/90 leading-relaxed pr-8 font-sans">{nt.content}</p>
                  <button
                    id={`delete-note-btn-${nt.id}`}
                    onClick={() => onDeleteNote(nt.id)}
                    className="absolute right-3 bottom-3 text-gothic-rose/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded"
                    title="Delete note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {playerNotes.length === 0 && (
                <p className="text-xs font-mono text-gothic-rose/50 text-center py-6">No logged notes for this lord profile.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
