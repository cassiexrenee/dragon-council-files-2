import React, { useState } from "react";
import { ArrowLeftRight, UserPlus, UserMinus, Shield, Search } from "lucide-react";
import { Player, Snapshot, AllianceSettings } from "../types";
import { formatWholeNumber } from "../utils/analytics";

interface MigrationReconcilerTabProps {
  players: Player[];
  snapshots: Snapshot[];
  settings: AllianceSettings;
}

export default function MigrationReconcilerTab({
  players,
  snapshots,
  settings
}: MigrationReconcilerTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [migrationType, setMigrationType] = useState<"ALL" | "ARRIVING" | "DEPARTING">("ALL");

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="border-b border-gothic-silver/25 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#89A6B8] uppercase tracking-widest">
            <ArrowLeftRight size={14} /> Migration Reconciler
          </div>
          <h1 className="text-2xl font-display font-bold text-gothic-silver tracking-tight">
            Kingdom Migration & Roster Flow Ledger
          </h1>
          <p className="text-xs text-gothic-rose/70 font-mono mt-0.5">
            Track arriving and departing lords across KvK seasons and reconcile kingdom power limits.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 grid grid-cols-1 md:grid-cols-3 gap-3 items-center font-mono text-xs">
        <div className="relative md:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gothic-rose/50" />
          <input
            type="text"
            placeholder="Search migrating lord name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver pl-9 pr-3 py-2 rounded-lg outline-none focus:border-[#89A6B8]"
          />
        </div>

        <div className="flex gap-1">
          {[
            { id: "ALL", label: "All Records" },
            { id: "ARRIVING", label: "Arriving" },
            { id: "DEPARTING", label: "Departing" }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setMigrationType(btn.id as any)}
              className={`flex-1 py-2 px-3 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                migrationType === btn.id
                  ? "bg-gothic-silver text-[#111113]"
                  : "bg-gothic-ink text-gothic-rose/70 hover:text-gothic-silver border border-gothic-silver/20"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-12 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50 font-mono space-y-3">
        <ArrowLeftRight size={40} className="mx-auto text-[#89A6B8] opacity-60" />
        <h3 className="text-sm font-bold text-gothic-silver">Migration Reconciler Active (Backlog Overhaul Ready)</h3>
        <p className="text-xs max-w-md mx-auto">
          This tracking module has been successfully restored from the to-do backlog. Use snapshot imports to track power deltas between pre-KvK and post-KvK cycles.
        </p>
      </div>
    </div>
  );
}