import React, { useState } from "react";
import { LayoutDashboard } from "lucide-react";
// FIX: Added PlayerClassification and Recommendation to the import list
import { Player, Snapshot, PerformanceEvaluation, AllianceSettings, PlayerClassification, Recommendation } from "../types";
import { apiFetch } from "../apiConfig";
import OverviewMetricsGrid from "../components/overview/OverviewMetricsGrid";
import OverviewAIAdvisorCard from "../components/overview/OverviewAIAdvisorCard";
import OverviewQueueSummary from "../components/overview/OverviewQueueSummary";
import OverviewQueueList from "../components/overview/OverviewQueueList";

// FIX: Added the missing props to the interface
interface OverviewTabProps {
  players: Player[];
  snapshots: Snapshot[];
  evaluations: PerformanceEvaluation[];
  classifications: PlayerClassification[]; 
  recommendations: Recommendation[]; 
  settings: AllianceSettings;
  onSelectPlayer: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function OverviewTab({
  players,
  snapshots,
  evaluations,
  classifications, // FIX: Destructured the new props
  recommendations,
  settings,
  onSelectPlayer,
  onNavigateToTab
}: OverviewTabProps) {
  const [aiBrief, setAiBrief] = useState<string>("");
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      const res = await apiFetch("/api/ai/brief", {
        method: "POST",
        body: JSON.stringify({ players, snapshots, evaluations, settings })
      });
      if (res.ok) {
        const data = await res.json();
        setAiBrief(data.brief || data.message || "Intelligence brief generated successfully.");
      } else {
        setAiBrief("⚠️ Failed to generate AI brief from backend service. Please check API configuration.");
      }
    } catch (err) {
      setAiBrief("⚠️ Error connecting to Gemini AI service. Ensure backend leylines are active.");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // FIX: Safely extract the current season's power baseline to pass to the Summary component
  const activeSeason = settings.configuration?.activeSeason || "S3";
  const powerBaseline = settings.configuration?.seasonalPowerBaselines?.[activeSeason] || 0;

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gothic-silver/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#89A6B8] uppercase tracking-widest">
            <LayoutDashboard size={14} /> Leadership Command Hub
          </div>
          <h1 className="text-2xl font-display font-bold text-gothic-silver tracking-tight">
            Alliance Overview & Intelligence
          </h1>
          <p className="text-xs text-gothic-rose/70 font-mono mt-0.5">
            Real-time telemetry overview, automated performance metrics, and tactical AI briefs.
          </p>
        </div>
      </div>

      <OverviewMetricsGrid
        playersCount={players.length}
        snapshots={snapshots}
        evaluations={evaluations}
      />

      <OverviewAIAdvisorCard
        aiBrief={aiBrief}
        isGeneratingBrief={isGeneratingBrief}
        onGenerateBrief={handleGenerateBrief}
      />

      {/* FIX: Passed classifications, recommendations, and powerBaseline instead of evaluations */}
      <OverviewQueueSummary
        classifications={classifications}
        recommendations={recommendations}
        snapshots={snapshots}
        powerBaseline={powerBaseline}
      />

      {/* FIX: Passed classifications and recommendations instead of evaluations/players */}
      <OverviewQueueList
        classifications={classifications}
        recommendations={recommendations}
        snapshots={snapshots}
        onSelectPlayer={onSelectPlayer}
        onNavigateToTab={onNavigateToTab}
      />
    </div>
  );
}