import React, { useState } from "react";
import { 
  ArrowUpDown, 
  Search, 
  Download, 
  ArrowRight,
  Users,
  CheckCircle
} from "lucide-react";
import { 
  Player, 
  Snapshot, 
  PlayerClassification, 
  PerformanceEvaluation, 
  Recommendation,
  PerformanceTier,
  AllianceSettings,
  ImportSession
} from "../types";
import { getAggregatedPlayerSnapshot, getLastActivityInfo } from "../utils/analytics";

interface RosterTabProps {
  players: Player[];
  snapshots: Snapshot[];
  classifications: PlayerClassification[];
  evaluations: PerformanceEvaluation[];
  recommendations: Recommendation[];
  importSessions?: ImportSession[];
  onSelectPlayer: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  settings?: AllianceSettings;
}

export default function RosterTab({
  players,
  snapshots,
  evaluations,
  recommendations,
  onSelectPlayer,
  onNavigateToTab,
  settings
}: RosterTabProps) {
  // Roster Tab States
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [hideUnderBaseline, setHideUnderBaseline] = useState<boolean>(true);

  // Calculate seasonal power baseline
  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 10000000;
  
  // Sorting state for Roster
  const [sortField, setSortField] = useState<"name" | "power" | "merits">("power");
  const [sortAsc, setSortAsc] = useState(false);

  // Filter players for Roster Tab
  const filteredRows = players.map((p) => {
    const playerSnaps = snapshots.filter((s) => s.playerId === p.characterId);
    const aggregatedSnap = playerSnaps.length > 0 ? getAggregatedPlayerSnapshot(playerSnaps) : null;
    const evaluation = evaluations.find((e) => e.playerId === p.characterId);
    const recommendation = recommendations.find((r) => r.playerId === p.characterId);

    return {
      player: p,
      snapshot: aggregatedSnap,
      evaluation,
      recommendation
    };
  }).filter((row) => {
    const nameMatch = row.player.currentName.toLowerCase().includes(search.toLowerCase());
    const idMatch = row.player.characterId.toLowerCase().includes(search.toLowerCase());
    const tierMatch = tierFilter === "ALL" || row.evaluation?.performanceTier === tierFilter;
    const powerMatch = !hideUnderBaseline || ((row.snapshot?.currentPower || 0) >= powerBaseline);

    return (nameMatch || idMatch) && tierMatch && powerMatch;
  });

  // Sort filtered rows
  const sortedRows = [...filteredRows].sort((a, b) => {
    let aVal: any = "";
    let bVal: any = "";

    if (sortField === "name") {
      aVal = a.player.currentName;
      bVal = b.player.currentName;
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (sortField === "power") {
      aVal = a.snapshot?.currentPower || 0;
      bVal = b.snapshot?.currentPower || 0;
    }
    if (sortField === "merits") {
      aVal = a.snapshot?.merits || 0;
      bVal = b.snapshot?.merits || 0;
    }

    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (field: "name" | "power" | "merits") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getTierBadgeStyle = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS":
        return "bg-gothic-silver/20 text-gothic-silver border-gothic-silver/40";
      case "MEETS":
        return "bg-[#89A6B8]/20 text-[#89A6B8] border-[#89A6B8]/40";
      case "BELOW":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "INACTIVE":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/40";
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

  // CSV Export
  const handleDownloadCSV = () => {
    const headers = [
      "Character Name",
      "Character ID",
      "Current Power",
      "Seasonal Merits",
      "Merit % of Power",
      "Performance Tier",
      "Action Recommendation"
    ];

    const rows = sortedRows.map((r) => [
      `"${r.player.currentName}"`,
      `"${r.player.characterId}"`,
      r.snapshot?.currentPower || 0,
      r.snapshot?.merits || 0,
      r.snapshot ? `${((r.snapshot.merits / Math.max(1, r.snapshot.currentPower)) * 100).toFixed(1)}%` : "0%",
      r.evaluation?.performanceTier || "MEETS",
      r.recommendation?.recommendation || "KEEP"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dragon_council_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header and export controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gothic-silver/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#89A6B8] uppercase tracking-widest">
            <Users size={14} /> Alliance Roster Directory
          </div>
          <h1 className="text-2xl font-display font-bold text-gothic-silver tracking-tight">
            Active Roster Ledger
          </h1>
          <p className="text-xs text-gothic-rose/70 font-mono mt-0.5">
            Registered alliance members and seasonal performance metrics.
          </p>
        </div>

        <button
          id="export-csv-btn"
          onClick={handleDownloadCSV}
          className="px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer"
        >
          <Download size={13} />
          Export Roster CSV
        </button>
      </div>

      {/* Filter and search utilities bar */}
      <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gothic-rose/50" />
          <input
            id="roster-search-input"
            type="text"
            placeholder="Search character name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-silver pl-9 pr-3 py-2 rounded-lg outline-none focus:border-[#89A6B8] font-mono transition-all"
          />
        </div>

        {/* Expectation Tier Select Filter */}
        <div>
          <select
            id="roster-tier-filter"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-rose/90 p-2 rounded-lg outline-none focus:border-[#89A6B8] font-mono"
          >
            <option value="ALL">All Categories</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BELOW">Below Expectations</option>
            <option value="MEETS">Meets Expectations</option>
            <option value="EXCEEDS">Exceeds Expectations</option>
          </select>
        </div>

        {/* Hide Under Baseline Checkbox */}
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="hide-under-baseline"
            checked={hideUnderBaseline}
            onChange={(e) => setHideUnderBaseline(e.target.checked)}
            className="accent-gothic-silver cursor-pointer"
          />
          <label htmlFor="hide-under-baseline" className="text-xs text-gothic-rose/80 font-mono cursor-pointer select-none">
            Hide Below Baseline (&lt;{(powerBaseline / 1000000).toFixed(1)}M)
          </label>
        </div>
      </div>

      {/* Main Roster Data Table */}
      <div className="rounded-xl border border-gothic-silver/20 bg-gothic-velvet overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gothic-silver/20 bg-gothic-void text-[10px] font-mono font-bold uppercase text-gothic-rose/50 tracking-wider">
                <th className="py-4 px-5">
                  <button 
                    onClick={() => toggleSort("name")} 
                    className="flex items-center gap-1.5 hover:text-gothic-silver cursor-pointer font-mono"
                  >
                    Lord Identity <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="py-4 px-4 text-right">
                  <button 
                    onClick={() => toggleSort("power")} 
                    className="flex items-center gap-1.5 hover:text-gothic-silver cursor-pointer ml-auto font-mono"
                  >
                    Current Power <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="py-4 px-4 text-right">
                  <button 
                    onClick={() => toggleSort("merits")} 
                    className="flex items-center gap-1.5 hover:text-gothic-silver cursor-pointer ml-auto font-mono"
                  >
                    Seasonal Merits <ArrowUpDown size={10} />
                  </button>
                </th>
                <th className="py-4 px-4 text-center font-mono font-semibold">Expectation Tier</th>
                <th className="py-4 px-4 text-center font-mono">Suggested Action</th>
                <th className="py-4 px-5"></th>
              </tr>
            </thead>

            {/* Table body */}
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
                  {/* Name and ID */}
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

                  {/* Power */}
                  <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-gothic-silver">
                    {row.snapshot?.currentPower.toLocaleString() || "0"}
                  </td>

                  {/* Merits */}
                  <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-gothic-rose/70">
                    <div>{row.snapshot?.merits.toLocaleString() || "0"}</div>
                    {row.snapshot && (
                      <div className="text-[10px] text-gothic-rose/50 font-mono font-normal">
                        {Math.round((row.snapshot.merits / Math.max(1, row.snapshot.currentPower)) * 100)}% Power
                      </div>
                    )}
                  </td>

                  {/* Performance tier */}
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getTierBadgeStyle(row.evaluation?.performanceTier)}`}>
                      {getTierLabel(row.evaluation?.performanceTier)}
                    </span>
                  </td>

                  {/* Recommendation action */}
                  <td className="py-3 px-4 text-center font-mono">
                    {row.recommendation ? (
                      <span className="text-[10px] uppercase tracking-wider text-gothic-silver font-semibold">
                        {row.recommendation.recommendation}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-gothic-rose/50">KEEP</span>
                    )}
                  </td>

                  {/* Action arrow */}
                  <td className="py-3 px-5 text-right">
                    <ArrowRight size={14} className="text-gothic-rose/50 group-hover:text-gothic-silver transition-all group-hover:translate-x-1" />
                  </td>
                </tr>
              ))}

              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-gothic-rose/50 font-mono">
                    {players.length === 0 ? (
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

        {/* Table footer / status tracker */}
        <div className="p-4 bg-gothic-void border-t border-gothic-silver/20 text-[10px] font-mono text-gothic-rose/50 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Displaying {sortedRows.length} of {players.length} registered alliance players</span>
          <span className="flex items-center gap-1 text-[#89A6B8]">
            <CheckCircle size={10} /> Click on any row to open full-scale intelligence timeline profiles.
          </span>
        </div>

      </div>
    </div>
  );
}
