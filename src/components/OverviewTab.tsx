import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { 
  Users, 
  Flame, 
  HeartHandshake, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  History as HistoryIcon, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Compass,
  Info,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  Activity,
  Scroll,
  Filter,
  Download
} from "lucide-react";
import { 
  Snapshot, 
  PlayerClassification, 
  PerformanceEvaluation, 
  AccountRole, 
  PerformanceTier, 
  AllianceSettings,
  Recommendation,
  RoleOverride,
  PlayerNote,
  RecommendationType,
  EligibilityStatus,
  ComplianceStatus
} from "../types";
import { getSeasonIndex, formatWholeNumber, getLastActivityInfo } from "../utils/analytics";
import ChronicleTimeline from "./ChronicleTimeline";

interface OverviewTabProps {
  playersCount: number;
  latestSnapshots: Snapshot[];
  snapshots: Snapshot[];
  classifications: PlayerClassification[];
  evaluations: PerformanceEvaluation[];
  settings?: AllianceSettings;
  onNavigateToTab: (tab: string) => void;
  onSelectPlayer: (id: string) => void;
  notes: PlayerNote[];
  overrides: RoleOverride[];
  recommendations: Recommendation[];
  onAddNote: (playerId: string, content: string) => void;
  onApplyOverride: (playerId: string, role: AccountRole, reason: string) => void;
  onResolveRecommendation: (recommendationId: string, decision: "ACCEPTED" | "REJECTED" | "OVERRIDDEN", reason: string) => void;
}

export default function OverviewTab({
  playersCount,
  latestSnapshots,
  snapshots,
  classifications,
  evaluations,
  settings,
  onNavigateToTab,
  onSelectPlayer,
  notes,
  overrides,
  recommendations,
  onAddNote,
  onApplyOverride,
  onResolveRecommendation
}: OverviewTabProps) {
  // 1. Core navigation and filtering state for the Decision Queue workspace
  const [selectedQueue, setSelectedQueue] = useState<"removal" | "review" | "below" | "develop" | "recognition" | "no_action">("review");
  const [activeQueuePlayerId, setActiveQueuePlayerId] = useState<string | null>(null);
  const [hideUnderBaseline, setHideUnderBaseline] = useState<boolean>(true);

  // Calculate seasonal power baseline
  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 10000000;

  // Officer Form states
  const [officerName, setOfficerName] = useState("Officer Sam");
  const [decisionAction, setDecisionAction] = useState<RecommendationType>("KEEP");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionSavedMessage, setDecisionSavedMessage] = useState<string | null>(null);

  // Active snapshots filter
  const activeSnapshots = useMemo(() => {
    if (!hideUnderBaseline) return latestSnapshots;
    return latestSnapshots.filter((s) => s.currentPower >= powerBaseline);
  }, [latestSnapshots, hideUnderBaseline, powerBaseline]);

  const activePlayerIds = useMemo(() => {
    return new Set(activeSnapshots.map((s) => s.playerId));
  }, [activeSnapshots]);

  const activeClassifications = useMemo(() => {
    return classifications.filter((c) => activePlayerIds.has(c.playerId));
  }, [classifications, activePlayerIds]);

  const activeEvaluations = useMemo(() => {
    return evaluations.filter((e) => activePlayerIds.has(e.playerId));
  }, [evaluations, activePlayerIds]);

  // Compute stats
  const avgPower = activeSnapshots.length > 0 
    ? activeSnapshots.reduce((acc, s) => acc + s.currentPower, 0) / activeSnapshots.length 
    : 0;
  
  const roleCounts = activeClassifications.reduce((acc, c) => {
    acc[c.role] = (acc[c.role] || 0) + 1;
    return acc;
  }, {} as Record<AccountRole, number>);

  const tierCounts = activeEvaluations.reduce((acc, e) => {
    acc[e.performanceTier] = (acc[e.performanceTier] || 0) + 1;
    return acc;
  }, {} as Record<PerformanceTier, number>);

  const totalClassified = activeClassifications.length || 1;
  const fighterPercent = Math.round(((roleCounts["FIGHTER"] || 0) / totalClassified) * 100);
  const supportPercent = Math.round(((roleCounts["SUPPORT"] || 0) / totalClassified) * 100);
  const farmPercent = Math.round(((roleCounts["FARM"] || 0) / totalClassified) * 100);
  const inactivePercent = Math.round(((roleCounts["INACTIVE"] || 0) / totalClassified) * 100);
  const reviewPercent = Math.round(((roleCounts["NEEDS_REVIEW"] || 0) / totalClassified) * 100);

  // Combat Readiness Index (avg of fighter performance scores)
  const fightersEval = activeEvaluations.filter(e => {
    const role = activeClassifications.find(c => c.playerId === e.playerId)?.role;
    return role === "FIGHTER";
  });
  const combatReadiness = fightersEval.length > 0
    ? Math.round(fightersEval.reduce((acc, e) => acc + e.performanceScore, 0) / fightersEval.length)
    : 0;

  // --------------------------------------------------------
  // DECISION QUEUE CLASSIFIER / CATEGORIZER
  // --------------------------------------------------------
  const queues = useMemo(() => {
    const removal: string[] = [];
    const review: string[] = [];
    const below: string[] = [];
    const develop: string[] = [];
    const recognition: string[] = [];
    const no_action: string[] = [];

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
      const isExceedsFighterSupport = ev?.performanceTier === "EXCEEDS" && ev?.eligibilityStatus === "ELIGIBLE" && (cl?.role === "FIGHTER" || cl?.role === "SUPPORT");

      if (isRemovalRec || isInactive) {
        removal.push(pid);
      } else if (isNeedsReview) {
        review.push(pid);
      } else if (isBelowTier) {
        below.push(pid);
      } else if (isSupportOrMonitorRec) {
        develop.push(pid);
      } else if (isExceedsFighterSupport) {
        recognition.push(pid);
      } else {
        no_action.push(pid);
      }
    });

    // Sorters based on power and merits
    const sortRemoval = (a: string, b: string) => {
      const snapA = latestSnapshots.find(s => s.playerId === a);
      const snapB = latestSnapshots.find(s => s.playerId === b);
      return (snapA?.currentPower || 0) - (snapB?.currentPower || 0); // lowest power first
    };

    const sortReview = (a: string, b: string) => {
      const clA = classifications.find(c => c.playerId === a);
      const clB = classifications.find(c => c.playerId === b);
      return (clA?.confidenceScore || 0) - (clB?.confidenceScore || 0); // lowest confidence first
    };

    const sortBelow = (a: string, b: string) => {
      const snapA = latestSnapshots.find(s => s.playerId === a);
      const snapB = latestSnapshots.find(s => s.playerId === b);
      return (snapA?.currentPower || 0) - (snapB?.currentPower || 0); // lowest power first
    };

    const sortDevelop = (a: string, b: string) => {
      const snapA = latestSnapshots.find(s => s.playerId === a);
      const snapB = latestSnapshots.find(s => s.playerId === b);
      return (snapA?.currentPower || 0) - (snapB?.currentPower || 0);
    };

    const sortRecognition = (a: string, b: string) => {
      const snapA = latestSnapshots.find(s => s.playerId === a);
      const snapB = latestSnapshots.find(s => s.playerId === b);
      return (snapB?.merits || 0) - (snapA?.merits || 0); // best merits first
    };

    const sortNoAction = (a: string, b: string) => {
      const snapA = latestSnapshots.find(s => s.playerId === a);
      const snapB = latestSnapshots.find(s => s.playerId === b);
      return (snapB?.currentPower || 0) - (snapA?.currentPower || 0); // power rank
    };

    return {
      removal: removal.sort(sortRemoval),
      review: review.sort(sortReview),
      below: below.sort(sortBelow),
      develop: develop.sort(sortDevelop),
      recognition: recognition.sort(sortRecognition),
      no_action: no_action.sort(sortNoAction),
    };
  }, [activeSnapshots, classifications, evaluations, recommendations]);

  // Selected player relative to selected queue
  const currentQueuePlayerList = useMemo(() => {
    return queues[selectedQueue] || [];
  }, [queues, selectedQueue]);

  // Handle setting active player in queue when switching queues
  React.useEffect(() => {
    if (currentQueuePlayerList.length > 0) {
      setActiveQueuePlayerId(currentQueuePlayerList[0]);
    } else {
      setActiveQueuePlayerId(null);
    }
    setDecisionSavedMessage(null);
  }, [selectedQueue, currentQueuePlayerList]);

  // Retrieve details for current player being processed in the queue
  const currentDetailPlayer = useMemo(() => {
    if (!activeQueuePlayerId) return null;
    const snap = latestSnapshots.find(s => s.playerId === activeQueuePlayerId);
    const classification = classifications.find(c => c.playerId === activeQueuePlayerId);
    const evaluation = evaluations.find(e => e.playerId === activeQueuePlayerId);
    const rec = recommendations.find(r => r.playerId === activeQueuePlayerId);
    const playerNotes = notes.filter(n => n.playerId === activeQueuePlayerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const override = overrides.find(o => o.playerId === activeQueuePlayerId);

    return {
      id: activeQueuePlayerId,
      snap,
      classification,
      evaluation,
      rec,
      notes: playerNotes,
      override
    };
  }, [activeQueuePlayerId, latestSnapshots, classifications, evaluations, recommendations, notes, overrides]);

  // Season Activity Chart Data for active player — uses real recorded
  // snapshot history only. No synthetic/interpolated data points.
  const playerSeasonChartData = useMemo(() => {
    if (!currentDetailPlayer) return [];
    const pSnaps = snapshots
      .filter(s => s.playerId === currentDetailPlayer.id)
      .sort((a, b) => new Date(a.recordedAt || a.createdAt).getTime() - new Date(b.recordedAt || b.createdAt).getTime());

    return pSnaps.map((s, idx) => ({
      checkpoint: `CP ${idx + 1}`,
      Power: s.currentPower || 0,
      Merits: s.merits || 0,
      Deaths: (s.t4Deaths || 0) + (s.t5Deaths || 0),
      Healing: s.healing || 0
    }));
  }, [currentDetailPlayer, snapshots]);

  // Synchronize decisionAction when active player changes to avoid state updates during render
  React.useEffect(() => {
    if (currentDetailPlayer?.rec) {
      setDecisionAction(currentDetailPlayer.rec.recommendation);
    }
  }, [activeQueuePlayerId, currentDetailPlayer?.rec]);

  // Handle recording decision action
  const handleRecordDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQueuePlayerId || !currentDetailPlayer) return;

    const actionLabel = {
      KEEP: "Keep on Active Roster",
      SUPPORT: "Support / Develop",
      MONITOR: "Monitor KvK Output",
      KEEP_AS_FARM: "Maintain as Farm",
      REMOVE: "Removal / Demote Candidate",
      MANUAL_REVIEW: "Trigger Manual Review"
    }[decisionAction];

    const noteContent = `[Decision Recorded] Action: ${actionLabel}. Officer: ${officerName}. Reason: ${decisionReason.trim() || "Approved recommended strategy."}`;
    
    // Add note to persist in history
    onAddNote(activeQueuePlayerId, noteContent);

    // Apply manual override to synchronize classification if action is farm or inactive override
    if (decisionAction === "KEEP_AS_FARM") {
      onApplyOverride(activeQueuePlayerId, "FARM", `Officer changed role standard via decision queue workspace.`);
    } else if (decisionAction === "REMOVE") {
      onApplyOverride(activeQueuePlayerId, "INACTIVE", `Officer verified removing telemetry baseline.`);
    }

    setDecisionReason("");
    setDecisionSavedMessage(`Decision recorded for ${currentDetailPlayer.snap?.playerName || "Player"}! Roster ledger is updated.`);
    setTimeout(() => {
      setDecisionSavedMessage(null);
    }, 8000);
  };

  // Preset reason presets
  const applyPresetReason = (reason: string) => {
    setDecisionReason(reason);
  };

  // Export function for any category (Queue or Role)
  const exportCategoryCSV = (categoryKey: string, categoryLabel: string, playerIds: string[]) => {
    const rows = playerIds.map((pid) => {
      const snap = latestSnapshots.find((s) => s.playerId === pid);
      const cl = classifications.find((c) => c.playerId === pid);
      const ev = evaluations.find((e) => e.playerId === pid);
      const rec = recommendations.find((r) => r.playerId === pid);

      const power = snap?.currentPower || 0;
      const merits = snap?.merits || 0;
      const meritRatio = power > 0 ? ((merits / power) * 100).toFixed(1) + "%" : "0%";

      return {
        "Character ID": pid,
        "Lord Name": snap?.playerName || "Unknown",
        "Category": categoryLabel,
        "Assigned Role": cl?.role || "UNCLASSIFIED",
        "Current Power": power,
        "Seasonal Merits": merits,
        "Merit/Power Ratio": meritRatio,
        "T4/T5 Deaths": (snap?.t4Deaths || 0) + (snap?.t5Deaths || 0),
        "Performance Tier": ev?.performanceTier || "MEETS",
        "Compliance Status": ev?.complianceStatus || "UNKNOWN",
        "Eligibility Status": ev?.eligibilityStatus || "UNKNOWN",
        "Officer Recommendation": rec?.recommendation || "KEEP"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanLabel = categoryLabel.replace(/[^a-zA-Z0-9]/g, "_");
    a.download = `DragonCouncil_Category_${cleanLabel}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const baseline = powerBaseline;

  return (
    <div className="space-y-6">

      {/* Header and Baseline Filter Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 gap-4">
        <div>
          <h2 className="text-base font-bold text-gothic-silver font-display flex items-center gap-2">
            <Compass size={18} className="text-gothic-silver" />
            Executive Alliance Overview
          </h2>
          <p className="text-xs text-gothic-rose/50 mt-0.5">
            Active Season: <span className="text-gothic-silver font-mono font-bold">{activeSeason}</span> • Power Baseline Threshold: <span className="text-gothic-silver font-mono font-bold">{(powerBaseline / 1000000).toFixed(1)}M</span>
          </p>
        </div>
        <div>
          <button
            id="overview-baseline-filter-btn"
            onClick={() => setHideUnderBaseline(!hideUnderBaseline)}
            className={`py-1.5 px-3 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              hideUnderBaseline
                ? "bg-[#8B0000]/20 text-red-300 border-[#8B0000]/50 hover:bg-[#8B0000]/30"
                : "bg-gothic-ink text-gothic-rose/50 border-gothic-silver/20 hover:text-gothic-silver"
            }`}
          >
            <Filter size={12} />
            {hideUnderBaseline ? `Baseline Filter (≥ ${(powerBaseline / 1000000).toFixed(1)}M)` : `Show All Power Levels`}
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------
          SECTION 5: THE OFFICER DECISION QUEUE SUMMARY METRIC COMPONENT
          -------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { 
            id: "removal", 
            label: "Removal Candidates", 
            count: queues.removal.length, 
            color: "border-red-500/20 hover:border-red-500/50", 
            badgeBg: "bg-red-500/10 text-red-400",
            dotColor: "text-red-500",
            icon: "🔴"
          },
          { 
            id: "review", 
            label: "Requiring Review", 
            count: queues.review.length, 
            color: "border-amber-500/20 hover:border-amber-500/50", 
            badgeBg: "bg-amber-500/10 text-amber-400",
            dotColor: "text-amber-500",
            icon: "🟠"
          },
          { 
            id: "below", 
            label: "Below Expectations", 
            count: queues.below.length, 
            color: "border-yellow-500/20 hover:border-yellow-500/50", 
            badgeBg: "bg-yellow-500/10 text-yellow-400",
            dotColor: "text-yellow-400",
            icon: "🟡"
          },
          { 
            id: "develop", 
            label: "Develop / Support", 
            count: queues.develop.length, 
            color: "border-sky-500/20 hover:border-sky-500/50", 
            badgeBg: "bg-sky-500/10 text-sky-400",
            dotColor: "text-sky-400",
            icon: "🔵"
          },
          { 
            id: "recognition", 
            label: "Recognition", 
            count: queues.recognition.length, 
            color: "border-emerald-500/20 hover:border-emerald-500/50", 
            badgeBg: "bg-emerald-500/10 text-emerald-400",
            dotColor: "text-emerald-400",
            icon: "🟢"
          },
          { 
            id: "no_action", 
            label: "No Action Needed", 
            count: queues.no_action.length, 
            color: "border-gothic-silver/20 hover:border-[#89A6B8]/40", 
            badgeBg: "bg-gray-800 text-gothic-rose/90",
            dotColor: "text-gray-400",
            icon: "✓"
          }
        ].map((q) => {
          const isActive = selectedQueue === q.id;
          const pids = queues[q.id as keyof typeof queues];
          return (
            <div
              key={q.id}
              onClick={() => setSelectedQueue(q.id as any)}
              className={`p-3.5 rounded-xl bg-gothic-velvet border transition-all text-left flex flex-col justify-between cursor-pointer ${
                isActive 
                  ? "border-gothic-silver ring-1 ring-[#E7CB9C]/30 bg-gothic-ink" 
                  : q.color
              }`}
            >
              <div className="flex justify-between items-start w-full gap-1">
                <span className="text-base">{q.icon}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportCategoryCSV(q.id, q.label, pids);
                    }}
                    title={`Export ${q.label} CSV`}
                    className="p-1 rounded bg-gothic-ink/80 hover:bg-gothic-silver/20 text-gothic-rose/50 hover:text-gothic-silver border border-gothic-silver/20 transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    <Download size={11} />
                  </button>
                  <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full ${q.badgeBg}`}>
                    {q.count}
                  </span>
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-[9px] uppercase font-bold tracking-widest text-gothic-rose/50">Category</p>
                <h4 className="text-xs font-bold text-gothic-silver mt-0.5 tracking-tight truncate">{q.label}</h4>
              </div>
            </div>
          );
        })}
      </div>



      {/* --------------------------------------------------------
          DECISION QUEUE DETAIL SPLIT VIEW
          -------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Sorted Players list in Selected Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-3">
            <div className="flex justify-between items-center border-b border-gothic-silver/20 pb-2">
              <h3 className="text-xs font-bold tracking-wider text-gothic-silver uppercase font-mono">
                {selectedQueue.replace("_", " ")} list ({currentQueuePlayerList.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  const queueLabels: Record<string, string> = {
                    removal: "Removal Candidates",
                    review: "Requiring Review",
                    below: "Below Expectations",
                    develop: "Develop / Support",
                    recognition: "Recognition",
                    no_action: "No Action Needed"
                  };
                  exportCategoryCSV(selectedQueue, queueLabels[selectedQueue] || selectedQueue, currentQueuePlayerList);
                }}
                className="px-2 py-0.5 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded text-[10px] font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer"
                title={`Export ${selectedQueue.replace("_", " ")} CSV`}
              >
                <Download size={10} />
                Export
              </button>
            </div>

            {currentQueuePlayerList.length === 0 ? (
              <div className="p-8 text-center text-xs text-gothic-rose/50">
                No players currently flagged in this queue category.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {currentQueuePlayerList.map((pid) => {
                  const snap = latestSnapshots.find(s => s.playerId === pid);
                  const ev = evaluations.find(e => e.playerId === pid);
                  const cl = classifications.find(c => c.playerId === pid);
                  const isActive = activeQueuePlayerId === pid;

                  return (
                    <button
                      key={pid}
                      onClick={() => setActiveQueuePlayerId(pid)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-gothic-ink border-[#89A6B8] text-gothic-silver"
                          : "bg-gothic-void border-gothic-silver/20 hover:border-[#77777A]/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gothic-silver truncate">{snap?.playerName || "Unknown Player"}</span>
                          {cl?.role && (
                            <span className="text-[9px] px-1 bg-gray-800 text-gothic-rose/50 font-mono rounded uppercase">
                              {cl.role.substring(0, 3)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gothic-rose/50 mt-1">
                          <span>{snap ? `${formatWholeNumber(snap.currentPower)}` : "N/A"} Power</span>
                          <span>•</span>
                          <span className={ev?.performanceTier === "EXCEEDS" ? "text-emerald-400" : ev?.performanceTier === "BELOW" ? "text-amber-500" : "text-[#89A6B8]"}>
                            {ev?.performanceTier === "EXCEEDS" ? "Exceeds" : ev?.performanceTier === "BELOW" ? "Below Target" : "Meets Target"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className={isActive ? "text-gothic-silver" : "text-gothic-rose/50"} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed 5-Layer Decision Card Workspace */}
        <div className="lg:col-span-8">
          {currentDetailPlayer ? (
            <div className="space-y-6">
              
              {/* --------------------------------------------------------
                  THE DECISION CARD (SECTION 6)
                  -------------------------------------------------------- */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-gothic-velvet to-gothic-ink border border-gothic-silver/10 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Decorative Corner Trim Flairs */}
                <div className="absolute top-2 left-2 text-gothic-silver/20 font-display text-[10px]">✦</div>
                <div className="absolute top-2 right-2 text-gothic-silver/20 font-display text-[10px]">✦</div>
                <div className="absolute bottom-2 left-2 text-gothic-silver/20 font-display text-[10px]">✦</div>
                <div className="absolute bottom-2 right-2 text-gothic-silver/20 font-display text-[10px]">✦</div>
                
                {/* Visual accent bar based on recommendation */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  currentDetailPlayer.rec?.recommendation === "REMOVE" ? "bg-gothic-crimson" :
                  currentDetailPlayer.rec?.recommendation === "MANUAL_REVIEW" ? "bg-amber-500" :
                  currentDetailPlayer.rec?.recommendation === "SUPPORT" || currentDetailPlayer.rec?.recommendation === "MONITOR" ? "bg-gothic-sapphire" :
                  "bg-gothic-silver"
                }`} />

                {/* Card Header */}
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gothic-silver/10 pb-4 relative z-10">
                  <div className="space-y-1">
                    <p className="font-display text-[9px] tracking-[0.25em] text-gothic-rose/40 uppercase mb-0.5">
                      Roster Record // Intelligence Dossier
                    </p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold font-script tracking-wider text-gothic-silver">{currentDetailPlayer.snap?.playerName}</h2>
                      <span className="px-2 py-0.5 bg-gothic-silver/10 border border-gothic-silver/20 text-gothic-silver text-[9px] font-mono rounded uppercase">
                        {currentDetailPlayer.classification?.role || "FIGHTER"}
                      </span>
                      {currentDetailPlayer.override && (
                        <span className="px-1.5 py-0.5 bg-[#D4B26A]/20 border border-[#D4B26A]/40 text-[#D4B26A] text-[9px] font-mono rounded uppercase">
                          Manual Override
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-ledger italic text-gothic-rose/50">
                      ID: {currentDetailPlayer.id} • Main Alliance • Logged: {currentDetailPlayer.snap ? new Date(currentDetailPlayer.snap.recordedAt).toLocaleDateString() : "N/A"}
                    </p>
                    {(() => {
                      const pSnaps = latestSnapshots.filter(s => s.playerId === currentDetailPlayer.id);
                      const actInfo = getLastActivityInfo(pSnaps);
                      return (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 ${actInfo.isInactive || currentDetailPlayer.classification?.role === "INACTIVE" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"}`}>
                            <Activity size={11} /> Last Activity Seen: {actInfo.summary}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gothic-rose/50 font-display uppercase tracking-wider">Account Power</p>
                    <p className="text-xl font-bold font-ledger text-gothic-silver">{currentDetailPlayer.snap ? formatWholeNumber(currentDetailPlayer.snap.currentPower) : "0"} <span className="text-[10px] text-gothic-rose/40 italic font-ledger">power</span></p>
                  </div>
                </div>

                {/* Requirement Status Bar Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gothic-void p-4 rounded-lg border border-gothic-silver/20">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-gothic-rose/50 font-bold">Requirement Compliance</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`text-lg font-bold font-mono ${
                        (currentDetailPlayer.evaluation?.complianceStatus === "COMPLIANT" || currentDetailPlayer.evaluation?.complianceStatus === "EXEMPLARY") ? "text-emerald-400" :
                        currentDetailPlayer.evaluation?.complianceStatus === "NON_COMPLIANT" ? "text-amber-500" : "text-sky-400"
                      }`}>
                        {(currentDetailPlayer.evaluation?.complianceStatus === "COMPLIANT" || currentDetailPlayer.evaluation?.complianceStatus === "EXEMPLARY") ? "✓ Fully Compliant" :
                         currentDetailPlayer.evaluation?.complianceStatus === "NON_COMPLIANT" ? "⚠ Non-Compliant" :
                         "⚡ Partially Compliant"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] uppercase tracking-widest text-gothic-rose/50 font-bold">Expectation Tier</span>
                    <span className={`text-xs font-bold tracking-widest uppercase mt-1.5 px-3 py-1 rounded border max-w-fit font-mono ${
                      currentDetailPlayer.evaluation?.performanceTier === "EXCEEDS" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : currentDetailPlayer.evaluation?.performanceTier === "BELOW" 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                        : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    }`}>
                      {currentDetailPlayer.evaluation?.performanceTier === "EXCEEDS" ? "★ Exceeds Expectations" :
                       currentDetailPlayer.evaluation?.performanceTier === "BELOW" ? "⚠ Below Expectations" :
                       "✓ Meets Expectations"}
                    </span>
                  </div>
                </div>

                {/* --------------------------------------------------------
                    SECTION 3: THE TRADITIONAL ALLIANCE CHECKLIST PANEL
                    -------------------------------------------------------- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-gothic-rose/50 uppercase flex items-center gap-1.5">
                    <SlidersHorizontal size={12} className="text-gothic-silver" />
                    Traditional Requirement Status Panel
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Power compliance */}
                    {(() => {
                      const metrics = currentDetailPlayer.evaluation?.complianceMetrics;
                      const reqPower = metrics?.powerReq || powerBaseline;
                      const passed = metrics?.powerPassed ?? ((currentDetailPlayer.snap?.currentPower || 0) >= reqPower);
                      return (
                        <div className={`p-3 rounded-lg border ${passed ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"} flex flex-col justify-between`}>
                          <div className="flex justify-between items-center text-[10px] font-mono text-gothic-rose/50">
                            <span>Power Threshold</span>
                            <span>{passed ? "✓" : "✗"}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-bold text-gothic-silver font-mono">
                              {currentDetailPlayer.snap ? formatWholeNumber(currentDetailPlayer.snap.currentPower) : "0"} / {formatWholeNumber(reqPower)}
                            </p>
                            <p className="text-[9px] text-gothic-rose/50 mt-0.5">Seasonal minimum</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Merits compliance */}
                    {(() => {
                      const metrics = currentDetailPlayer.evaluation?.complianceMetrics;
                      const targetPct = metrics?.meritRatioPctTarget ?? settings?.configuration?.complianceTargets?.meritRatioPct ?? 10;
                      const meritsVal = currentDetailPlayer.snap?.merits || 0;
                      const powerVal = currentDetailPlayer.snap?.currentPower || 1;
                      const meritReq = metrics?.meritReq ?? Math.round(powerVal * (targetPct / 100));
                      const meritPct = Math.round((meritsVal / powerVal) * 100);
                      const passed = metrics?.meritRatioPassed ?? (meritsVal >= meritReq);
                      return (
                        <div className={`p-3 rounded-lg border ${passed ? "bg-emerald-500/5 border-emerald-500/10" : "bg-amber-500/5 border-amber-500/10"} flex flex-col justify-between`}>
                          <div className="flex justify-between items-center text-[10px] font-mono text-gothic-rose/50">
                            <span>{targetPct}% Merit Rule</span>
                            <span>{passed ? "✓" : "✗"}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-bold text-gothic-silver font-mono">
                              {currentDetailPlayer.snap ? formatWholeNumber(currentDetailPlayer.snap.merits) : "0"} ({meritPct}% of Power)
                            </p>
                            <p className="text-[9px] text-gothic-rose/50 mt-0.5">Target: {targetPct}% of Power ({formatWholeNumber(meritReq)})</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Deaths compliance */}
                    {(() => {
                      const metrics = currentDetailPlayer.evaluation?.complianceMetrics;
                      const deathsVal = metrics?.deathsVal ?? ((currentDetailPlayer.snap?.t4Deaths || 0) + (currentDetailPlayer.snap?.t5Deaths || 0));
                      const deathsReq = metrics?.deathsReq ?? settings?.configuration?.complianceTargets?.deathsMin ?? 50000;
                      const passed = metrics?.deathsPassed ?? (deathsVal >= deathsReq);
                      return (
                        <div className={`p-3 rounded-lg border ${passed ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"} flex flex-col justify-between`}>
                          <div className="flex justify-between items-center text-[10px] font-mono text-gothic-rose/50">
                            <span>Deaths Target</span>
                            <span>{passed ? "✓" : "✗"}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-bold text-gothic-silver font-mono">
                              {deathsVal.toLocaleString()} / {deathsReq.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gothic-rose/50 mt-0.5">Target: {deathsReq.toLocaleString()} T4/T5 Losses</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Activity compliance */}
                    {(() => {
                      const metrics = currentDetailPlayer.evaluation?.complianceMetrics;
                      const passed = metrics?.activityPassed ?? (currentDetailPlayer.evaluation?.activityState === "ACTIVE");
                      const activityVal = metrics?.activityVal || currentDetailPlayer.evaluation?.activityState || "ACTIVE";
                      return (
                        <div className={`p-3 rounded-lg border ${passed ? "bg-emerald-500/5 border-emerald-500/10" : "bg-gray-500/5 border-gray-500/10"} flex flex-col justify-between`}>
                          <div className="flex justify-between items-center text-[10px] font-mono text-gothic-rose/50">
                            <span>Roster Status</span>
                            <span>{passed ? "✓" : "✗"}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-bold text-gothic-silver font-mono">
                              {activityVal}
                            </p>
                            <p className="text-[9px] text-gothic-rose/50 mt-0.5">Is actively logged</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>



                {/* Season Activity Charts */}
                <div className="space-y-4 pt-2 border-t border-gothic-silver/20">
                  <div className="flex items-center justify-between border-b border-gothic-silver/20 pb-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-gothic-silver font-mono flex items-center gap-2">
                      <TrendingUp size={14} className="text-[#89A6B8]" /> Season Activity & Telemetry Analytics
                    </span>
                    <span className="text-[10px] font-mono text-gothic-rose/60 uppercase">
                      Checkpoint Series ({playerSeasonChartData.length} Snapshots)
                    </span>
                  </div>

                  {playerSeasonChartData.length >= 2 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Power & Merit Output Area Chart */}
                    <div className="p-4 bg-gothic-void border border-gothic-silver/20 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold text-gothic-silver">
                        <span>Power & Seasonal Merit Output</span>
                        <span className="text-amber-400">Merit Growth</span>
                      </div>
                      <div className="h-52 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={playerSeasonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C8CCD2" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#C8CCD2" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="meritGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4B26A" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#D4B26A" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333A45" />
                            <XAxis dataKey="checkpoint" stroke="#89A6B8" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#89A6B8" tick={{ fontSize: 9 }} tickFormatter={(v) => formatWholeNumber(v)} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#1A1D24", borderColor: "#4B5563", borderRadius: "8px", fontSize: "11px", fontFamily: "monospace" }}
                              formatter={(value: any) => [formatWholeNumber(value as number)]}
                            />
                            <Area type="monotone" dataKey="Power" stroke="#C8CCD2" fillOpacity={1} fill="url(#powerGrad)" name="Lord Power" />
                            <Area type="monotone" dataKey="Merits" stroke="#D4B26A" fillOpacity={1} fill="url(#meritGrad)" name="Seasonal Merits" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Troop Deaths vs Hospital Healing Bar Chart */}
                    <div className="p-4 bg-gothic-void border border-gothic-silver/20 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold text-gothic-silver">
                        <span>Combat Casualties & Hospital Recovery</span>
                        <span className="text-red-400">T4/T5 Troop Deaths</span>
                      </div>
                      <div className="h-52 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={playerSeasonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333A45" />
                            <XAxis dataKey="checkpoint" stroke="#89A6B8" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#89A6B8" tick={{ fontSize: 9 }} tickFormatter={(v) => formatWholeNumber(v)} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#1A1D24", borderColor: "#4B5563", borderRadius: "8px", fontSize: "11px", fontFamily: "monospace" }}
                              formatter={(value: any) => [formatWholeNumber(value as number)]}
                            />
                            <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                            <Bar dataKey="Deaths" fill="#EF4444" name="Troop Deaths" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Healing" fill="#38BDF8" name="Hospital Healing" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  ) : (
                    <div className="p-8 text-center text-xs font-mono text-gothic-rose/50 border border-dashed border-gothic-silver/20 rounded-xl">
                      {playerSeasonChartData.length === 1
                        ? "Only one telemetry snapshot recorded for this character. Import an additional snapshot in the Ingestion Workspace to render trend charts."
                        : "No telemetry snapshots recorded for this character yet."}
                    </div>
                  )}
                </div>

              </div>

              {/* --------------------------------------------------------
                  THE OFFICER DECISION FORM & HISTORICAL LEDGER SIDE BY SIDE
                  -------------------------------------------------------- */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

                {/* Left: Record Alliance Leadership Decision */}
                <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-6">
                  <div className="border-b border-gothic-silver/20 pb-3 flex items-center gap-2">
                    <UserCheck size={16} className="text-gothic-silver" />
                    <div>
                      <h3 className="text-sm font-bold text-gothic-silver font-display">Record Alliance Leadership Decision</h3>
                      <p className="text-xs text-gothic-rose/50 mt-0.5">Log officer decisions to override automation and establish historical ledger.</p>
                    </div>
                  </div>

                  {decisionSavedMessage && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      {decisionSavedMessage}
                    </div>
                  )}

                  <form onSubmit={handleRecordDecision} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Action Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-mono font-bold text-gothic-rose/50">Effective Action Decision</label>
                        <select
                          value={decisionAction}
                          onChange={(e) => setDecisionAction(e.target.value as any)}
                          className="w-full bg-gothic-void border border-gothic-silver/20 hover:border-[#89A6B8] focus:border-gothic-silver text-xs font-semibold px-3 py-2 rounded-lg text-gothic-silver outline-none"
                        >
                          <option value="KEEP">Keep on Active Roster</option>
                          <option value="SUPPORT">Support / Develop Candidate</option>
                          <option value="MONITOR">Monitor KvK Output</option>
                          <option value="KEEP_AS_FARM">Keep as Farm layout</option>
                          <option value="REMOVE">Remove / Purge Candidate</option>
                          <option value="MANUAL_REVIEW">Manual Officer Audit</option>
                        </select>
                      </div>

                      {/* Officer Signatory */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-mono font-bold text-gothic-rose/50">Officer Signatory Signature</label>
                        <input
                          type="text"
                          required
                          value={officerName}
                          onChange={(e) => setOfficerName(e.target.value)}
                          className="w-full bg-gothic-void border border-gothic-silver/20 focus:border-gothic-silver text-xs px-3 py-2 rounded-lg text-gothic-silver outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick preset reasons */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-mono font-bold text-gothic-rose/50">Quick Presets / Templates</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Player missed merit target due to extended absence. Review next KvK snapshot.",
                          "Frontline combat casualty outputs excellent. Approved keeping despite merit gap.",
                          "Account redirected to farm layout to optimize economic assistance distribution.",
                          "Fails multiple active requirements. Roster space requested for recruitment.",
                          "Temporarily monitoring; awaiting final zone gate deployment logs."
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyPresetReason(preset)}
                            className="px-2 py-1 bg-gothic-ink hover:bg-gothic-ink/80 text-[10px] text-gothic-rose/90 rounded border border-gothic-silver/20 transition-all cursor-pointer text-left truncate max-w-xs"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Commentary */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono font-bold text-gothic-rose/50">Decision Commentary & Contextual Evidence</label>
                      <textarea
                        required
                        rows={3}
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Explain why this decision is made (e.g., Extended medical absence, special defense role, or seasonal exclusion...)"
                        className="w-full bg-gothic-void border border-gothic-silver/20 focus:border-gothic-silver text-xs p-3 rounded-lg text-gothic-silver outline-none font-sans resize-none placeholder-[#77777A]"
                      />
                    </div>

                    {/* Save button */}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gothic-silver hover:bg-opacity-95 text-[#111113] font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle size={14} />
                      Record Decision & Sync
                    </button>
                  </form>
                </div>

                {/* Right: Player history timeline of previous decisions */}
                <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4">
                  <div className="flex items-center gap-2 border-b border-gothic-silver/20 pb-2">
                    <HistoryIcon size={16} className="text-[#89A6B8]" />
                    <h3 className="text-xs font-mono font-bold tracking-widest text-gothic-rose/50 uppercase">
                      Roster Audit & Historical Ledger ({currentDetailPlayer.notes.length})
                    </h3>
                  </div>

                  {currentDetailPlayer.notes.length === 0 ? (
                    <p className="text-xs text-gothic-rose/50 italic py-2">No historical decision notes logged for this character ID.</p>
                  ) : (
                    <div className="space-y-3">
                      {currentDetailPlayer.notes.map((note) => (
                        <div key={note.id} className="p-3 rounded-lg bg-gothic-void border border-gothic-silver/20/60 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-gothic-rose/50">
                            <span className="text-gothic-silver font-semibold">{note.authorName}</span>
                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gothic-silver font-sans leading-relaxed pt-1">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
              <AlertTriangle size={36} className="mx-auto mb-2 opacity-30 text-amber-400" />
              <p className="text-xs font-mono">No active player highlighted in this queue.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
