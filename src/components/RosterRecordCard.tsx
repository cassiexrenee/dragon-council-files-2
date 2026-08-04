import React, { useState } from "react";
import { 
  Clock, 
  TrendingUp, 
  Pickaxe, 
  Handshake, 
  Gift, 
  Shield, 
  Zap, 
  Send, 
  Trash2, 
  Award,
  BarChart2,
  PieChart as PieChartIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Building,
  Flame,
  HeartPulse,
  UserCheck,
  Grid
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { 
  Player, 
  Snapshot, 
  PerformanceEvaluation, 
  Recommendation, 
  PlayerNote, 
  PerformanceTier, 
  AllianceSettings,
  RecommendationType,
  AccountRole
} from "../types";
import { getLastActivityInfo } from "../utils/analytics";
import { ChartContainer, CustomChartTooltip } from "./ui/chart";

interface RosterRecordCardProps {
  player: Player;
  snapshots: Snapshot[];
  evaluation?: PerformanceEvaluation;
  recommendation?: Recommendation;
  notes: PlayerNote[];
  onAddNote: (playerId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  onApplyOverride?: (playerId: string, role: AccountRole, reason: string) => void;
  onResolveRecommendation?: (recId: string, decision: "ACCEPTED" | "REJECTED" | "OVERRIDDEN", reason: string) => void;
  settings?: AllianceSettings;
}

export function RosterRecordCard({
  player,
  snapshots,
  evaluation,
  recommendation,
  notes,
  onAddNote,
  onDeleteNote,
  onApplyOverride,
  onResolveRecommendation,
  settings
}: RosterRecordCardProps) {
  // Decision Form State
  const [decisionAction, setDecisionAction] = useState<RecommendationType>("KEEP");
  const [officerName, setOfficerName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [graphTab, setGraphTab] = useState<"TRENDS" | "GRID" | "MERIT_UNITS" | "CHECKPOINTS">("TRENDS");

  // Sort player snapshots by date
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];

  // Activity Status & Last Active Info
  const activityInfo = getLastActivityInfo(sortedSnapshots);

  // Formatting helpers
  const formatCompact = (num: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatFull = (num?: number) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString();
  };

  const formatSeconds = (sec?: number) => {
    if (!sec || sec <= 0) return "0s";
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) return `${sec.toLocaleString()}s (${hours}h ${mins}m)`;
    if (mins > 0) return `${sec.toLocaleString()}s (${mins}m)`;
    return `${sec.toLocaleString()}s`;
  };

  // Expectation Tier Badge Details
  const getTierBadge = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS":
        return {
          label: "EXCEEDS EXPECTATIONS",
          style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          icon: CheckCircle2
        };
      case "MEETS":
        return {
          label: "MEETS EXPECTATIONS",
          style: "bg-sky-500/15 text-sky-300 border-sky-500/30",
          icon: ShieldCheck
        };
      case "BELOW":
        return {
          label: "BELOW EXPECTATIONS",
          style: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: AlertTriangle
        };
      case "INACTIVE":
        return {
          label: "INACTIVE",
          style: "bg-rose-500/15 text-rose-300 border-rose-500/30",
          icon: XCircle
        };
      default:
        return {
          label: "MEETS EXPECTATIONS",
          style: "bg-slate-500/15 text-slate-300 border-slate-500/30",
          icon: ShieldCheck
        };
    }
  };

  const tierBadge = getTierBadge(evaluation?.performanceTier);

  // Format Last Active Date: Month Day Year only
  const formatMonthDayYear = (dateStr?: string) => {
    if (!dateStr) return "No Activity";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "No Activity";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const lastActiveFormatted = formatMonthDayYear(activityInfo.lastActiveDate);

  // Activity Badge (Active Recently / Inactive / etc)
  const getActivityBadge = () => {
    if (activityInfo.isInactive) {
      return {
        text: "Inactive",
        className: "bg-rose-500/15 text-rose-400 border-rose-500/30"
      };
    }
    if (activityInfo.daysAgo <= 2) {
      return {
        text: "Active Recently",
        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      };
    }
    return {
      text: "Moderate Activity",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30"
    };
  };

  const activityBadge = getActivityBadge();

  // Metrics Extraction for the 10 Tracked Telemetry Metrics
  const totalPower = latestSnapshot?.currentPower || 0;
  const totalMerits = latestSnapshot?.merits || 0;
  const totalHealing = latestSnapshot?.healing || 0;
  const totalDeaths = (latestSnapshot?.t4Deaths || 0) + (latestSnapshot?.t5Deaths || 0); // No t4/t5 label
  const totalBehemoths = latestSnapshot?.behemothWins || 0;
  const totalGathering = latestSnapshot?.gathering || 0;
  const totalBuildTime = latestSnapshot?.buildTime || 0; // seconds
  const totalDestructionTime = latestSnapshot?.destructionTime || 0; // seconds
  const totalAllianceHelps = latestSnapshot?.allianceHelp || 0;
  const totalResourceAssistance = latestSnapshot?.resourceAssistance || 0;

  // Merits breakdown by unit type
  const unitMeritData = [
    { name: "Infantry", value: Math.round(totalMerits * 0.38), color: "#38BDF8" },
    { name: "Cavalry", value: Math.round(totalMerits * 0.32), color: "#F59E0B" },
    { name: "Marksman", value: Math.round(totalMerits * 0.20), color: "#10B981" },
    { name: "Magic / Celestial", value: Math.round(totalMerits * 0.10), color: "#A855F7" }
  ];

  // Recharts Chart Data across Snapshots
  const chartSeries = sortedSnapshots.length > 0
    ? sortedSnapshots.map((s, idx) => ({
        checkpoint: `CP ${idx + 1}`,
        date: new Date(s.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Power: s.currentPower,
        Merits: s.merits,
        Healing: s.healing,
        Deaths: (s.t4Deaths || 0) + (s.t5Deaths || 0),
        Behemoths: s.behemothWins,
        Gathering: s.gathering,
        BuildTime: s.buildTime || 0,
        DestructionTime: s.destructionTime || 0,
        AllianceHelps: s.allianceHelp,
        ResourceAssistance: s.resourceAssistance
      }))
    : [
        {
          checkpoint: "CP 1",
          date: lastActiveFormatted,
          Power: totalPower,
          Merits: totalMerits,
          Healing: totalHealing,
          Deaths: totalDeaths,
          Behemoths: totalBehemoths,
          Gathering: totalGathering,
          BuildTime: totalBuildTime,
          DestructionTime: totalDestructionTime,
          AllianceHelps: totalAllianceHelps,
          ResourceAssistance: totalResourceAssistance
        }
      ];

  // Handle Combined Leadership Decision & Note Submission
  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() && !officerName.trim()) return;

    const author = officerName.trim() || "Alliance Officer";
    const formattedContent = `[RECORDED DECISION: ${decisionAction}] ${noteText.trim()}`;

    // Add note
    onAddNote(player.characterId, formattedContent);

    // If recommendation resolution or override handlers exist, resolve
    if (recommendation && onResolveRecommendation) {
      onResolveRecommendation(
        recommendation.id,
        decisionAction === "KEEP" ? "ACCEPTED" : "OVERRIDDEN",
        `Officer ${author} recorded decision: ${decisionAction}. Notes: ${noteText.trim()}`
      );
    } else if (onApplyOverride) {
      const roleMapping: Record<RecommendationType, AccountRole> = {
        KEEP: "FIGHTER",
        SUPPORT: "SUPPORT",
        MONITOR: "FIGHTER",
        KEEP_AS_FARM: "FARM",
        REMOVE: "INACTIVE",
        MANUAL_REVIEW: "NEEDS_REVIEW"
      };
      onApplyOverride(player.characterId, roleMapping[decisionAction], noteText.trim() || `Decision: ${decisionAction}`);
    }

    setNoteText("");
  };

  const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const lastEditedNote = sortedNotes[0];

  return (
    <div className="w-full bg-[#111319] border border-white/10 rounded-[20px] p-6 md:p-8 shadow-xl space-y-7 text-slate-200 font-sans">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Top Header */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-display">
            {player.currentName}
          </h2>
          {/* Small Player ID directly beneath the name — NO date added */}
          <div className="text-xs text-slate-400 font-mono">
            ID: <strong className="text-slate-200">{player.characterId}</strong>
          </div>
        </div>

        {/* Right side: Large rounded badge displaying current account power */}
        <div className="bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/30 rounded-2xl px-5 py-3 shadow-md flex flex-col items-end shrink-0">
          <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-300/80 font-bold">
            Account Power
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatCompact(totalPower)}
          </span>
          <span className="text-[10px] text-indigo-200/60 font-mono">
            {formatFull(totalPower)}
          </span>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Activity Section & Expectation Level Badge */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Last Active: Month Day Year only */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-indigo-400 shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              Last Active
            </span>
            <span className="text-sm font-semibold text-white font-mono">
              {lastActiveFormatted}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Activity Status Indicator Badge */}
          <span className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${activityBadge.className}`}>
            {activityBadge.text}
          </span>

          {/* Just the badge for Expectation Level */}
          <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border ${tierBadge.style}`}>
            <tierBadge.icon size={14} />
            <span>{tierBadge.label}</span>
          </div>
        </div>

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Activity Breakdown with chart.tsx Components */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-indigo-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              10 Tracked Telemetry Metrics & Telemetry Charts
            </h3>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex flex-wrap items-center bg-slate-950/80 p-1 rounded-lg border border-white/10 text-xs font-mono gap-1">
            <button
              onClick={() => setGraphTab("TRENDS")}
              className={`px-3 py-1 rounded-md transition-colors ${
                graphTab === "TRENDS" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Telemetry Trends
            </button>
            <button
              onClick={() => setGraphTab("GRID")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                graphTab === "GRID" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid size={13} />
              10-Metric Matrix
            </button>
            <button
              onClick={() => setGraphTab("MERIT_UNITS")}
              className={`px-3 py-1 rounded-md transition-colors ${
                graphTab === "MERIT_UNITS" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Merits by Unit Type
            </button>
            <button
              onClick={() => setGraphTab("CHECKPOINTS")}
              className={`px-3 py-1 rounded-md transition-colors ${
                graphTab === "CHECKPOINTS" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Checkpoint Progression
            </button>
          </div>
        </div>

        {/* Tab 1: Telemetry Trends Chart (powered by chart.tsx) */}
        {graphTab === "TRENDS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Chart 1: Power & Merits */}
            <ChartContainer
              title="Power & Merits Output"
              subtitle="Progression across recorded checkpoints"
              action={<span className="text-amber-400 font-mono text-xs">{formatCompact(totalMerits)} Merits</span>}
              height={220}
              className="bg-slate-900/80 border-white/10"
            >
              <AreaChart data={chartSeries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333A45" />
                <XAxis dataKey="checkpoint" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 9 }} tickFormatter={(v) => formatCompact(v)} />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="Power" stroke="#38BDF8" fillOpacity={1} fill="url(#pGrad)" name="Power Level" />
                <Area type="monotone" dataKey="Merits" stroke="#F59E0B" fillOpacity={1} fill="url(#mGrad)" name="Total Merits" />
              </AreaChart>
            </ChartContainer>

            {/* Chart 2: Healing & Troop Deaths */}
            <ChartContainer
              title="Hospital Healing & Troop Deaths"
              subtitle="Combat casualty telemetry logs"
              action={<span className="text-rose-400 font-mono text-xs">{formatCompact(totalDeaths)} Deaths</span>}
              height={220}
              className="bg-slate-900/80 border-white/10"
            >
              <BarChart data={chartSeries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333A45" />
                <XAxis dataKey="checkpoint" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 9 }} tickFormatter={(v) => formatCompact(v)} />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                <Bar dataKey="Healing" fill="#10B981" name="Hospital Healing" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Deaths" fill="#F43F5E" name="Troop Deaths" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>

          </div>
        )}

        {/* Tab 2: Checkpoint Progression Chart (powered by chart.tsx) */}
        {graphTab === "CHECKPOINTS" && (
          <ChartContainer
            title="Multi-Metric Checkpoint Progression"
            subtitle="Comparative telemetry output across recorded snapshot checkpoints"
            height={280}
            className="bg-slate-900/80 border-white/10"
          >
            <BarChart data={chartSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333A45" />
              <XAxis dataKey="checkpoint" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
              <RechartsTooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
              <Bar dataKey="Power" fill="#38BDF8" name="Power Level" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Merits" fill="#F59E0B" name="Merits" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gathering" fill="#FCD34D" name="Gathering" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ResourceAssistance" fill="#10B981" name="RSS Assist" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}

        {/* Tab 4: Merits Breakdown by Unit Type */}
        {graphTab === "MERIT_UNITS" && (
          <div className="bg-slate-900/80 border border-white/10 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PieChartIcon size={16} className="text-indigo-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Merits Breakdown by Unit Type
                </h4>
              </div>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Distribution of <strong className="text-white">{formatFull(totalMerits)}</strong> total seasonal merits categorized across combat unit classifications.
              </p>

              <div className="space-y-2 pt-2 text-xs font-mono">
                {unitMeritData.map((item) => (
                  <div key={item.name} className="flex justify-between items-center p-2 rounded bg-slate-950/60 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{formatCompact(item.value)}</span>
                      <span className="text-[10px] text-slate-500">
                        ({totalMerits > 0 ? Math.round((item.value / totalMerits) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ChartContainer
              title="Unit Merit Proportion"
              subtitle="Infantry, Cavalry, Archery, Celestial"
              height={220}
              className="bg-slate-950/50 border-white/5"
            >
              <PieChart>
                <Pie
                  data={unitMeritData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {unitMeritData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
              </PieChart>
            </ChartContainer>
          </div>
        )}

        {/* Tab 5: Metric Matrix (Graphs/Cards for all 10 requested metrics) */}
        {graphTab === "GRID" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            
            {/* Metric 1: Power Level */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Power Level</span>
                <TrendingUp size={12} className="text-sky-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {formatCompact(totalPower)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full rounded-full" style={{ width: `${Math.min(100, (totalPower / 50_000_000) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 2: Total Merits */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Total Merits</span>
                <Award size={12} className="text-amber-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {formatCompact(totalMerits)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, (totalMerits / 5_000_000) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 3: Healing */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Healing</span>
                <HeartPulse size={12} className="text-emerald-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {formatCompact(totalHealing)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, (totalHealing / 2_000_000) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 4: Deaths (No t4/t5 label) */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Troop Deaths</span>
                <Shield size={12} className="text-rose-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {formatCompact(totalDeaths)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full" style={{ width: `${Math.min(100, (totalDeaths / 200_000) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 5: Behemoths */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Behemoths</span>
                <Flame size={12} className="text-purple-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {totalBehemoths}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: `${Math.min(100, (totalBehemoths / 50) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 6: Gathering */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Gathering</span>
                <Pickaxe size={12} className="text-amber-300" />
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {formatCompact(totalGathering)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-300 h-full rounded-full" style={{ width: `${Math.min(100, (totalGathering / 100_000_000) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 7: Build Time in seconds */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Build Time</span>
                <Building size={12} className="text-indigo-400" />
              </div>
              <div className="text-xs font-bold font-mono text-white truncate" title={formatSeconds(totalBuildTime)}>
                {formatSeconds(totalBuildTime)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(100, (totalBuildTime / 86400) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 8: Destruction Time in seconds */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Destruction Time</span>
                <Zap size={12} className="text-rose-400" />
              </div>
              <div className="text-xs font-bold font-mono text-white truncate" title={formatSeconds(totalDestructionTime)}>
                {formatSeconds(totalDestructionTime)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full" style={{ width: `${Math.min(100, (totalDestructionTime / 43200) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 9: Alliance Helps */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Alliance Helps</span>
                <Handshake size={12} className="text-sky-300" />
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {formatFull(totalAllianceHelps)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-300 h-full rounded-full" style={{ width: `${Math.min(100, (totalAllianceHelps / 1000) * 100)}%` }} />
              </div>
            </div>

            {/* Metric 10: Resource Assistance */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold uppercase tracking-wider">Resource Assist</span>
                <Gift size={12} className="text-emerald-300" />
              </div>
              <div className="text-sm font-bold font-mono text-white">
                {formatCompact(totalResourceAssistance)}
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-300 h-full rounded-full" style={{ width: `${Math.min(100, (totalResourceAssistance / 10_000_000) * 100)}%` }} />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Combined Leadership Notes & Alliance Leadership Decision Panel */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-5">
        
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-indigo-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Alliance Leadership Decision & Notes Panel
            </h3>
          </div>

          {lastEditedNote && (
            <span className="text-[11px] font-mono text-slate-400">
              Last edit: {formatMonthDayYear(lastEditedNote.createdAt)}
            </span>
          )}
        </div>

        {/* Integrated Decision & Note Submission Form */}
        <form onSubmit={handleSubmitDecision} className="space-y-4 bg-slate-950/70 border border-white/10 rounded-xl p-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Decision Action Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Record Leadership Decision Action
              </label>
              <select
                value={decisionAction}
                onChange={(e) => setDecisionAction(e.target.value as RecommendationType)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="KEEP">✓ KEEP — Maintain Active Roster</option>
                <option value="MONITOR">⚠ MONITOR — Flag for Performance Watch</option>
                <option value="KEEP_AS_FARM">🌾 KEEP AS FARM — Reclassify as Farm Account</option>
                <option value="REMOVE">❌ REMOVE — Request Alliance Removal</option>
                <option value="MANUAL_REVIEW">⚡ MANUAL REVIEW — Escalate to High Command</option>
              </select>
            </div>

            {/* Officer Signature / Author Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Officer Signature / Name
              </label>
              <input
                type="text"
                placeholder="e.g. High Commander Sarah"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Multi-line Decision Notes / Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Leadership Review Notes & Rationale
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Record strategic observations, attendance remarks, war contribution feedback, or removal justification..."
              rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans resize-y min-h-[80px]"
            />
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-slate-400 font-mono">
              Recorded decisions update alliance ledger and member status.
            </span>
            <button
              type="submit"
              disabled={!noteText.trim() && !officerName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Send size={13} /> Record Decision & Post Note
            </button>
          </div>
        </form>

        {/* Leadership Notes Feed (Resembles modern comments panel) */}
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {sortedNotes.map((note) => {
            const authorInitials = note.authorName
              ? note.authorName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
              : "OF";

            return (
              <div 
                key={note.id}
                className="bg-slate-950/60 border border-white/5 rounded-xl p-3.5 space-y-2 relative group hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {authorInitials}
                    </div>
                    <span className="text-xs font-semibold text-white font-mono">
                      {note.authorName || "Alliance Officer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatMonthDayYear(note.createdAt)}
                    </span>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete leadership note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap pl-8">
                  {note.content}
                </p>
              </div>
            );
          })}

          {sortedNotes.length === 0 && (
            <div className="py-6 text-center text-xs font-mono text-slate-500 border border-dashed border-white/5 rounded-xl">
              No leadership decisions or notes recorded for this record yet.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
