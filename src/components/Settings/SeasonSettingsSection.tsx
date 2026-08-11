import React from "react";
import { Calendar } from "lucide-react";

interface SeasonSettingsSectionProps {
  activeSeason: string;
  setActiveSeason: (season: "S1" | "S2" | "S3" | "SoS") => void;
  seasonStartDate: string;
  handleStartDateChange: (val: string) => void;
  finalZoneOpenDate: string;
  setFinalZoneOpenDate: (val: string) => void;
  seasonSummaryDate: string;
  setSeasonSummaryDate: (val: string) => void;
  seasonEndDate: string;
  setSeasonEndDate: (val: string) => void;
}

export default function SeasonSettingsSection({
  activeSeason,
  setActiveSeason,
  seasonStartDate,
  handleStartDateChange,
  finalZoneOpenDate,
  setFinalZoneOpenDate,
  seasonSummaryDate,
  setSeasonSummaryDate,
  seasonEndDate,
  setSeasonEndDate
}: SeasonSettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* KvK season configuration */}
      <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-gothic-silver uppercase font-display border-b border-gothic-silver/20 pb-2 flex items-center gap-2">
          <Calendar size={16} /> Active Season Baselines
        </h2>
        <p className="text-xs text-gothic-rose/90">
          Select your alliance's current season of kingdom development. This scales expectations for low-power account filters.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "S1", label: "Season 1" },
            { id: "S2", label: "Season 2" },
            { id: "S3", label: "Season 3" },
            { id: "SoS", label: "Strife Era" }
          ].map((sn) => (
            <button
              key={sn.id}
              onClick={() => setActiveSeason(sn.id as any)}
              className={`p-2 rounded-lg text-xs font-mono font-semibold transition-all border cursor-pointer ${
                activeSeason === sn.id
                  ? "bg-gothic-silver border-gothic-silver text-[#111113]"
                  : "bg-gothic-ink border-gothic-silver/20 text-gothic-rose/90 hover:bg-gothic-ink/80"
              }`}
            >
              {sn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customizable Season Milestones Calendar Scheduler */}
      <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-gothic-silver uppercase font-display border-b border-gothic-silver/20 pb-2 flex items-center gap-2">
          <Calendar size={16} /> Customizable Season Calendar
        </h2>
        <p className="text-xs text-gothic-rose/90">
          Define key calendar milestones. Changing the <span className="text-gothic-silver font-semibold">Start Date</span> auto-populates subsequent dates using standard offsets, but you can customize each individually below.
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gothic-rose/50 uppercase block">Season Start Date</label>
            <input
              type="date"
              value={seasonStartDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full bg-gothic-ink border border-gothic-silver/20 hover:border-[#89A6B8]/40 text-xs font-mono text-gothic-silver p-2.5 rounded-lg outline-none transition-all cursor-pointer"
            />
          </div>

          <div className="border-t border-gothic-silver/20/60 pt-3 grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gothic-rose/50 uppercase block flex items-center justify-between">
                <span>Final Zone Opened</span>
                <span className="text-[9px] text-[#89A6B8] font-normal font-mono">Day 28 Offset</span>
              </label>
              <input
                type="date"
                value={finalZoneOpenDate}
                onChange={(e) => setFinalZoneOpenDate(e.target.value)}
                className="w-full bg-gothic-ink/80 border border-gothic-silver/20 hover:border-[#89A6B8]/40 text-xs font-mono text-gothic-silver p-2 rounded-lg outline-none transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gothic-rose/50 uppercase block flex items-center justify-between">
                <span>Season Summary Date</span>
                <span className="text-[9px] text-[#89A6B8] font-normal font-mono">Day 40 Offset</span>
              </label>
              <input
                type="date"
                value={seasonSummaryDate}
                onChange={(e) => setSeasonSummaryDate(e.target.value)}
                className="w-full bg-gothic-ink/80 border border-gothic-silver/20 hover:border-[#89A6B8]/40 text-xs font-mono text-gothic-silver p-2 rounded-lg outline-none transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gothic-rose/50 uppercase block flex items-center justify-between">
                <span>Season End Date</span>
                <span className="text-[9px] text-[#89A6B8] font-normal font-mono">Day 42 Offset</span>
              </label>
              <input
                type="date"
                value={seasonEndDate}
                onChange={(e) => setSeasonEndDate(e.target.value)}
                className="w-full bg-gothic-ink/80 border border-gothic-silver/20 hover:border-[#89A6B8]/40 text-xs font-mono text-gothic-silver p-2 rounded-lg outline-none transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}