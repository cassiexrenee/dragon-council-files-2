import React from "react";
import { Search, Filter } from "lucide-react";
import { Player, Snapshot, PerformanceEvaluation, PerformanceTier } from "../../types";
import { formatWholeNumber } from "../../utils/analytics";

interface PlayerDirectorySidebarProps {
  filteredPlayers: Player[];
  activePlayer: Player | null;
  onSelectPlayer: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  tierFilter: string;
  setTierFilter: (t: string) => void;
  hideUnderBaseline: boolean;
  setHideUnderBaseline: (hide: boolean) => void;
  powerBaseline: number;
  evaluations: PerformanceEvaluation[];
  snapshots: Snapshot[];
}

export default function PlayerDirectorySidebar({
  filteredPlayers,
  activePlayer,
  onSelectPlayer,
  searchQuery,
  setSearchQuery,
  tierFilter,
  setTierFilter,
  hideUnderBaseline,
  setHideUnderBaseline,
  powerBaseline,
  evaluations,
  snapshots
}: PlayerDirectorySidebarProps) {
  const getTierColor = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS": return "text-gothic-silver bg-gothic-silver/10 border-gothic-silver/20";
      case "MEETS": return "text-[#89A6B8] bg-[#89A6B8]/10 border-[#89A6B8]/20";
      case "BELOW": return "text-amber-300 bg-amber-500/10 border-amber-500/20";
      case "INACTIVE": return "text-red-300 bg-red-500/10 border-red-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getTierLabel = (tier?: PerformanceTier) => {
    switch (tier) {
      case "EXCEEDS": return "Exceeds";
      case "MEETS": return "Meets";
      case "BELOW": return "Below";
      case "INACTIVE": return "Inactive";
      default: return "Meets";
    }
  };

  return (
    <div className="lg:col-span-1 p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 h-fit max-h-[85vh] flex flex-col shadow-xl">
      <div className="border-b border-gothic-silver/20 pb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider text-gothic-silver uppercase font-mono">
          Lord Directory ({filteredPlayers.length})
        </h2>
        <span className="text-[10px] text-gothic-rose/50 font-mono">Alphabetical</span>
      </div>
      
      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gothic-rose/50" />
        <input
          id="player-search-input"
          type="text"
          placeholder="Search Lord name / ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-silver pl-9 pr-3 py-2 rounded-lg outline-none focus:border-[#89A6B8] font-mono transition-all"
        />
      </div>

      {/* Quick filters */}
      <div className="grid grid-cols-1 gap-2">
        <select
          id="sidebar-tier-filter"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="bg-gothic-ink border border-gothic-silver/20 text-[10px] text-gothic-rose/90 p-2 rounded-lg outline-none focus:border-[#89A6B8] font-mono cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BELOW">Below Expectations</option>
          <option value="MEETS">Meets Expectations</option>
          <option value="EXCEEDS">Exceeds Expectations</option>
        </select>
      </div>

      {/* Baseline Power Filter Button */}
      <button
        id="sidebar-baseline-filter-btn"
        onClick={() => setHideUnderBaseline(!hideUnderBaseline)}
        className={`w-full py-1.5 px-2 rounded-md text-[10px] font-mono font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
          hideUnderBaseline
            ? "bg-amber-950/20 text-amber-300 border-amber-500/40 hover:bg-amber-950/40"
            : "bg-gothic-ink text-gothic-rose/50 border-gothic-silver/20 hover:text-gothic-silver"
        }`}
      >
        <Filter size={10} />
        {hideUnderBaseline ? `Baseline Filter (≥ ${(powerBaseline / 1000000).toFixed(1)}M)` : `Show All Powers`}
      </button>

      {/* Players Clickable List */}
      <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-2">
        {filteredPlayers.map((player) => {
          const playerTier = evaluations.find((e) => e.playerId === player.characterId)?.performanceTier;
          const pSnaps = snapshots.filter((s) => s.playerId === player.characterId);
          const playerPowerVal = pSnaps.slice(-1)[0]?.currentPower || 0;
          const isSelected = activePlayer && player.characterId === activePlayer.characterId;

          return (
            <div
              key={player.characterId}
              onClick={() => onSelectPlayer(player.characterId)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? "bg-gothic-ink border-gothic-silver shadow-md"
                  : "bg-gothic-velvet border-gothic-silver/20 hover:bg-gothic-ink/50 hover:border-[#89A6B8]/40"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-bold text-gothic-silver truncate font-mono">{player.currentName}</span>
                <span className="text-[10px] font-mono text-gothic-rose/90 shrink-0">{formatWholeNumber(playerPowerVal)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[9px] font-mono text-gothic-rose/50">{player.characterId}</span>
                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${getTierColor(playerTier)}`}>
                  {getTierLabel(playerTier)}
                </span>
              </div>
            </div>
          );
        })}
        {filteredPlayers.length === 0 && (
          <p className="text-[11px] text-gothic-rose/50 text-center py-8 font-mono">No matching lords found.</p>
        )}
      </div>
    </div>
  );
}