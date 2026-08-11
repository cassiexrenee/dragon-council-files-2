import React from "react";
import { Users, Zap, ShieldAlert, Award } from "lucide-react";
import { Snapshot, PerformanceEvaluation } from "../../types";
import { formatWholeNumber } from "../../utils/analytics";

interface OverviewMetricsGridProps {
  playersCount: number;
  snapshots: Snapshot[];
  evaluations: PerformanceEvaluation[];
}

export default function OverviewMetricsGrid({
  playersCount,
  snapshots,
  evaluations
}: OverviewMetricsGridProps) {
  const totalPower = snapshots.reduce((acc, s) => acc + s.currentPower, 0);
  const avgPower = playersCount > 0 ? Math.round(totalPower / playersCount) : 0;
  const exemplaryCount = evaluations.filter(e => e.performanceTier === "EXCEEDS").length;
  const nonCompliantCount = evaluations.filter(e => e.performanceTier === "BELOW" || e.performanceTier === "INACTIVE").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1 shadow-lg">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gothic-rose/50 block">Active Roster Size</span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-display text-gothic-silver">{playersCount} Lords</span>
          <Users size={18} className="text-[#89A6B8] opacity-80" />
        </div>
        <span className="text-[10px] text-gothic-rose/50 block pt-1">Fully synchronized registry</span>
      </div>

      <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1 shadow-lg">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gothic-rose/50 block">Total Alliance Power</span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-display text-amber-300">{formatWholeNumber(totalPower)}</span>
          <Zap size={18} className="text-amber-400 opacity-80" />
        </div>
        <span className="text-[10px] text-gothic-rose/50 block pt-1">Avg: {formatWholeNumber(avgPower)} per lord</span>
      </div>

      <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1 shadow-lg">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gothic-rose/50 block">Exemplary Performers</span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-display text-[#7FA8C9]">{exemplaryCount} Lords</span>
          <Award size={18} className="text-[#7FA8C9] opacity-80" />
        </div>
        <span className="text-[10px] text-gothic-rose/50 block pt-1">Exceeding combat expectations</span>
      </div>

      <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1 shadow-lg">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gothic-rose/50 block">Compliance Alerts</span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-display text-red-400">{nonCompliantCount} Lords</span>
          <ShieldAlert size={18} className="text-red-400 opacity-80" />
        </div>
        <span className="text-[10px] text-gothic-rose/50 block pt-1">Below threshold or inactive</span>
      </div>
    </div>
  );
}