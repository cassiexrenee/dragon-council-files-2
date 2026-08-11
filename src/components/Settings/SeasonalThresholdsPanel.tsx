import React from "react";
import { Sliders } from "lucide-react";
import { AllianceSettings } from "../../types";

interface SeasonalThresholdsPanelProps {
  settings: AllianceSettings;
  onUpdateSettings: (newSettings: AllianceSettings) => void;
}

export default function SeasonalThresholdsPanel({ settings, onUpdateSettings }: SeasonalThresholdsPanelProps) {
  const config = settings.configuration;

  const handleSeasonChange = (season: string) => {
    onUpdateSettings({
      ...settings,
      configuration: { ...config, activeSeason: season as any },
      updatedAt: new Date().toISOString()
    });
  };

  const handleBaselineChange = (season: string, value: number) => {
    onUpdateSettings({
      ...settings,
      configuration: {
        ...config,
        seasonalPowerBaselines: {
          ...config.seasonalPowerBaselines,
          [season]: value
        }
      },
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-6 shadow-xl">
      <div className="flex items-center gap-2 border-b border-gothic-silver/20 pb-3">
        <Sliders size={18} className="text-[#89A6B8]" />
        <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">
          Seasonal Parameters & Baselines
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">
            Active Campaign Season
          </label>
          <select
            value={config.activeSeason || "S3"}
            onChange={(e) => handleSeasonChange(e.target.value)}
            className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none cursor-pointer"
          >
            <option value="S1">Season 1 (S1)</option>
            <option value="S2">Season 2 (S2)</option>
            <option value="S3">Season 3 (S3)</option>
            <option value="SoS">Season of Strife (SoS)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">
            Season Start Date
          </label>
          <input
            type="date"
            value={config.seasonStartDate || ""}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                configuration: { ...config, seasonStartDate: e.target.value },
                updatedAt: new Date().toISOString()
              })
            }
            className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-[10px] font-bold text-gothic-silver uppercase tracking-wider font-mono">
          Seasonal Power Baselines
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          {Object.entries(config.seasonalPowerBaselines || {}).map(([seasonKey, powerVal]) => (
            <div key={seasonKey} className="p-3 bg-gothic-ink border border-gothic-silver/20 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-gothic-rose/50 block">
                {seasonKey} Baseline
              </span>
              <input
                type="number"
                step="500000"
                value={powerVal}
                onChange={(e) => handleBaselineChange(seasonKey, parseInt(e.target.value) || 0)}
                className="w-full bg-gothic-void border border-gothic-silver/20 text-gothic-silver p-1.5 rounded text-xs font-mono font-bold outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}