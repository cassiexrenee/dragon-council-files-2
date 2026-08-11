import React from "react";
import { ArrowUpDown, ArrowRight, CheckCircle } from "lucide-react";
import { Snapshot, PerformanceTier } from "../../types";
import { getLastActivityInfo } from "../../utils/Analytics";

interface RosterTableProps {
  sortedRows: Array<{
    player: { characterId: string; currentName: string };
    snapshot: Snapshot | null;
    evaluation: any;
    recommendation: any;
  }>;
  snapshots: Snapshot[];
  toggleSort: (field: "name" | "power" | "merits") => void;
  onSelectPlayer: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  playersCount: number;
}

export default function RosterTable({
  sortedRows,
  snapshots,
  toggleSort,
  onSelectPlayer,
  onNavigateToTab,
  playersCount
}: RosterTableProps) {
  const getTierBadgeStyle = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS": return "bg-gothic-silver/20 text-gothic-silver border-gothic-silver/40";
      case "MEETS": return "bg-[#89A6B8]/20 text-[#89A6B8] border-[#89A6B8]/40";
      case "BELOW": return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "INACTIVE": return "bg-red-500/20 text-red-300 border-red-500/40";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/40";
    }
  };

  const getTierLabel = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS": return "Exceeds Expectations";
      case "MEETS": return "Meets Expectations";
      case "BELOW": return "Below Expectations";
      case "INACTIVE": return "Inactive";
      default: return "Meets Expectations";
    }
  };

  return (
    <div className="rounded-xl border border-gothic-silver/20 bg-gothic-velvet overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gothic-silver/20 bg-gothic-void text-[10px] font-mono font-bold uppercase text-gothic-rose/50 tracking-wider">
              <th className="py-4 px-5">
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 hover:text-gothic-silver cursor-pointer font-mono">
                  Lord Identity <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="py-4 px-4 text-right">
                <button onClick={() => toggleSort("power")} className="flex items-center gap-1.5 hover:text-gothic-silver cursor-pointer ml-auto font-mono">
                  Current Power <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="py-4 px-4 text-right">
                <button onClick={() => toggleSort("merits")} className="flex items-center gap-1.5 hover:text-gothic-silver cursor-pointer ml-auto font-mono">
                  Seasonal Merits <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="py-4 px-4 text-center font-mono font-semibold">Expectation Tier</th>
              <th className="py-4 px-4 text-center font-mono">Suggested Action</th>
              <th className="py-4 px-5"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#232328]">
            {sortedRows.map((row) => (
              <tr
                key={row.player.characterId}
                onClick={() => {
                  onSelectPlayer(row.player.characterId);
                  onNavigateToTab("players");
                }}
                className="hover:bg-gothic-ink/40 transition-all cursor-pointer text-xs text-gothic-rose/90 group"
              >
                <td className="py-3 px-5 font-mono">
                  <div className="font-display font-bold tracking-wider text-gothic-silver group-hover:text-white transition-all text-sm">
                    {row.player.currentName}
                  </div>
                  <div className="text-[10px] text-gothic-rose/50 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{row.player.characterId}</span>
                    {(() => {
                      const pSnaps = snapshots.filter(s => s.playerId === row.player.characterId);
                      const actInfo = getLastActivityInfo(pSnaps);
                      if (actInfo.isInactive) {
                        return (
                          <span className="text-[9px] text-red-300 bg-red-500/20 px-1.5 py-0.2 rounded border border-red-500/30">
                            Last active: {actInfo.daysAgo === 0 ? "Today" : `${actInfo.daysAgo}d ago`}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </td>

                <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-gothic-silver">
                  {row.snapshot?.currentPower.toLocaleString() || "0"}
                </td>

                <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-gothic-rose/70">
                  <div>{row.snapshot?.merits.toLocaleString() || "0"}</div>
                  {row.snapshot && (
                    <div className="text-[10px] text-gothic-rose/50 font-mono font-normal">
                      {Math.round((row.snapshot.merits / Math.max(1, row.snapshot.currentPower)) * 100)}% Power
                    </div>
                  )}
                </td>

                <td className="py-3 px-4 text-center">
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getTierBadgeStyle(row.evaluation?.performanceTier)}`}>
                    {getTierLabel(row.evaluation?.performanceTier)}
                  </span>
                </td>

                <td className="py-3 px-4 text-center font-mono">
                  <span className="text-[10px] uppercase tracking-wider text-gothic-silver font-semibold">
                    {row.recommendation?.recommendation || "KEEP"}
                  </span>
                </td>

                <td className="py-3 px-5 text-right">
                  <ArrowRight size={14} className="text-gothic-rose/50 group-hover:text-gothic-silver transition-all group-hover:translate-x-1" />
                </td>
              </tr>
            ))}

            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-gothic-rose/50 font-mono">
                  {playersCount === 0 ? (
                    <div className="space-y-3">
                      <p>No alliance roster has been imported yet.</p>
                      <button
                        onClick={() => onNavigateToTab("imports")}
                        className="px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
                      >
                        Go to Import Manager
                      </button>
                    </div>
                  ) : (
                    "No character telemetry meets current filtering baselines."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-gothic-void border-t border-gothic-silver/20 text-[10px] font-mono text-gothic-rose/50 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>Displaying {sortedRows.length} of {playersCount} registered alliance players</span>
        <span className="flex items-center gap-1 text-[#89A6B8]">
          <CheckCircle size={10} /> Click on any row to open full-scale intelligence timeline profiles.
        </span>
      </div>
    </div>
  );
}