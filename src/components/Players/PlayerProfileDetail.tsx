import React, { useState } from "react";
import { Activity, TrendingUp, FileText, Save, Trash2 } from "lucide-react";
import { Player, Snapshot, PerformanceEvaluation, PerformanceTier, PlayerNote, AllianceSettings } from "../../types";
import { formatWholeNumber } from "../../utils/Analytics";

interface PlayerProfileDetailProps {
  activePlayer: Player;
  playerSnapshots: Snapshot[];
  latestSnapshot?: Snapshot;
  playerEvaluation?: PerformanceEvaluation;
  playerLastActivity: any;
  playerNotes: PlayerNote[];
  settings?: AllianceSettings;
  onAddNote: (playerId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function PlayerProfileDetail({
  activePlayer,
  playerSnapshots,
  latestSnapshot,
  playerEvaluation,
  playerLastActivity,
  playerNotes,
  settings,
  onAddNote,
  onDeleteNote
}: PlayerProfileDetailProps) {
  const [activeTimelineMetric, setActiveTimelineMetric] = useState<"power" | "merits">("power");
  const [noteContent, setNoteContent] = useState("");

  const formatNum = (num?: number) => (num === undefined ? "0" : num.toLocaleString());

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

  const drawTimelinePath = () => {
    if (playerSnapshots.length < 2) return "";
    let values = activeTimelineMetric === "power" ? playerSnapshots.map((s) => s.currentPower) : playerSnapshots.map((s) => s.merits);
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
  };

  return (
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
                activeTimelineMetric === "power" ? "bg-gothic-silver text-[#111113] border-gothic-silver" : "bg-gothic-ink text-gothic-rose/60 border-gothic-silver/20"
              }`}
            >
              Power Progression
            </button>
            <button
              onClick={() => setActiveTimelineMetric("merits")}
              className={`px-3 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                activeTimelineMetric === "merits" ? "bg-gothic-silver text-[#111113] border-gothic-silver" : "bg-gothic-ink text-gothic-rose/60 border-gothic-silver/20"
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
                <path d={drawTimelinePath()} fill="none" stroke="#89A6B8" strokeWidth="3" strokeLinecap="round" />
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
  );
}