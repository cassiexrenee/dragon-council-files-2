import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CalendarViewProps {
  startDate?: string;
  endDate?: string;
  milestones?: Array<{ title: string; date: string }>;
}

export function CalendarView({ startDate, endDate, milestones = [] }: CalendarViewProps) {
  return (
    <div className="p-5 bg-gothic-velvet border border-gothic-silver/20 rounded-xl space-y-4 font-mono text-xs shadow-xl">
      <div className="flex items-center gap-2 border-b border-gothic-silver/20 pb-3">
        <CalendarIcon size={16} className="text-[#89A6B8]" />
        <h4 className="font-bold text-gothic-silver uppercase tracking-wider font-display">Campaign Timeline & Milestones</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gothic-rose/90">
        <div className="p-3 rounded-lg bg-gothic-void border border-gothic-silver/15 space-y-1">
          <span className="text-[10px] uppercase text-gothic-rose/50 block">Season Commencement</span>
          <span className="font-bold text-gothic-silver">{startDate || "Not configured"}</span>
        </div>
        <div className="p-3 rounded-lg bg-gothic-void border border-gothic-silver/15 space-y-1">
          <span className="text-[10px] uppercase text-gothic-rose/50 block">Season Conclusion</span>
          <span className="font-bold text-gothic-silver">{endDate || "Not configured"}</span>
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] uppercase font-bold text-gothic-rose/50 block">Scheduled Milestones</span>
          <div className="space-y-1.5">
            {milestones.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded bg-gothic-ink border border-gothic-silver/10 flex items-center justify-between">
                <span className="text-gothic-silver font-semibold">{m.title}</span>
                <span className="text-[10px] text-[#89A6B8] flex items-center gap-1"><Clock size={10} /> {m.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}