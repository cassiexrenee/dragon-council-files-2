import React from "react";
import { Trash2, AlertTriangle, Info } from "lucide-react";
import { RoleOverride } from "../../types";

interface ReviewOverridesListProps {
  activeOverrides: RoleOverride[];
  getPlayerName: (id: string) => string;
  getPowerStr: (id: string) => string;
  onRemoveOverride: (playerId: string) => void;
  onNavigateToTab: (tab: string) => void;
  playersCount: number;
}

export default function ReviewOverridesList({
  activeOverrides,
  getPlayerName,
  getPowerStr,
  onRemoveOverride,
  onNavigateToTab,
  playersCount
}: ReviewOverridesListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activeOverrides.map((ovr) => (
        <div key={ovr.playerId} className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gothic-silver">{getPlayerName(ovr.playerId)}</h3>
                <p className="text-[10px] font-mono text-gothic-rose/50 mt-0.5">ID: {ovr.playerId} • Power: {getPowerStr(ovr.playerId)}</p>
              </div>
              <span className="text-xs font-mono font-bold uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                {ovr.role}
              </span>
            </div>

            <p className="text-xs text-gothic-rose/90 bg-gothic-void p-3 rounded border border-gothic-silver/20 italic leading-relaxed">
              "{ovr.reason}"
            </p>
          </div>

          <div className="border-t border-gothic-silver/20 pt-3 flex justify-between items-center text-[10px] text-gothic-rose/50 font-mono">
            <span>Logged: {new Date(ovr.createdAt).toLocaleDateString()}</span>
            <button
              onClick={() => onRemoveOverride(ovr.playerId)}
              className="text-red-400 hover:text-red-300 font-bold hover:underline transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={10} /> Revoke Override
            </button>
          </div>
        </div>
      ))}

      {activeOverrides.length === 0 && (
        playersCount === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
            <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-gothic-silver">No Roster Data Yet</h3>
            <p className="text-xs mt-1">Manual role overrides will appear here once an alliance roster has been imported.</p>
            <button
              onClick={() => onNavigateToTab("imports")}
              className="mt-4 px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              Go to Import Manager
            </button>
          </div>
        ) : (
          <div className="col-span-2 p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
            <Info size={40} className="mx-auto text-[#89A6B8] mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-gothic-silver">No Active Overrides</h3>
            <p className="text-xs mt-1">All roster classification outputs are handled entirely by automated analytics.</p>
          </div>
        )
      )}
    </div>
  );
}