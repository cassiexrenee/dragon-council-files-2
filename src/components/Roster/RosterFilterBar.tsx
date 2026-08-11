import React from "react";
import { Search } from "lucide-react";
import { formatWholeNumber } from "../../utils/Analytics";

interface RosterFilterBarProps {
  search: string;
  setSearch: (s: string) => void;
  tierFilter: string;
  setTierFilter: (t: string) => void;
  hideUnderBaseline: boolean;
  setHideUnderBaseline: (hide: boolean) => void;
  powerBaseline: number;
}

export default function RosterFilterBar({
  search,
  setSearch,
  tierFilter,
  setTierFilter,
  hideUnderBaseline,
  setHideUnderBaseline,
  powerBaseline
}: RosterFilterBarProps) {
  return (
    <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
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

      <div>
        <select
          id="roster-tier-filter"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-rose/90 p-2 rounded-lg outline-none focus:border-[#89A6B8] font-mono cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BELOW">Below Expectations</option>
          <option value="MEETS">Meets Expectations</option>
          <option value="EXCEEDS">Exceeds Expectations</option>
        </select>
      </div>

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
  );
}