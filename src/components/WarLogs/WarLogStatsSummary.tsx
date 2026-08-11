import React from "react";
import { Scroll, Plus, Milestone, Sword, ShieldAlert, Award } from "lucide-react";

interface WarLogStatsSummaryProps {
  totalCount: number;
  vanguardCount: number;
  criticalCount: number;
  diplomaticCount: number;
  onOpenAddModal: () => void;
}

export default function WarLogStatsSummary({
  totalCount,
  vanguardCount,
  criticalCount,
  diplomaticCount,
  onOpenAddModal
}: WarLogStatsSummaryProps) {
  return (
    <div className="bg-[#222831] border border-[#4B5563]/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#D4B26A]/10 via-[#2F3743]/10 to-transparent pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-lg bg-[#16181D] border border-[#4B5563]/40 text-[#D4B26A] shadow-[0_0_15px_rgba(212,178,106,0.2)]">
            <Scroll size={28} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C8CCD2]/70 bg-[#2F3743] px-2.5 py-0.5 rounded border border-[#4B5563]/30">
                Chronicle & Campaign Ledger
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#7FB685] bg-[#7FB685]/10 px-2 py-0.5 rounded border border-[#7FB685]/30">
                Live Operations
              </span>
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#F2F0E8] tracking-wide">
              The War Logs
            </h1>
            <p className="text-xs text-[#C8CCD2]/80 italic max-w-xl">
              A permanent chronological sequence of seasonal campaign milestones, battlefield honors, execution hazards, and diplomatic coalition pacts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 bg-[#D4B26A] hover:bg-[#c3a159] text-[#16181D] px-4 py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider border border-[#D4B26A]/60 shadow-[0_0_15px_rgba(212,178,106,0.3)] transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Record War Log</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#4B5563]/20 font-ledger">
        <div className="bg-[#16181D]/80 border border-[#4B5563]/30 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-wider text-[#8B96A5]">Total Chronicle Logs</span>
            <span className="text-xl font-bold text-[#F2F0E8]">{totalCount}</span>
          </div>
          <div className="p-2 bg-[#2F3743] border border-[#4B5563]/30 rounded text-[#D4B26A]">
            <Milestone size={16} />
          </div>
        </div>

        <div className="bg-[#16181D]/80 border border-[#7FA8C9]/30 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-wider text-[#7FA8C9]">Vanguard Honors</span>
            <span className="text-xl font-bold text-[#7FA8C9]">{vanguardCount}</span>
          </div>
          <div className="p-2 bg-[#7FA8C9]/10 border border-[#7FA8C9]/30 rounded text-[#7FA8C9]">
            <Sword size={16} />
          </div>
        </div>

        <div className="bg-[#16181D]/80 border border-[#B85A5A]/30 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-wider text-[#B85A5A]">Execution Hazards</span>
            <span className="text-xl font-bold text-[#B85A5A]">{criticalCount}</span>
          </div>
          <div className="p-2 bg-[#B85A5A]/10 border border-[#B85A5A]/30 rounded text-[#B85A5A]">
            <ShieldAlert size={16} />
          </div>
        </div>

        <div className="bg-[#16181D]/80 border border-[#D9A441]/30 p-3.5 rounded-lg flex items-center justify-between">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-wider text-[#D9A441]">Council Pacts</span>
            <span className="text-xl font-bold text-[#D9A441]">{diplomaticCount}</span>
          </div>
          <div className="p-2 bg-[#D9A441]/10 border border-[#D9A441]/30 rounded text-[#D9A441]">
            <Award size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}