import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sliders, 
  Settings, 
  Calendar, 
  TrendingUp, 
  Gauge, 
  Save, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Palette,
  Check,
  Sparkles
} from "lucide-react";
import { AllianceSettings, AccountRole } from "../types";

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

interface SettingsTabProps {
  settings: AllianceSettings;
  onUpdateSettings: (newSettings: AllianceSettings) => void;
  activeTheme?: string;
  onUpdateTheme?: (theme: string) => void;
}

export default function SettingsTab({
  settings,
  onUpdateSettings,
  activeTheme = "obsidian",
  onUpdateTheme
}: SettingsTabProps) {
  // Local state copy
  const [currentTheme, setCurrentTheme] = useState<string>(activeTheme);
  const [activeProfile, setActiveProfile] = useState(settings.activeProfile);
  const [activeSeason, setActiveSeason] = useState(settings.configuration.activeSeason);
  
  const [s1Baseline, setS1Baseline] = useState(settings.configuration.seasonalPowerBaselines.S1);
  const [s2Baseline, setS2Baseline] = useState(settings.configuration.seasonalPowerBaselines.S2);
  const [s3Baseline, setS3Baseline] = useState(settings.configuration.seasonalPowerBaselines.S3);
  const [sosBaseline, setSosBaseline] = useState(settings.configuration.seasonalPowerBaselines.SoS);

  // Compliance targets state
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

    onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 7500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Settings Navigation and profile selector */}
      <div className="lg:col-span-1 space-y-6">

        {/* Command Center Design System */}
        <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4">
          <div className="flex items-center justify-between border-b border-gothic-silver/20 pb-2">
            <h2 className="text-sm font-semibold tracking-wider text-gothic-silver uppercase font-display flex items-center gap-2">
              <Palette size={16} className="text-amber-400" /> Command Theme & Typography
            </h2>
            <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
              {THEME_OPTIONS.find(t => t.id === activeTheme)?.shortName || "Modern Themes"}
            </span>
          </div>
          <p className="text-xs text-gothic-rose/90">
            Select your preferred interface color system: <span className="text-gothic-silver font-semibold">Modern Slate</span> (Default Light), <span className="text-gothic-silver font-semibold">Deep Obsidian</span> (Default Dark), or <span className="text-gothic-silver font-semibold">Warm Sepia</span> (Evening Comfort). All paired with <span className="text-gothic-silver font-semibold font-display">Plus Jakarta Sans</span> headings, <span className="text-gothic-silver font-semibold">Inter</span> controls, and <span className="text-gothic-silver font-semibold font-mono">JetBrains Mono</span> tabular data.
          </p>

          <div className="space-y-2.5">
            {THEME_OPTIONS.map((t) => {
              const isSelected = activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrentTheme(t.id);
                    onUpdateTheme?.(t.id);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-gothic-ink border-amber-400/80 shadow-md ring-1 ring-amber-400/50"
                      : "bg-gothic-ink/40 border-gothic-silver/15 hover:border-gothic-silver/40 hover:bg-gothic-ink/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-md ${t.previewBg} border ${isSelected ? 'border-amber-400' : 'border-gothic-silver/30'} p-1 flex items-center justify-center flex-shrink-0 shadow-inner`}>
                      <div className={`w-3.5 h-3.5 rounded-full ${t.previewAccent}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold font-display ${isSelected ? 'text-white' : 'text-gothic-silver'}`}>
                          {t.name}
                        </span>
                        {isSelected && <Check size={13} className="text-amber-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-gothic-rose/70 block truncate font-ledger">
                        {t.tagline}
                      </span>
                    </div>
                  </div>
                  <div className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${t.badgeStyle} flex-shrink-0 hidden sm:block`}>
                    {t.shortName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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

        {/* Global Action */}
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

      {/* Numerical rules and weights editor */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Power Baselines and score thresholds */}
        <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-6">
          <h2 className="text-base font-bold text-gothic-silver font-display flex items-center gap-2 border-b border-gothic-silver/20 pb-3">
            <TrendingUp size={18} className="text-[#89A6B8]" />
            Seasonal Power & Performance Gates
          </h2>

          {/* Power baselines inputs */}
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

          {/* Compliance Checklist Targets */}
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
