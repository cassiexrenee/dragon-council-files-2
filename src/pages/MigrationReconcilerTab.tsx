import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  ArrowRightLeft,
  UserPlus,
  UserMinus,
  ArrowRight,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Snapshot, ImportSession, Player, AllianceSettings } from "../types";
import { reconcileSnapshots, PlayerRecord, formatWholeNumber } from "../utils/analytics";

interface MigrationReconcilerTabProps {
  snapshots: Snapshot[];
  importSessions?: ImportSession[];
  players?: Player[];
  settings?: AllianceSettings;
}

export default function MigrationReconcilerTab({
  snapshots,
  importSessions = [],
  players = [],
  settings
}: MigrationReconcilerTabProps) {
  // Sort import sessions chronologically by date
  const sortedSessions = useMemo(() => {
    return [...importSessions].sort((a, b) => {
      const timeA = new Date(a.importedAt).getTime();
      const timeB = new Date(b.importedAt).getTime();
      return timeA - timeB;
    });
  }, [importSessions]);

  // Baseline Session state
  const [prevSessionId, setPrevSessionId] = useState<string>(() => {
    if (sortedSessions.length > 1) {
      return sortedSessions[sortedSessions.length - 2].id;
    }
    return sortedSessions.length > 0 ? sortedSessions[0].id : "";
  });

  // Target Session state
  const [newSessionId, setNewSessionId] = useState<string>(() => {
    if (sortedSessions.length > 0) {
      return sortedSessions[sortedSessions.length - 1].id;
    }
    return "";
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Helper to format session date cleanly to just date (YYYY-MM-DD or MMM DD, YYYY)
  const formatSessionDate = (session: ImportSession) => {
    const rawDate = session.importedAt;
    if (!rawDate) return "Unknown Date";
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return rawDate;
    return dateObj.toISOString().split("T")[0]; // Clean YYYY-MM-DD format
  };

  // Reconcile Snapshots between selected sessions
  const reconciledPlayers = useMemo(() => {
    if (!prevSessionId || !newSessionId || prevSessionId === newSessionId) return [];

    const prevSnaps = snapshots.filter((s) => s.importId === prevSessionId);
    const newSnaps = snapshots.filter((s) => s.importId === newSessionId);

    const prevRecords: PlayerRecord[] = prevSnaps.map((s) => ({
      characterId: s.playerId,
      name: s.playerName || s.playerId,
      power: s.currentPower,
      merits: s.merits,
      deaths: s.t4Deaths + s.t5Deaths
    }));

    const newRecords: PlayerRecord[] = newSnaps.map((s) => ({
      characterId: s.playerId,
      name: s.playerName || s.playerId,
      power: s.currentPower,
      merits: s.merits,
      deaths: s.t4Deaths + s.t5Deaths
    }));

    return reconcileSnapshots(prevRecords, newRecords);
  }, [prevSessionId, newSessionId, snapshots]);

  // Separate Immigrants (Arrivals) and Migrated (Departures)
  const { immigrants, departures, retainedCount } = useMemo(() => {
    const imms: typeof reconciledPlayers = [];
    const deps: typeof reconciledPlayers = [];
    let retCount = 0;

    reconciledPlayers.forEach((p) => {
      if (p.migrationStatus === "IMMIGRATED") {
        imms.push(p);
      } else if (p.migrationStatus === "MIGRATED") {
        deps.push(p);
      } else {
        retCount++;
      }
    });

    return { immigrants: imms, departures: deps, retainedCount: retCount };
  }, [reconciledPlayers]);

  // Search filter for docks
  const filteredImmigrants = useMemo(() => {
    if (!searchQuery.trim()) return immigrants;
    const q = searchQuery.toLowerCase();
    return immigrants.filter((p) => p.name.toLowerCase().includes(q) || p.characterId.toLowerCase().includes(q));
  }, [immigrants, searchQuery]);

  const filteredDepartures = useMemo(() => {
    if (!searchQuery.trim()) return departures;
    const q = searchQuery.toLowerCase();
    return departures.filter((p) => p.name.toLowerCase().includes(q) || p.characterId.toLowerCase().includes(q));
  }, [departures, searchQuery]);

  // CSV Report Exporter
  const handleExportCSV = () => {
    const prevSess = sortedSessions.find((s) => s.id === prevSessionId);
    const newSess = sortedSessions.find((s) => s.id === newSessionId);
    const prevDate = prevSess ? formatSessionDate(prevSess) : "baseline";
    const newDate = newSess ? formatSessionDate(newSess) : "target";

    const rows = [
      ["Lord ID", "Lord Name", "Migration Flow", "Previous Power", "New Power", "Merits Delta"],
      ...filteredImmigrants.map((p) => [p.characterId, p.name, "IMMIGRATED (Inbound)", "0", p.power, p.merits]),
      ...filteredDepartures.map((p) => [p.characterId, p.name, "MIGRATED (Outbound)", p.power, "0", p.merits])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `migration_reconciler_${prevDate}_vs_${newDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const netFlow = immigrants.length - departures.length;

  return (
    <div className="space-y-8 pb-12 font-sans text-gothic-silver">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gothic-silver/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#89A6B8] uppercase tracking-widest">
            <ArrowRightLeft size={14} /> Differential Migration Audit
          </div>
          <h1 className="text-3xl font-display font-bold text-gothic-silver tracking-tight mt-1">
            Migration Reconciler
          </h1>
          <p className="text-xs text-gothic-rose/70 font-mono">
            Track alliance movement between telemetry snapshots. Identify new arrivals and departed lords.
          </p>
        </div>

        {/* CSV Export Action */}
        <button
          onClick={handleExportCSV}
          disabled={reconciledPlayers.length === 0}
          className="px-4 py-2 bg-gothic-velvet hover:bg-gothic-void text-gothic-silver border border-gothic-silver/20 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
        >
          <Download size={14} /> Export Migration Audit (CSV)
        </button>
      </div>

      {/* Snapshot Date Selectors */}
      <div className="p-6 bg-gothic-velvet border border-gothic-silver/20 rounded-xl space-y-4 shadow-xl">
        <h2 className="text-xs font-bold text-gothic-silver uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers size={14} className="text-[#89A6B8]" /> Select Telemetry Snapshots
        </h2>

        {sortedSessions.length < 2 ? (
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-300 flex items-center gap-2">
            <AlertTriangle size={16} /> Requires at least two (2) separate snapshot imports in the Ingestion Workspace to compare differential migration.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Baseline Select */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-gothic-rose/50 font-mono">
                Baseline Snapshot Date
              </label>
              <select
                value={prevSessionId}
                onChange={(e) => setPrevSessionId(e.target.value)}
                className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-silver p-2.5 rounded-lg outline-none focus:border-[#89A6B8] cursor-pointer font-mono"
              >
                {sortedSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSessionDate(s)} ({s.rowCount || 0} players)
                  </option>
                ))}
              </select>
            </div>

            {/* Direction Arrow */}
            <div className="flex items-center justify-center p-2 text-gothic-rose/40">
              <ArrowRight size={22} className="hidden md:block text-[#89A6B8]" />
            </div>

            {/* Target Select */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-gothic-rose/50 font-mono">
                Target Snapshot Date
              </label>
              <select
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value)}
                className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-silver p-2.5 rounded-lg outline-none focus:border-[#89A6B8] cursor-pointer font-mono"
              >
                {sortedSessions.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === prevSessionId}>
                    {formatSessionDate(s)} ({s.rowCount || 0} players) {s.id === prevSessionId ? "(Baseline)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Migration Stats Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-center">
          <span className="text-blue-300/80 text-[10px] uppercase font-bold block">Immigrants (Arrivals)</span>
          <span className="text-2xl font-bold text-blue-200 mt-1 block">+{immigrants.length}</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
          <span className="text-amber-300/80 text-[10px] uppercase font-bold block">Migrated (Departures)</span>
          <span className="text-2xl font-bold text-amber-200 mt-1 block">-{departures.length}</span>
        </div>

        <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-center">
          <span className="text-gothic-rose/60 text-[10px] uppercase font-bold block">Net Migration Flow</span>
          <span className={`text-2xl font-bold mt-1 block ${netFlow >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
            {netFlow >= 0 ? `+${netFlow}` : netFlow}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-center">
          <span className="text-gothic-rose/60 text-[10px] uppercase font-bold block">Retained Unchanged</span>
          <span className="text-2xl font-bold text-gothic-silver mt-1 block">{retainedCount}</span>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-gothic-rose/40" />
        <input
          type="text"
          placeholder="Filter migration docks by Lord Name or Character ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-silver pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#89A6B8] transition-all font-mono"
        />
      </div>

      {/* SEPARATE DOCKS FOR IMMIGRANTS & MIGRATED PLAYERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* DOCK 1: IMMIGRANTS (NEW ARRIVALS) */}
        <div className="p-6 bg-gothic-velvet border border-blue-500/30 rounded-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-200 font-display uppercase tracking-wider">
                  Immigrant Arrivals ({filteredImmigrants.length})
                </h3>
                <p className="text-[10px] text-blue-300/70 font-mono">
                  New lords appearing in target snapshot
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded text-[10px] font-mono font-bold">
              +{filteredImmigrants.length} Inbound
            </span>
          </div>

          {filteredImmigrants.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-gothic-rose/50 border border-dashed border-gothic-silver/10 rounded-lg">
              No immigrant arrivals detected between selected snapshots.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredImmigrants.map((p) => (
                <div
                  key={p.characterId}
                  className="p-3 bg-gothic-ink border border-blue-500/20 hover:border-blue-500/40 rounded-lg flex items-center justify-between gap-3 text-xs transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-gothic-silver font-mono block">{p.name}</span>
                    <span className="text-[10px] text-gothic-rose/50 font-mono block">ID: {p.characterId}</span>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="block font-bold text-blue-300">{formatWholeNumber(p.power)} Power</span>
                    <span className="text-[10px] text-gothic-rose/60 block">{formatWholeNumber(p.merits)} Merits</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DOCK 2: MIGRATED / DEPARTED (OUTBOUND) */}
        <div className="p-6 bg-gothic-velvet border border-amber-500/30 rounded-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
                <UserMinus size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200 font-display uppercase tracking-wider">
                  Migrated Departures ({filteredDepartures.length})
                </h3>
                <p className="text-[10px] text-amber-300/70 font-mono">
                  Lords present in baseline but missing from target
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold">
              -{filteredDepartures.length} Outbound
            </span>
          </div>

          {filteredDepartures.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-gothic-rose/50 border border-dashed border-gothic-silver/10 rounded-lg">
              No migrated departures detected between selected snapshots.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredDepartures.map((p) => (
                <div
                  key={p.characterId}
                  className="p-3 bg-gothic-ink border border-amber-500/20 hover:border-amber-500/40 rounded-lg flex items-center justify-between gap-3 text-xs transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-gothic-silver font-mono block">{p.name}</span>
                    <span className="text-[10px] text-gothic-rose/50 font-mono block">ID: {p.characterId}</span>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="block font-bold text-amber-300">{formatWholeNumber(p.power)} Last Power</span>
                    <span className="text-[10px] text-gothic-rose/60 block">{formatWholeNumber(p.merits)} Merits</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
