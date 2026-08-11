import React, { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { Player, Snapshot, PerformanceEvaluation, AllianceSettings } from "../types";
import { apiFetch } from "../apiConfig";
import OverviewMetricsGrid from "../components/Overview/OverviewMetricsGrid";
import OverviewAIAdvisorCard from "../components/Overview/OverviewAIAdvisorCard";
import OverviewQueueSummary from "../components/Overview/OverviewQueueSummary";
import OverviewQueueList from "../components/Overview/OverviewQueueList";

interface OverviewTabProps {
  players: Player[];
  snapshots: Snapshot[];
  evaluations: PerformanceEvaluation[];
  settings: AllianceSettings;
  onSelectPlayer: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function OverviewTab({
  players,
  snapshots,
  evaluations,
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

      <OverviewQueueSummary
        snapshots={snapshots}
        evaluations={evaluations}
      />

      <OverviewQueueList
        players={players}
        snapshots={snapshots}
        evaluations={evaluations}
        onSelectPlayer={onSelectPlayer}
        onNavigateToTab={onNavigateToTab}
      />
    </div>
  );
}