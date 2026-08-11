import React, { useState } from "react";
import { Shield, Users, ArrowRight, Sparkles, Scroll, Award, CheckCircle2 } from "lucide-react";
import { Player, Snapshot, AllianceSettings, PerformanceEvaluation } from "../types";
import { formatWholeNumber } from "../utils/analytics";
import RecruitmentModal from "../components/Landing/RecruitmentModal";

interface LandingTabProps {
  players: Player[];
  snapshots: Snapshot[];
  settings: AllianceSettings;
  evaluations: PerformanceEvaluation[];
  onNavigateToTab: (tab: string) => void;
  onSelectPlayer: (id: string) => void;
  onApplyForRecruitment: (applicant: {
    characterName: string;
    power: number;
    merits: number;
    troopTier: string;
    preferredRole: string;
  }) => void;
}

export default function LandingTab({
  players,
  snapshots,
  settings,
  evaluations,
  onNavigateToTab,
  onApplyForRecruitment
}: LandingTabProps) {
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false);

  const totalPower = snapshots.reduce((acc, s) => acc + s.currentPower, 0);
  const exemplaryCount = evaluations.filter(e => e.performanceTier === "EXCEEDS").length;

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-gothic-velvet via-gothic-ink to-gothic-void border border-gothic-silver/30 p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles size={14} /> Dragon Council Alliance Workspace
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-gothic-silver tracking-tight">
            Kingdom Intelligence & Roster Command
          </h1>
          <p className="text-sm md:text-base text-gothic-rose/80 font-ledger leading-relaxed">
            Manage alliance telemetry, monitor compliance targets, evaluate combat output, and coordinate seasonal campaign milestones with absolute precision.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={() => onNavigateToTab("overview")}
              className="px-6 py-3 bg-[#D4B26A] hover:bg-[#c3a159] text-[#16181D] font-display font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(212,178,106,0.3)] transition-all cursor-pointer flex items-center gap-2"
            >
              Enter Leadership Hub <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setIsRecruitmentOpen(true)}
              className="px-6 py-3 bg-gothic-ink hover:bg-gothic-void text-gothic-silver font-display font-bold text-xs uppercase tracking-wider rounded-xl border border-gothic-silver/30 transition-all cursor-pointer"
            >
              Apply for Recruitment
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gothic-rose/50 block">Active Roster Size</span>
          <span className="text-2xl font-bold font-display text-gothic-silver">{players.length} Lords</span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1"><CheckCircle2 size={12} /> Fully synchronized</span>
        </div>

        <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gothic-rose/50 block">Total Alliance Power</span>
          <span className="text-2xl font-bold font-display text-amber-300">{formatWholeNumber(totalPower)}</span>
          <span className="text-[10px] text-gothic-rose/50 block pt-1">Season: {settings.configuration.activeSeason}</span>
        </div>

        <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gothic-rose/50 block">Exemplary Performers</span>
          <span className="text-2xl font-bold font-display text-[#7FA8C9]">{exemplaryCount} Lords</span>
          <span className="text-[10px] text-gothic-rose/50 block pt-1">Exceeding expectations</span>
        </div>

        <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gothic-rose/50 block">Active Campaign</span>
          <span className="text-2xl font-bold font-display text-gothic-silver">{settings.configuration.activeSeason} Era</span>
          <span className="text-[10px] text-[#7FA8C9] block pt-1">Frontline active</span>
        </div>
      </div>

      <RecruitmentModal
        isOpen={isRecruitmentOpen}
        onClose={() => setIsRecruitmentOpen(false)}
        onApplyForRecruitment={onApplyForRecruitment}
      />
    </div>
  );
}