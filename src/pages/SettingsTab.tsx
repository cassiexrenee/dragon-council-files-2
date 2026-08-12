import React, { useState } from "react";
import { Save, CheckCircle, TrendingUp } from "lucide-react";
import { AllianceSettings } from "../types";
import ThemeSettingsSection from "../components/settings/ThemeSettingsSection";
import SeasonSettingsSection from "../components/settings/SeasonSettingsSection";

export interface ThemeOption {
  id: "slate" | "obsidian" | "sepia" | string;
  name: string;
  shortName: string;
  tagline: string;
  badgeStyle: string;
  previewBg: string;
  previewAccent: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "slate",
    name: "Modern Slate (Light Theme)",
    shortName: "Modern Slate",
    tagline: "Background #F1F5F9, Surface #FFFFFF, Accent #1D4ED8 / #0F766E, Text #020617",
    badgeStyle: "bg-blue-500/20 text-blue-700 border-blue-500/40 font-bold",
    previewBg: "bg-[#F1F5F9]",
    previewAccent: "bg-[#1D4ED8]"
  },
  {
    id: "obsidian",
    name: "Deep Obsidian (Dark Theme)",
    shortName: "Deep Obsidian",
    tagline: "Background #0F172A, Surface #1E293B, Accent #38BDF8 / #818CF8, Text #F8FAFC",
    badgeStyle: "bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold",
    previewBg: "bg-[#0F172A]",
    previewAccent: "bg-[#38BDF8]"
  },
  {
    id: "sepia",
    name: "Warm Sepia (High-Comfort Theme)",
    shortName: "Warm Sepia",
    tagline: "Background #F3EFE6, Surface #FCFBF7, Accent #8C3A00 / #2D5A44, Text #1A1815",
    badgeStyle: "bg-amber-800/20 text-amber-900 border-amber-800/40 font-bold",
    previewBg: "bg-[#F3EFE6]",
    previewAccent: "bg-[#8C3A00]"
  }
];

// FIX: Aligned setSettings with App.tsx and added missing props to satisfy TypeScript
interface SettingsTabProps {
  settings: AllianceSettings;
  setSettings: (newSettings: AllianceSettings) => void;
  activeTheme?: string;
  onUpdateTheme?: (theme: string) => void;
  profile?: any;
  setProfile?: any;
  importSessions?: any[];
  handleDeleteSession?: (id: string) => void;
  onShowImportModal?: () => void;
}

export default function SettingsTab({
  settings,
  setSettings, // FIX: Destructured the corrected function name
  activeTheme = "obsidian",
  onUpdateTheme,
  profile,
  setProfile,
  importSessions,
  handleDeleteSession,
  onShowImportModal
}: SettingsTabProps) {
  const [currentTheme, setCurrentTheme] = useState<string>(activeTheme);
  const [activeProfile, setActiveProfile] = useState(settings.activeProfile);
  const [activeSeason, setActiveSeason] = useState(settings.configuration.activeSeason);
  
  const [s1Baseline, setS1Baseline] = useState(settings.configuration.seasonalPowerBaselines.S1);
  const [s2Baseline, setS2Baseline] = useState(settings.configuration.seasonalPowerBaselines.S2);
  const [s3Baseline, setS3Baseline] = useState(settings.configuration.seasonalPowerBaselines.S3);
  const [sosBaseline, setSosBaseline] = useState(settings.configuration.seasonalPowerBaselines.SoS);

  const [meritRatioPct, setMeritRatioPct] = useState(settings.configuration.complianceTargets?.meritRatioPct ?? 10);
  const [deathsMin, setDeathsMin] = useState(settings.configuration.complianceTargets?.deathsMin ?? 50000);

  const [seasonStartDate, setSeasonStartDate] = useState(settings.configuration.seasonStartDate || "2026-06-19");
  const [finalZoneOpenDate, setFinalZoneOpenDate] = useState(settings.configuration.finalZoneOpenDate || "2026-07-17");
  const [seasonSummaryDate, setSeasonSummaryDate] = useState(settings.configuration.seasonSummaryDate || "2026-07-29");
  const [seasonEndDate, setSeasonEndDate] = useState(settings.configuration.seasonEndDate || "2026-07-31");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const addDays = (dateStr: string, days: number): string => {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return dateStr;
    }
  };

  const handleStartDateChange = (val: string) => {
    setSeasonStartDate(val);
    setFinalZoneOpenDate(addDays(val, 28));
    setSeasonSummaryDate(addDays(val, 40));
    setSeasonEndDate(addDays(val, 42));
  };

  const handleSaveSettings = () => {
    const updated: AllianceSettings = {
      allianceId: settings.allianceId,
      activeProfile,
      configuration: {
        ...settings.configuration,
        seasonalPowerBaselines: {
          S1: s1Baseline,
          S2: s2Baseline,
          S3: s3Baseline,
          SoS: sosBaseline,
        },
        activeSeason,
        seasonStartDate,
        finalZoneOpenDate,
        seasonSummaryDate,
        seasonEndDate,
        complianceTargets: {
          meritRatioPct,
          deathsMin,
          activityRequired: true
        }
      },
      updatedAt: new Date().toISOString(),
    };

    setSettings(updated); // FIX: Successfully tied into App.tsx controller
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 7500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Theme & Season Settings */}
      <div className="lg:col-span-1 space-y-6">
        <ThemeSettingsSection
          themeOptions={THEME_OPTIONS}
          activeTheme={activeTheme}
          onUpdateTheme={onUpdateTheme || (() => {})}
          setCurrentTheme={setCurrentTheme}
        />

        <SeasonSettingsSection
          activeSeason={activeSeason}
          setActiveSeason={setActiveSeason}
          seasonStartDate={seasonStartDate}
          handleStartDateChange={handleStartDateChange}
          finalZoneOpenDate={finalZoneOpenDate}
          setFinalZoneOpenDate={setFinalZoneOpenDate}
          seasonSummaryDate={seasonSummaryDate}
          setSeasonSummaryDate={setSeasonSummaryDate}
          seasonEndDate={seasonEndDate}
          setSeasonEndDate={setSeasonEndDate}
        />

        <div className="p-2">
          <button
            id="save-settings-btn"
            onClick={handleSaveSettings}
            className="w-full py-3 bg-gothic-silver hover:bg-opacity-90 text-[#111113] font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Save & Re-evaluate Roster
          </button>
          
          {saveSuccess && (
            <div className="mt-3 p-3 text-xs bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-center flex items-center justify-center gap-1.5 font-mono animate-pulse">
              <CheckCircle size={12} /> Analytics successfully re-evaluated!
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Baselines & Compliance Gates */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-6">
          <h2 className="text-base font-bold text-gothic-silver font-display flex items-center gap-2 border-b border-gothic-silver/20 pb-3">
            <TrendingUp size={18} className="text-[#89A6B8]" />
            Seasonal Power & Performance Gates
          </h2>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gothic-rose/50">Seasonal Character ID Power Baselines</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Season 1", val: s1Baseline, setter: setS1Baseline },
                { label: "Season 2", val: s2Baseline, setter: setS2Baseline },
                { label: "Season 3", val: s3Baseline, setter: setS3Baseline },
                { label: "Season of Strife", val: sosBaseline, setter: setSosBaseline }
              ].map((bs, idx) => (
                <div key={idx} className="space-y-1.5 p-3 rounded-lg bg-gothic-ink/40 border border-gothic-silver/10">
                  <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block">{bs.label}</label>
                  <input
                    type="number"
                    step="1000000"
                    min="0"
                    value={bs.val}
                    onChange={(e) => bs.setter(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs font-mono font-bold text-gothic-silver p-1.5 rounded-md outline-none"
                  />
                  <span className="text-[9px] text-[#89A6B8] font-mono block">{(bs.val / 1000000).toFixed(1)}M Baseline</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-gothic-silver/20 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gothic-rose/50">Compliance Target Criteria & Tiers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-lg bg-gothic-ink/40 border border-gothic-silver/10">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-gothic-rose/50">Merit-to-Power Target Ratio</label>
                  <span className="text-xs font-mono font-bold text-amber-400">{meritRatioPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={meritRatioPct}
                  onChange={(e) => setMeritRatioPct(parseInt(e.target.value) || 10)}
                  className="w-full accent-amber-500 bg-gothic-ink rounded-lg appearance-none h-1.5 cursor-pointer"
                />
                <p className="text-[10px] text-gothic-rose/50">Merits required as a percentage of current power for full compliance.</p>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-gothic-ink/40 border border-gothic-silver/10">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-gothic-rose/50">Minimum Casualties / Deaths</label>
                  <span className="text-xs font-mono font-bold text-red-400">{deathsMin.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  max="500000"
                  value={deathsMin}
                  onChange={(e) => setDeathsMin(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs font-mono font-bold text-red-400 p-1.5 rounded-md outline-none"
                />
                <p className="text-[10px] text-gothic-rose/50">Minimum T4/T5 troop casualties expected during the season.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}