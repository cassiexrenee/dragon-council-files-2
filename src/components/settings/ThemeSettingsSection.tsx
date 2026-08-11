import React from "react";
import { Palette, Check } from "lucide-react";
import { ThemeOption } from "../../pages/SettingsTab";

interface ThemeSettingsSectionProps {
  themeOptions: ThemeOption[];
  activeTheme: string;
  onUpdateTheme: (themeId: string) => void;
  setCurrentTheme: (themeId: string) => void;
}

export default function ThemeSettingsSection({
  themeOptions,
  activeTheme,
  onUpdateTheme,
  setCurrentTheme
}: ThemeSettingsSectionProps) {
  return (
    <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4">
      <div className="flex items-center justify-between border-b border-gothic-silver/20 pb-2">
        <h2 className="text-sm font-semibold tracking-wider text-gothic-silver uppercase font-display flex items-center gap-2">
          <Palette size={16} className="text-amber-400" /> Command Theme & Typography
        </h2>
        <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
          {themeOptions.find(t => t.id === activeTheme)?.shortName || "Modern Themes"}
        </span>
      </div>
      <p className="text-xs text-gothic-rose/90">
        Select your preferred interface color system: <span className="text-gothic-silver font-semibold">Modern Slate</span> (Default Light), <span className="text-gothic-silver font-semibold">Deep Obsidian</span> (Default Dark), or <span className="text-gothic-silver font-semibold">Warm Sepia</span> (Evening Comfort). All paired with <span className="text-gothic-silver font-semibold font-display">Plus Jakarta Sans</span> headings, <span className="text-gothic-silver font-semibold">Inter</span> controls, and <span className="text-gothic-silver font-semibold font-mono">JetBrains Mono</span> tabular data.
      </p>

      <div className="space-y-2.5">
        {themeOptions.map((t) => {
          const isSelected = activeTheme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setCurrentTheme(t.id);
                onUpdateTheme(t.id);
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
  );
}