import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Recommendation, PlayerClassification, Snapshot, RecommendationType } from "../../types";
import { getLastActivityInfo } from "../../utils/analytics";

interface ReviewRecommendationsListProps {
  pendingRecs: Recommendation[];
  classifications: PlayerClassification[];
  snapshots: Snapshot[];
  getPlayerName: (id: string) => string;
  getPowerStr: (id: string) => string;
  onSelectPlayer: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  reviewingRecId: string | null;
  setReviewingRecId: (id: string | null) => void;
  recDecisionReason: string;
  setRecDecisionReason: (reason: string) => void;
  handleResolveRec: (rec: Recommendation, decision: "ACCEPTED" | "REJECTED") => void;
  playersCount: number;
}

export default function ReviewRecommendationsList({
  pendingRecs,
  classifications,
  snapshots,
  getPlayerName,
  getPowerStr,
  onSelectPlayer,
  onNavigateToTab,
  reviewingRecId,
  setReviewingRecId,
  recDecisionReason,
  setRecDecisionReason,
  handleResolveRec,
  playersCount
}: ReviewRecommendationsListProps) {
  const getRecBadgeClass = (rc: RecommendationType) => {
    switch(rc) {
      case "REMOVE": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "MONITOR": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "SUPPORT": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
      default: return "text-gothic-silver bg-gothic-silver/10 border-gothic-silver/20";
    }
  };

  return (
    <div className="space-y-4">
      {pendingRecs.map((rec) => {
        const classRec = classifications.find(c => c.id === rec.classificationId);
        const playerSnaps = snapshots.filter(s => s.playerId === rec.playerId);
        const actInfo = getLastActivityInfo(playerSnaps);

        return (
          <div key={rec.id} className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gothic-silver">{getPlayerName(rec.playerId)}</h3>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getRecBadgeClass(rec.recommendation)}`}>
                    RECOMMENDED: {rec.recommendation}
                  </span>
                </div>
                <p className="text-xs font-mono text-gothic-rose/50 mt-1 flex items-center gap-2 flex-wrap">
                  <span>ID: {rec.playerId} • Power: {getPowerStr(rec.playerId)} • Role: {classRec?.role}</span>
                  <span className="text-[10px] text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                    Last active: {actInfo.summary}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSelectPlayer(rec.playerId);
                    onNavigateToTab("players");
                  }}
                  className="px-3 py-1.5 bg-gothic-ink hover:bg-gothic-ink/80 border border-gothic-silver/20 text-xs font-mono rounded-lg transition-all text-gothic-rose/90 cursor-pointer"
                >
                  Inspect details
                </button>
                <button
                  onClick={() => {
                    setReviewingRecId(rec.id);
                    setRecDecisionReason("");
                  }}
                  className="px-3 py-1.5 bg-gothic-silver hover:bg-opacity-90 text-[#111113] text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Take Action
                </button>
              </div>
            </div>

            <div className="p-3 bg-gothic-void rounded border border-gothic-silver/20 space-y-2">
              <p className="text-xs text-gothic-rose/90 leading-relaxed font-semibold">"{rec.reason.summary}"</p>
              <div className="flex flex-wrap gap-2">
                {rec.reason.drivers.map((drv, i) => (
                  <span key={i} className="text-[10px] font-mono bg-gothic-ink px-2 py-0.5 rounded text-gothic-rose/50 border border-gothic-silver/20">
                    {drv}
                  </span>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {reviewingRecId === rec.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-lg bg-gothic-ink border border-gothic-silver/20 space-y-3"
                >
                  <h4 className="text-xs font-bold text-gothic-silver uppercase font-mono">Resolve Advisory Recommendation</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block mb-1">Decision Note / Override Rationale</label>
                    <input
                      type="text"
                      placeholder="e.g. Approved. Player transferred to secondary squad..."
                      value={recDecisionReason}
                      onChange={(e) => setRecDecisionReason(e.target.value)}
                      className="w-full bg-gothic-velvet border border-gothic-silver/20 text-xs text-gothic-silver p-2 rounded-md outline-none font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setReviewingRecId(null)}
                      className="px-3 py-1.5 bg-transparent text-gothic-rose/50 hover:text-gothic-rose/90 text-xs font-mono transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleResolveRec(rec, "REJECTED")}
                      className="px-4 py-1.5 bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/30 text-xs font-semibold rounded transition-all cursor-pointer"
                    >
                      Decline Advisory
                    </button>
                    <button
                      onClick={() => handleResolveRec(rec, "ACCEPTED")}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-all cursor-pointer"
                    >
                      Accept Advice
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {pendingRecs.length === 0 && (
        playersCount === 0 ? (
          <div className="p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
            <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-gothic-silver">No Roster Data Yet</h3>
            <p className="text-xs mt-1">Import alliance telemetry to begin generating strategic advisory recommendations.</p>
            <button
              onClick={() => onNavigateToTab("imports")}
              className="mt-4 px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              Go to Import Manager
            </button>
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
            <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-gothic-silver">Advisory Queue Empty</h3>
            <p className="text-xs mt-1">There are no pending alerts for underperforming roster positions.</p>
          </div>
        )
      )}
    </div>
  );
}