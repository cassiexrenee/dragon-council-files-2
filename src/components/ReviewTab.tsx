import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertTriangle, 
  CheckCircle, 
  UserCheck, 
  Sparkles, 
  Bookmark, 
  Trash2, 
  CheckSquare, 
  ShieldAlert, 
  ChevronRight,
  Info,
  Filter
} from "lucide-react";
import { 
  Player, 
  Snapshot, 
  PlayerClassification, 
  PerformanceEvaluation, 
  Recommendation, 
  RoleOverride,
  AccountRole,
  RecommendationType,
  AllianceSettings
} from "../types";
import { getAggregatedPlayerSnapshot, getLastActivityInfo, formatWholeNumber } from "../utils/analytics";

interface ReviewTabProps {
  players: Player[];
  snapshots: Snapshot[];
  classifications: PlayerClassification[];
  evaluations: PerformanceEvaluation[];
  recommendations: Recommendation[];
  overrides: RoleOverride[];
  onApplyOverride: (playerId: string, role: AccountRole, reason: string) => void;
  onRemoveOverride: (playerId: string) => void;
  onResolveRecommendation: (recommendationId: string, decision: "ACCEPTED" | "REJECTED" | "OVERRIDDEN", reason: string) => void;
  onSelectPlayer: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  settings?: AllianceSettings;
}

export default function ReviewTab({
  players,
  snapshots,
  classifications,
  evaluations,
  recommendations,
  overrides,
  onApplyOverride,
  onRemoveOverride,
  onResolveRecommendation,
  onSelectPlayer,
  onNavigateToTab,
  settings
}: ReviewTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"needs_review" | "recommendations" | "active_overrides">("needs_review");
  const [hideUnderBaseline, setHideUnderBaseline] = useState<boolean>(true);
  
  // Calculate seasonal power baseline
  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 10000000;

  // Local state for resolve flow
  const [resolvingPlayerId, setResolvingPlayerId] = useState<string | null>(null);
  const [resolvedRole, setResolvedRole] = useState<AccountRole>("FIGHTER");
  const [resolveReason, setResolveReason] = useState("");

  const [reviewingRecId, setReviewingRecId] = useState<string | null>(null);
  const [recDecisionReason, setRecDecisionReason] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const isAboveBaseline = (playerId: string) => {
    if (!hideUnderBaseline) return true;
    const playerSnaps = snapshots.filter((s) => s.playerId === playerId);
    if (playerSnaps.length === 0) return true;
    const aggregated = getAggregatedPlayerSnapshot(playerSnaps);
    return aggregated.currentPower >= powerBaseline;
  };

  // Lists:
  // 1. Needs review: autoRole or effectiveRole is NEEDS_REVIEW and no override is present
  const needsReviewItems = classifications.filter(c => c.role === "NEEDS_REVIEW" && !overrides.some(o => o.playerId === c.playerId) && isAboveBaseline(c.playerId));

  // 2. Recommendations: pending recommendations or monitor/support/remove action
  const pendingRecs = recommendations.filter(r => r.status === "PENDING" && r.recommendation !== "KEEP" && isAboveBaseline(r.playerId));

  // 3. Active overrides
  const activeOverrides = overrides.filter(o => isAboveBaseline(o.playerId));

  // Helpers
  const getPlayerName = (id: string) => {
    return players.find(p => p.characterId === id)?.currentName || "Unknown Player";
  };

  const getPowerStr = (id: string) => {
    const s = snapshots.filter(snap => snap.playerId === id).slice(-1)[0];
    return s ? formatWholeNumber(s.currentPower) : "N/A";
  };

  const handleResolveNeedsReview = (playerId: string) => {
    if (!resolveReason.trim()) return;
    const pName = getPlayerName(playerId);
    onApplyOverride(playerId, resolvedRole, `Resolved Needs Review: ${resolveReason.trim()}`);
    setResolvingPlayerId(null);
    setResolveReason("");
    setReviewFeedback(`✓ Classification resolved for ${pName} (${resolvedRole}). Saved to council ledger.`);
    setTimeout(() => setReviewFeedback(null), 8000);
  };

  const handleResolveRec = (rec: Recommendation, decision: "ACCEPTED" | "REJECTED") => {
    const pName = getPlayerName(rec.playerId);
    const reasonText = recDecisionReason.trim() || `Officer reviewed and ${decision.toLowerCase()} recommendation.`;
    onResolveRecommendation(rec.id, decision, reasonText);
    setReviewingRecId(null);
    setRecDecisionReason("");
    setReviewFeedback(`✓ Recommendation ${decision.toLowerCase()} for ${pName}. Audit log updated.`);
    setTimeout(() => setReviewFeedback(null), 8000);
  };

  return (
    <div className="space-y-6">
      {reviewFeedback && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg animate-fade-in">
          <span>{reviewFeedback}</span>
          <button onClick={() => setReviewFeedback(null)} className="text-emerald-400/60 hover:text-emerald-200 cursor-pointer">✕</button>
        </div>
      )}
      {/* Title */}
      <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gothic-silver font-display flex items-center gap-2">
            <ShieldAlert size={18} className="text-gothic-silver" />
            Officer Focus & Review Center
          </h2>
          <p className="text-xs text-gothic-rose/50 mt-1">
            Bridge the gap between algorithmic model suggestions and manual officer institutional knowledge.
          </p>
        </div>
        <div>
          <button
            id="review-baseline-filter-btn"
            onClick={() => setHideUnderBaseline(!hideUnderBaseline)}
            className={`py-1.5 px-3 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              hideUnderBaseline
                ? "bg-[#8B0000]/20 text-red-300 border-[#8B0000]/50 hover:bg-[#8B0000]/30"
                : "bg-gothic-ink text-gothic-rose/50 border-gothic-silver/20 hover:text-gothic-silver"
            }`}
          >
            <Filter size={12} />
            {hideUnderBaseline ? `Baseline Filter (≥ ${formatWholeNumber(powerBaseline)})` : `Show All Powers`}
          </button>
        </div>
      </div>

      {/* Focus Area Tabs */}
      <div className="flex border-b border-gothic-silver/20 gap-1 bg-gothic-void p-1 rounded-lg max-w-fit border">
        {[
          { id: "needs_review", label: `Needs Review (${needsReviewItems.length})`, color: "text-amber-400" },
          { id: "recommendations", label: `Strategic Advisory Queue (${pendingRecs.length})`, color: "text-gothic-silver" },
          { id: "active_overrides", label: `Active Overrides (${activeOverrides.length})`, color: "text-indigo-400" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setResolvingPlayerId(null);
              setReviewingRecId(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? "bg-gothic-velvet border border-gothic-silver/20 text-gothic-silver"
                : "text-gothic-rose/50 hover:text-gothic-rose/90"
            }`}
          >
            <span className={activeSubTab === tab.id ? tab.color : ""}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Sub-Tab View */}
      <div className="space-y-4">
        {activeSubTab === "needs_review" && (
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
                      id={`inspect-nr-btn-${item.playerId}`}
                      onClick={() => {
                        onSelectPlayer(item.playerId);
                        onNavigateToTab("players");
                      }}
                      className="px-3 py-1.5 bg-gothic-ink hover:bg-gothic-ink/80 border border-gothic-silver/20 text-xs font-mono rounded-lg transition-all text-gothic-rose/90 cursor-pointer"
                    >
                      Inspect Timeline
                    </button>
                    <button
                      id={`resolve-nr-btn-${item.playerId}`}
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

                {/* Inline Resolve Form */}
                <AnimatePresence>
                  {resolvingPlayerId === item.playerId && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-lg bg-gothic-ink border border-gothic-silver/20 space-y-3"
                    >
                      <h4 className="text-xs font-bold text-gothic-silver uppercase font-mono text-gothic-silver">Resolve Ambiguity</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block mb-1">Assigned Operational Role</label>
                          <select
                            id="resolve-role-select"
                            value={resolvedRole}
                            onChange={(e) => setResolvedRole(e.target.value as AccountRole)}
                            className="w-full bg-gothic-velvet border border-gothic-silver/20 text-xs text-gothic-silver p-2 rounded-md outline-none"
                          >
                            <option value="FIGHTER">Fighter (Combat core)</option>
                            <option value="SUPPORT">Support (Alliance helps & speedups)</option>
                            <option value="FARM">Farm (Resource generation)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block mb-1">Resolution Explanation</label>
                          <input
                            id="resolve-reason-input"
                            type="text"
                            placeholder="e.g. Validated as active secondary fighter account..."
                            value={resolveReason}
                            onChange={(e) => setResolveReason(e.target.value)}
                            className="w-full bg-gothic-velvet border border-gothic-silver/20 text-xs text-gothic-silver p-2 rounded-md outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          id="cancel-resolve-btn"
                          onClick={() => setResolvingPlayerId(null)}
                          className="px-3 py-1.5 bg-transparent text-gothic-rose/50 hover:text-gothic-rose/90 text-xs font-mono transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          id="confirm-resolve-btn"
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
              players.length === 0 ? (
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
        )}

        {activeSubTab === "recommendations" && (
          <div className="space-y-4">
            {pendingRecs.map((rec) => {
              const evalRec = evaluations.find(e => e.id === rec.evaluationId);
              const classRec = classifications.find(c => c.id === rec.classificationId);
              const playerSnaps = snapshots.filter(s => s.playerId === rec.playerId);
              const actInfo = getLastActivityInfo(playerSnaps);
              
              const getRecBadgeClass = (rc: RecommendationType) => {
                switch(rc) {
                  case "REMOVE": return "text-red-400 bg-red-500/10 border-red-500/20";
                  case "MONITOR": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  case "SUPPORT": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                  default: return "text-gothic-silver bg-gothic-silver/10 border-gothic-silver/20";
                }
              };

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
                        id={`inspect-rec-btn-${rec.id}`}
                        onClick={() => {
                          onSelectPlayer(rec.playerId);
                          onNavigateToTab("players");
                        }}
                        className="px-3 py-1.5 bg-gothic-ink hover:bg-gothic-ink/80 border border-gothic-silver/20 text-xs font-mono rounded-lg transition-all text-gothic-rose/90 cursor-pointer"
                      >
                        Inspect details
                      </button>
                      <button
                        id={`accept-rec-btn-${rec.id}`}
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

                  {/* Inline Rec Resolve Form */}
                  <AnimatePresence>
                    {reviewingRecId === rec.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-lg bg-gothic-ink border border-gothic-silver/20 space-y-3"
                      >
                        <h4 className="text-xs font-bold text-gothic-silver uppercase font-mono text-gothic-silver">Resolve Advisory Recommendation</h4>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block mb-1">Decision Note / Override Rationale</label>
                          <input
                            id="rec-resolve-reason-input"
                            type="text"
                            placeholder="e.g. Approved. Player transferred to secondary squad or monitoring streak..."
                            value={recDecisionReason}
                            onChange={(e) => setRecDecisionReason(e.target.value)}
                            className="w-full bg-gothic-velvet border border-gothic-silver/20 text-xs text-gothic-silver p-2 rounded-md outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            id="cancel-rec-btn"
                            onClick={() => setReviewingRecId(null)}
                            className="px-3 py-1.5 bg-transparent text-gothic-rose/50 hover:text-gothic-rose/90 text-xs font-mono transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            id="reject-rec-btn"
                            onClick={() => handleResolveRec(rec, "REJECTED")}
                            className="px-4 py-1.5 bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/30 text-xs font-semibold rounded transition-all cursor-pointer"
                          >
                            Decline Advisory
                          </button>
                          <button
                            id="accept-rec-submit"
                            onClick={() => handleResolveRec(rec, "ACCEPTED")}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-gothic-silver text-xs font-semibold rounded transition-all cursor-pointer"
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
              players.length === 0 ? (
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
                  <p className="text-xs mt-1">There are no pending alerts for underperforming Fighter or Support roster positions.</p>
                </div>
              )
            )}
          </div>
        )}

        {activeSubTab === "active_overrides" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOverrides.map((ovr) => (
              <div key={ovr.playerId} className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-gothic-silver">{getPlayerName(ovr.playerId)}</h3>
                      <p className="text-[10px] font-mono text-gothic-rose/50 mt-0.5">ID: {ovr.playerId} • Power: {getPowerStr(ovr.playerId)}</p>
                    </div>
                    <span className="text-xs font-mono font-bold uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      {ovr.role}
                    </span>
                  </div>

                  <p className="text-xs text-gothic-rose/90 bg-gothic-void p-3 rounded border border-gothic-silver/20 italic leading-relaxed">
                    "{ovr.reason}"
                  </p>
                </div>

                <div className="border-t border-gothic-silver/20 pt-3 flex justify-between items-center text-[10px] text-gothic-rose/50 font-mono">
                  <span>Logged: {new Date(ovr.createdAt).toLocaleDateString()}</span>
                  <button
                    id={`revoke-override-btn-${ovr.playerId}`}
                    onClick={() => onRemoveOverride(ovr.playerId)}
                    className="text-red-400 hover:text-red-300 font-bold hover:underline transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={10} /> Revoke Override
                  </button>
                </div>
              </div>
            ))}

            {activeOverrides.length === 0 && (
              players.length === 0 ? (
                <div className="col-span-2 p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
                  <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3 opacity-60" />
                  <h3 className="text-sm font-bold text-gothic-silver">No Roster Data Yet</h3>
                  <p className="text-xs mt-1">Manual role overrides will appear here once an alliance roster has been imported.</p>
                  <button
                    onClick={() => onNavigateToTab("imports")}
                    className="mt-4 px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
                  >
                    Go to Import Manager
                  </button>
                </div>
              ) : (
                <div className="col-span-2 p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
                  <Info size={40} className="mx-auto text-[#89A6B8] mb-3 opacity-60" />
                  <h3 className="text-sm font-bold text-gothic-silver">No Active Overrides</h3>
                  <p className="text-xs mt-1">All roster classification outputs are handled entirely by automated analytics.</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
