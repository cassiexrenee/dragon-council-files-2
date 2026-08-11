import React from "react";
import { Download, ShieldAlert, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { PlayerClassification, Recommendation, Snapshot } from "../../types";
import { formatWholeNumber } from "../../utils/Analytics";

interface OverviewQueueSummaryProps {
  classifications: PlayerClassification[];
  recommendations: Recommendation[];
  snapshots: Snapshot[];
  powerBaseline: number;
}

export default function OverviewQueueSummary({
  classifications,
  recommendations,
  snapshots,
  powerBaseline
}: OverviewQueueSummaryProps) {
  const needsReviewCount = classifications.filter((c) => c.role === "NEEDS_REVIEW").length;
  const pendingRecsCount = recommendations.filter((r) => r.status === "PENDING" && r.recommendation !== "KEEP").length;
  const removeRecsCount = recommendations.filter((r) => r.status === "PENDING" && r.recommendation === "REMOVE").length;
  const monitorRecsCount = recommendations.filter((r) => r.status === "PENDING" && r.recommendation === "MONITOR").length;

  const handleExportQueueCSV = () => {
    const headers = ["Player ID", "Recommendation", "Status", "Summary Reason"];
    const rows = recommendations.map((r) => [
      `"${r.playerId}"`,
      `"${r.recommendation}"`,
      `"${r.status}"`,
      `"${r.reason.summary.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `alliance_decision_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 font-mono shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gothic-silver/20 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-amber-400" />
          <h3 className="text-sm font-bold text-gothic-silver uppercase tracking-wider font-display">
            Decision Queue Summary
          </h3>
        </div>
        <button
          onClick={handleExportQueueCSV}
          className="px-3 py-1.5 bg-gothic-ink hover:bg-gothic-void border border-gothic-silver/20 text-xs text-gothic-silver rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download size={13} /> Export Decision Queue CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-gothic-ink border border-gothic-silver/10 rounded-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-gothic-rose/50 block">Needs Review</span>
          <span className="text-lg font-bold text-amber-400">{needsReviewCount}</span>
        </div>

        <div className="p-3 bg-gothic-ink border border-gothic-silver/10 rounded-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-gothic-rose/50 block">Pending Advisory</span>
          <span className="text-lg font-bold text-gothic-silver">{pendingRecsCount}</span>
        </div>

        <div className="p-3 bg-gothic-ink border border-gothic-silver/10 rounded-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-gothic-rose/50 block">Removal Candidates</span>
          <span className="text-lg font-bold text-red-400">{removeRecsCount}</span>
        </div>

        <div className="p-3 bg-gothic-ink border border-gothic-silver/10 rounded-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-gothic-rose/50 block">Active Watchlist</span>
          <span className="text-lg font-bold text-cyan-400">{monitorRecsCount}</span>
        </div>
      </div>
    </div>
  );
}