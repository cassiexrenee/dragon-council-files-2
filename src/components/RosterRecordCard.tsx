import React from "react";
import { User, Shield, Award, ArrowRight } from "lucide-react";
import { Snapshot, PerformanceTier } from "../types";
import { formatWholeNumber } from "../utils/analytics";

interface RosterRecordCardProps {
  playerId: string;
  playerName: string;
  snapshot?: Snapshot;
  performanceTier?: PerformanceTier;
  onClick?: () => void;
}

export default function RosterRecordCard({
  playerId,
  playerName,
  snapshot,
  performanceTier,
  onClick
}: RosterRecordCardProps) {
  const getTierColor = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS": return "text-gothic-silver bg-gothic-silver/10 border-gothic-silver/30";
      case "MEETS": return "text-[#89A6B8] bg-[#89A6B8]/10 border-[#89A6B8]/30";
      case "BELOW": return "text-amber-300 bg-amber-500/10 border-amber-500/30";
      case "INACTIVE": return "text-red-300 bg-red-500/10 border-red-500/30";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 hover:border-gothic-silver/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-lg group"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold font-display text-gothic-silver group-hover:text-white transition-colors">{playerName}</h4>
          <span className="text-[10px] font-mono text-gothic-rose/50">ID: {playerId}</span>
        </div>
        {performanceTier && (
          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getTierColor(performanceTier)}`}>
            {performanceTier}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-2 border-t border-gothic-silver/10">
        <div>
          <span className="text-[9px] text-gothic-rose/50 uppercase block">Power</span>
          <span className="font-bold text-gothic-silver">{snapshot ? formatWholeNumber(snapshot.currentPower) : "N/A"}</span>
        </div>
        <div>
          <span className="text-[9px] text-gothic-rose/50 uppercase block">Merits</span>
          <span className="font-bold text-emerald-400">{snapshot ? formatWholeNumber(snapshot.merits) : "N/A"}</span>
        </div>
      </div>

      <div className="flex justify-end items-center text-[10px] font-mono text-gothic-rose/60 group-hover:text-gothic-silver pt-1">
        <span className="flex items-center gap-1">View Dossier <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></span>
      </div>
    </div>
  );
}