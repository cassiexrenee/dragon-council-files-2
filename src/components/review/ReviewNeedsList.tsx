import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { PlayerClassification, AccountRole } from "../../types";

interface ReviewNeedsListProps {
  needsReviewItems: PlayerClassification[];
  getPlayerName: (id: string) => string;
  getPowerStr: (id: string) => string;
  onSelectPlayer: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  resolvingPlayerId: string | null;
  setResolvingPlayerId: (id: string | null) => void;
  resolvedRole: AccountRole;
  setResolvedRole: (role: AccountRole) => void;
  resolveReason: string;
  setResolveReason: (reason: string) => void;
  handleResolveNeedsReview: (playerId: string) => void;
  playersCount: number;
}

export default function ReviewNeedsList({
  needsReviewItems,
  getPlayerName,
  getPowerStr,
  onSelectPlayer,
  onNavigateToTab,
  resolvingPlayerId,
  setResolvingPlayerId,
  resolvedRole,
  setResolvedRole,
  resolveReason,
  setResolveReason,
  handleResolveNeedsReview,
  playersCount
}: ReviewNeedsListProps) {
  return (
    <div className="space-y-4">
      {needsReviewItems.map((item) => (
        <div key={item.playerId} className="p-5 rounded-xl bg-gothic-velvet border border-amber-900/30 space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-gothic-silver flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                {getPlayerName(item.playerId)}
              </h3>
              <p className="text-xs font-mono text-gothic-rose/50 mt-1">
                ID: {item.playerId} • Power: {getPowerStr(item.playerId)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSelectPlayer(item.playerId);
                  onNavigateToTab("players");
                }}
                className="px-3 py-1.5 bg-gothic-ink hover:bg-gothic-ink/80 border border-gothic-silver/20 text-xs font-mono rounded-lg transition-all text-gothic-rose/90 cursor-pointer"
              >
                Inspect Timeline
              </button>
              <button
                onClick={() => {
                  setResolvingPlayerId(item.playerId);
                  setResolvedRole("FIGHTER");
                  setResolveReason("");
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-[#111113] text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Assign Manual Role
              </button>
            </div>
          </div>

          <div className="p-3 bg-gothic-void rounded border border-gothic-silver/20 text-xs leading-relaxed text-gothic-rose/90">
            <span className="font-semibold text-gothic-silver">Reason for Alert:</span> {item.explanation.summary}
            <div className="mt-1.5 space-y-1 text-[11px] text-gothic-rose/50">
              {item.explanation.evidence.map((ev, i) => (
                <p key={i}>• {ev}</p>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {resolvingPlayerId === item.playerId && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-lg bg-gothic-ink border border-gothic-silver/20 space-y-3"
              >
                <h4 className="text-xs font-bold text-gothic-silver uppercase font-mono">Resolve Ambiguity</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block mb-1">Assigned Operational Role</label>
                    <select
                      value={resolvedRole}
                      onChange={(e) => setResolvedRole(e.target.value as AccountRole)}
                      className="w-full bg-gothic-velvet border border-gothic-silver/20 text-xs text-gothic-silver p-2 rounded-md outline-none cursor-pointer"
                    >
                      <option value="FIGHTER">Fighter (Combat core)</option>
                      <option value="SUPPORT">Support (Alliance helps & speedups)</option>
                      <option value="FARM">Farm (Resource generation)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block mb-1">Resolution Explanation</label>
                    <input
                      type="text"
                      placeholder="e.g. Validated as active secondary fighter account..."
                      value={resolveReason}
                      onChange={(e) => setResolveReason(e.target.value)}
                      className="w-full bg-gothic-velvet border border-gothic-silver/20 text-xs text-gothic-silver p-2 rounded-md outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setResolvingPlayerId(null)}
                    className="px-3 py-1.5 bg-transparent text-gothic-rose/50 hover:text-gothic-rose/90 text-xs font-mono transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResolveNeedsReview(item.playerId)}
                    className="px-4 py-1.5 bg-gothic-silver hover:bg-opacity-90 text-[#111113] text-xs font-semibold rounded transition-all cursor-pointer"
                  >
                    Confirm & Resolve
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {needsReviewItems.length === 0 && (
        playersCount === 0 ? (
          <div className="p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
            <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-gothic-silver">No Roster Data Yet</h3>
            <p className="text-xs mt-1">Import alliance telemetry to begin automated role classification and review.</p>
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
            <h3 className="text-sm font-bold text-gothic-silver">All Profiles Classified</h3>
            <p className="text-xs mt-1">There are currently no active players with ambiguous needs-review signatures.</p>
          </div>
        )
      )}
    </div>
  );
}