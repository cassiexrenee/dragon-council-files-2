import React from 'react';
import { Scroll, Sword, Skull, ShieldAlert, Award, Milestone, Users } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  actor: string;
  description: string;
  severity: 'DIPLOMATIC' | 'VANGUARD' | 'CRITICAL' | 'SYSTEM';
}

export default function ChronicleTimeline() {
  // Chronicle tracking logs integrating your core character identities
  const events: TimelineEvent[] = [
    {
      id: 'log-004',
      timestamp: 'July 19, 18:42',
      title: 'Alliance Pairing Finalized',
      actor: 'Council Core',
      description: 'Diplomatic alignment parameters sealed for the upcoming seasonal frontline theater.',
      severity: 'DIPLOMATIC'
    },
    {
      id: 'log-003',
      timestamp: 'July 18, 23:15',
      title: 'Vanguard Ascension',
      actor: 'Hecate',
      description: 'Account combat output crossed into the elite tier threshold. Status updated automatically.',
      severity: 'VANGUARD'
    },
    {
      id: 'log-002',
      timestamp: 'July 17, 14:00',
      title: 'Campaign Arrival Registered',
      actor: 'Cassiopeia',
      description: 'Transferred command vectors safely into the primary operation zone ledger.',
      severity: 'SYSTEM'
    },
    {
      id: 'log-001',
      timestamp: 'July 16, 09:30',
      title: 'Roster Inactivity Flag Raised',
      actor: 'Calypso',
      description: 'Account flagged for high power bloat relative to active battlefield merit generation.',
      severity: 'CRITICAL'
    }
  ];

  return (
    <div className="w-full bg-gradient-to-br from-gothic-velvet to-gothic-ink border border-gothic-silver/10 rounded-xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative Corner Trim Flairs */}
      <div className="absolute top-2 left-2 text-gothic-silver/20 font-display text-[10px]">✦</div>
      <div className="absolute top-2 right-2 text-gothic-silver/20 font-display text-[10px]">✦</div>
      <div className="absolute bottom-2 left-2 text-gothic-silver/20 font-display text-[10px]">✦</div>
      <div className="absolute bottom-2 right-2 text-gothic-silver/20 font-display text-[10px]">✦</div>

      {/* Decorative Ledger Header */}
      <div className="flex items-center justify-between border-b border-gothic-silver/10 pb-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-gothic-ink border border-gothic-silver/10 text-gothic-silver">
            <Scroll size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg tracking-wider text-gothic-silver">THE WAR LOGS</h3>
            <p className="font-ledger text-xs text-gothic-rose/50 italic">A chronological sequence of campaign milestones</p>
          </div>
        </div>
        <span className="font-display text-[10px] tracking-[0.2em] bg-gothic-ink text-gothic-rose/60 px-3 py-1 border border-gothic-silver/10 rounded uppercase">
          Chronicle View
        </span>
      </div>

      {/* Timeline Node Tree */}
      <div className="relative border-l border-gothic-silver/10 ml-4 pl-6 space-y-6 relative z-10">
        {events.map((event) => (
          <div key={event.id} className="relative group">
            
            {/* Timeline Node Point Indicator */}
            <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 bg-gothic-velvet transition-transform group-hover:scale-125 ${
              event.severity === 'CRITICAL' ? 'border-gothic-crimson shadow-[0_0_8px_#8B0000]' :
              event.severity === 'VANGUARD' ? 'border-[#7FA8C9] shadow-[0_0_8px_#7FA8C9]' :
              event.severity === 'DIPLOMATIC' ? 'border-[#D9A441] shadow-[0_0_6px_#D9A441]' : 'border-[#4B5563]'
            }`} />

            {/* Event Header Copy Block */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-display text-lg font-bold tracking-wide text-[#F2F0E8]">
                  {event.title}
                </h4>
                <span className="text-xs text-[#C8CCD2]/60">— led by</span>
                <span className="font-semibold text-sm text-[#F2F0E8] bg-[#2F3743] px-2 py-0.5 rounded border border-[#4B5563]/30">
                  {event.actor}
                </span>
              </div>
              <time className="text-xs italic text-[#8B96A5] whitespace-nowrap">
                {event.timestamp}
              </time>
            </div>

            {/* Description Segment */}
            <p className="text-sm text-[#C8CCD2] leading-relaxed max-w-xl">
              "{event.description}"
            </p>

            {/* Custom Severity Badges for Alchemist Styling */}
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
                  Ledger Entry
                </span>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
