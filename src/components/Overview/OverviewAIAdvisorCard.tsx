import React from "react";
import { Sparkles, Bot, Loader2 } from "lucide-react";

interface OverviewAIAdvisorCardProps {
  aiBrief: string;
  isGeneratingBrief: boolean;
  onGenerateBrief: () => void;
}

export default function OverviewAIAdvisorCard({
  aiBrief,
  isGeneratingBrief,
  onGenerateBrief
}: OverviewAIAdvisorCardProps) {
  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-gothic-velvet via-gothic-ink to-gothic-void border border-amber-500/30 space-y-4 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gothic-silver/20 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-inner">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider flex items-center gap-2">
              Gemini Kingdom Intelligence Brief <Sparkles size={14} className="text-amber-400" />
            </h3>
            <p className="text-xs text-gothic-rose/70 font-mono mt-0.5">
              Strategic tactical analysis and recommendations synthesized from live alliance telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={onGenerateBrief}
          disabled={isGeneratingBrief}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-[#16181D] font-mono font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-md shrink-0"
        >
          {isGeneratingBrief ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Synthesizing...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Generate AI Intelligence Brief
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 font-mono text-xs">
        {aiBrief ? (
          <div className="p-4 rounded-lg bg-gothic-void border border-gothic-silver/20 text-gothic-silver whitespace-pre-line leading-relaxed">
            {aiBrief}
          </div>
        ) : (
          <div className="p-8 text-center text-gothic-rose/50 border border-dashed border-gothic-silver/20 rounded-lg">
            <p>No intelligence brief generated for this cycle yet.</p>
            <p className="text-[10px] mt-1">Click the button above to query the Gemini tactical engine.</p>
          </div>
        )}
      </div>
    </div>
  );
}