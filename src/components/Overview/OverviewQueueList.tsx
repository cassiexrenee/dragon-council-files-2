import React, { useState } from "react";
import { ArrowRight, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { PlayerClassification, Recommendation, Snapshot, Player } from "../../types";
import { formatWholeNumber } from "../../utils/Analytics";

interface OverviewQueueListProps {
  classifications: PlayerClassification[];
  recommendations: Recommendation[];
  snapshots: Snapshot[];
  onSelectPlayer?: (playerId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function OverviewQueueList({
  classifications,
  recommendations,
  snapshots,
  onSelectPlayer,
  onNavigateToTab
}: OverviewQueueListProps) {
  const [queueFilter, setQueueFilter] = useState<"ALL" | "NEEDS_REVIEW" | "ACTION_REQUIRED">("ALL");

  const pendingRecs = recommendations.filter((r) => r.status === "PENDING" && r.recommendation !== "KEEP");
  const needsReviewItems = classifications.filter((c) => c.role === "NEEDS_REVIEW");

  const getPlayerPowerStr = (playerId: string) => {
    const pSnaps = snapshots.filter((s) => s.playerId === playerId);
    if (pSnaps.length === 0) return "N/A";
    const latest = pSnaps[pSnaps.length - 1];
    return formatWholeNumber(latest.currentPower);
  };

  return (
    <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 font-mono shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gothic-silver/20 pb-3">
        <h3 className="text-sm font-bold text-gothic-silver uppercase tracking-wider font-display flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#89A6B8]" />
          Priority Leadership Action Items
        </h3>
        <div className="flex items-center gap-1 bg-gothic-ink p-1 rounded-lg border border-gothic-silver/10 text-xs">
          <button
            onClick={() => setQueueFilter("ALL")}
            className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
              queueFilter === "ALL" ? "bg-gothic-velvet text-gothic-silver font-bold" : "text-gothic-rose/50 hover:text-gothic-rose/90"
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setQueueFilter("NEEDS_REVIEW")}
            className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
              queueFilter === "NEEDS_REVIEW" ? "bg-gothic-velvet text-amber-400 font-bold" : "text-gothic-rose/50 hover:text-gothic-rose/90"
            }`}
          >
            Needs Review ({needsReviewItems.length})
          </button>
          <button
            onClick={() => setQueueFilter("ACTION_REQUIRED")}
            className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
              queueFilter === "ACTION_REQUIRED" ? "bg-gothic-velvet text-red-400 font-bold" : "text-gothic-rose/50 hover:text-gothic-rose/90"
            }`}
          >
            Action Required ({pendingRecs.length})
          </button>
        </div>
      </div>

      <div className="space-y-2.5 text-xs">
        {(queueFilter === "ALL" || queueFilter === "NEEDS_REVIEW") &&
          needsReviewItems.map((item) => (
            <div
              key={item.playerId}
              onClick={() => {
                if (onSelectPlayer) onSelectPlayer(item.playerId);
                if (onNavigateToTab) onNavigateToTab("review");
              }}
              className="p-3 bg-gothic-ink hover:bg-gothic-void border border-amber-500/20 hover:border-amber-500/40 rounded-lg flex items-center justify-between gap-3 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-gothic-silver block">{item.playerId}</span>
                  <span className="text-[10px] text-gothic-rose/50">
                    Role Ambiguity • Power: {getPlayerPowerStr(item.playerId)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  NEEDS REVIEW
                </span>
                <ArrowRight size={14} className="text-gothic-rose/40 group-hover:text-gothic-silver transition-all group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}

        {(queueFilter === "ALL" || queueFilter === "ACTION_REQUIRED") &&
          pendingRecs.map((rec) => (
            <div
              key={rec.id}
              onClick={() => {
                if (onSelectPlayer) onSelectPlayer(rec.playerId);
                if (onNavigateToTab) onNavigateToTab("review");
              }}
              className="p-3 bg-gothic-ink hover:bg-gothic-void border border-gothic-silver/10 hover:border-gothic-silver/30 rounded-lg flex items-center justify-between gap-3 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={15} className="text-red-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-gothic-silver block">{rec.playerId}</span>
                  <span className="text-[10px] text-gothic-rose/50 truncate max-w-md block">
                    {rec.reason.summary}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                    rec.recommendation === "REMOVE"
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  }`}
                >
                  {rec.recommendation}
                </span>
                <ArrowRight size={14} className="text-gothic-rose/40 group-hover:text-gothic-silver transition-all group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}

        {needsReviewItems.length === 0 && pendingRecs.length === 0 && (
          <div className="p-8 text-center text-gothic-rose/50 font-mono text-xs">
            <CheckCircle size={28} className="mx-auto text-emerald-500/60 mb-2" />
            No priority decision items currently pending in leadership queue.
          </div>
        )}
      </div>
    </div>
  );
}