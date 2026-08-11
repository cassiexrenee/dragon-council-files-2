import React from 'react';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  actor: string;
  description: string;
  severity: 'DIPLOMATIC' | 'VANGUARD' | 'CRITICAL' | 'SYSTEM';
}

export default function ChronicleEventCard({ event }: { event: TimelineEvent }) {
  return (
    <div className="flex gap-4 p-4 border border-gothic-silver/20 rounded-lg bg-gothic-velvet">
      {/* Move the inner JSX from your current map function here. 
        This keeps the badge logic (CRITICAL vs VANGUARD) isolated.
      */}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-gothic-silver">{event.title}</h4>
        <p className="text-xs text-gothic-rose/60">{event.timestamp} • {event.actor}</p>
        <p className="text-sm text-[#C8CCD2]">{event.description}</p>
        
        <div className="mt-2 flex gap-2">
          {event.severity === 'CRITICAL' && (
            <span className="font-display text-[9px] tracking-widest text-[#B85A5A] bg-[#B85A5A]/15 border border-[#B85A5A]/30 px-2 py-0.5 rounded uppercase font-semibold">
              Execution Hazard
            </span>
          )}
          {event.severity === 'VANGUARD' && (
            <span className="font-display text-[9px] tracking-widest text-[#7FA8C9] bg-[#7FA8C9]/15 border border-[#7FA8C9]/30 px-2 py-0.5 rounded uppercase font-semibold">
              Combat Honor
            </span>
          )}
          {event.severity === 'DIPLOMATIC' && (
            <span className="font-display text-[9px] tracking-widest text-gothic-bloom bg-gothic-bloom/10 border border-gothic-bloom/30 px-2 py-0.5 rounded uppercase font-semibold">
              Council Pact
            </span>
          )}
          {event.severity === 'SYSTEM' && (
            <span className="font-display text-[9px] tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded uppercase font-semibold">
              System Log
            </span>
          )}
        </div>
      </div>
    </div>
  );
}