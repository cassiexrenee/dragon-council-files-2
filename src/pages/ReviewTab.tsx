import React, { useState } from "react";
import { ShieldAlert, Filter } from "lucide-react";
import { 
  Player, 
  Snapshot, 
  PlayerClassification, 
  PerformanceEvaluation, 
  Recommendation, 
  RoleOverride,
  AccountRole,
  AllianceSettings
} from "../types";
import { getAggregatedPlayerSnapshot, formatWholeNumber } from "../utils/Analytics";
import ReviewNeedsList from "../components/Review/ReviewNeedsList";
import ReviewRecommendationsList from "../components/Review/ReviewRecommendationsList";
import ReviewOverridesList from "../components/Review/ReviewOverridesList";

// FIX: Aligned prop names with App.tsx controller standard
interface ReviewTabProps {
  players: Player[];
  snapshots: Snapshot[];
  classifications: PlayerClassification[];
  evaluations: PerformanceEvaluation[];
  recommendations: Recommendation[];
  overrides: RoleOverride[];
  handleApplyOverride: (playerId: string, role: AccountRole, reason: string) => void;
  handleRemoveOverride: (playerId: string) => void;
  handleResolveRecommendation: (recommendationId: string, decision: "ACCEPTED" | "REJECTED" | "OVERRIDDEN", reason: string) => void;
  setSelectedPlayerId: (id: string) => void;
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
  handleApplyOverride, // FIX: Destructured correct name
  handleRemoveOverride, // FIX: Destructured correct name
  handleResolveRecommendation, // FIX: Destructured correct name
  setSelectedPlayerId, // FIX: Destructured correct name
  onNavigateToTab,
  settings
}: ReviewTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"needs_review" | "recommendations" | "active_overrides">("needs_review");
  const [hideUnderBaseline, setHideUnderBaseline] = useState<boolean>(true);
  
  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 10000000;

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

  const needsReviewItems = classifications.filter(c => c.role === "NEEDS_REVIEW" && !overrides.some(o => o.playerId === c.playerId) && isAboveBaseline(c.playerId));
  const pendingRecs = recommendations.filter(r => r.status === "PENDING" && r.recommendation !== "KEEP" && isAboveBaseline(r.playerId));
  const activeOverrides = overrides.filter(o => isAboveBaseline(o.playerId));

  const getPlayerName = (id: string) => players.find(p => p.characterId === id)?.currentName || "Unknown Player";
  const getPowerStr = (id: string) => {
    const s = snapshots.filter(snap => snap.playerId === id).slice(-1)[0];
    return s ? formatWholeNumber(s.currentPower) : "N/A";
  };

  const handleResolveNeedsReview = (playerId: string) => {
    if (!resolveReason.trim()) return;
    const pName = getPlayerName(playerId);
    handleApplyOverride(playerId, resolvedRole, `Resolved Needs Review: ${resolveReason.trim()}`); // FIX: Updated call
    setResolvingPlayerId(null);
    setResolveReason("");
    setReviewFeedback(`✓ Classification resolved for ${pName} (${resolvedRole}). Saved to council ledger.`);
    setTimeout(() => setReviewFeedback(null), 8000);
  };

  const handleResolveRec = (rec: Recommendation, decision: "ACCEPTED" | "REJECTED") => {
    const pName = getPlayerName(rec.playerId);
    const reasonText = recDecisionReason.trim() || `Officer reviewed and ${decision.toLowerCase()} recommendation.`;
    handleResolveRecommendation(rec.id, decision, reasonText); // FIX: Updated call
    setReviewingRecId(null);
    setRecDecisionReason("");
    setReviewFeedback(`✓ Recommendation ${decision.toLowerCase()} for ${pName}. Audit log updated.`);
    setTimeout(() => setReviewFeedback(null), 8000);
  };

  return (
    <div className="space-y-6">
      {reviewFeedback && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>{reviewFeedback}</span>
          <button onClick={() => setReviewFeedback(null)} className="text-emerald-400/60 hover:text-emerald-200 cursor-pointer">✕</button>
        </div>
      )}

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

      <div className="space-y-4">
        {activeSubTab === "needs_review" && (
          <ReviewNeedsList
            needsReviewItems={needsReviewItems}
            getPlayerName={getPlayerName}
            getPowerStr={getPowerStr}
            onSelectPlayer={setSelectedPlayerId} // FIX: Updated mapping
            onNavigateToTab={onNavigateToTab}
            resolvingPlayerId={resolvingPlayerId}
            setResolvingPlayerId={setResolvingPlayerId}
            resolvedRole={resolvedRole}
            setResolvedRole={setResolvedRole}
            resolveReason={resolveReason}
            setResolveReason={setResolveReason}
            handleResolveNeedsReview={handleResolveNeedsReview}
            playersCount={players.length}
          />
        )}

        {activeSubTab === "recommendations" && (
          <ReviewRecommendationsList
            pendingRecs={pendingRecs}
            classifications={classifications}
            snapshots={snapshots}
            getPlayerName={getPlayerName}
            getPowerStr={getPowerStr}
            onSelectPlayer={setSelectedPlayerId} // FIX: Updated mapping
            onNavigateToTab={onNavigateToTab}
            reviewingRecId={reviewingRecId}
            setReviewingRecId={setReviewingRecId}
            recDecisionReason={recDecisionReason}
            setRecDecisionReason={setRecDecisionReason}
            handleResolveRec={handleResolveRec}
            playersCount={players.length}
          />
        )}

        {activeSubTab === "active_overrides" && (
          <ReviewOverridesList
            activeOverrides={activeOverrides}
            getPlayerName={getPlayerName}
            getPowerStr={getPowerStr}
            onRemoveOverride={handleRemoveOverride} // FIX: Updated mapping
            onNavigateToTab={onNavigateToTab}
            playersCount={players.length}
          />
        )}
      </div>
    </div>
  );
}