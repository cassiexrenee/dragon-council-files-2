import React, { useState } from "react";
import { Download, Users } from "lucide-react";
import { 
  Player, 
  Snapshot, 
  PlayerClassification, 
  PerformanceEvaluation, 
  Recommendation,
  AllianceSettings,
  ImportSession
} from "../types";
import { getAggregatedPlayerSnapshot } from "../utils/Analytics";
import RosterFilterBar from "../components/Roster/RosterFilterBar";
import RosterTable from "../components/Roster/RosterTable";

// FIX: Updated interface to handle missing arrays, missing navigation hooks, and new subView props from App.tsx
interface RosterTabProps {
  players: Player[];
  snapshots: Snapshot[];
  classifications?: PlayerClassification[]; 
  evaluations?: PerformanceEvaluation[];
  recommendations?: Recommendation[];
  importSessions?: ImportSession[];
  setSelectedPlayerId?: (id: string) => void; // FIX: Aligned name with App.tsx
  onNavigateToTab?: (tab: string) => void;
  settings?: AllianceSettings;
  subView?: string; // FIX: Added missing prop from App.tsx
  setSubView?: (view: string) => void; // FIX: Added missing prop from App.tsx
}

export default function RosterTab({
  players = [],
  snapshots = [],
  evaluations = [], // FIX: Default array prevents undefined crash
  recommendations = [], // FIX: Default array prevents undefined crash
  setSelectedPlayerId,
  onNavigateToTab,
  settings,
  subView,
  setSubView
}: RosterTabProps) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [hideUnderBaseline, setHideUnderBaseline] = useState<boolean>(true);

  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 10000000;
  
  const [sortField, setSortField] = useState<"name" | "power" | "merits">("power");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredRows = players.map((p) => {
    const playerSnaps = snapshots.filter((s) => s.playerId === p.characterId);
    const aggregatedSnap = playerSnaps.length > 0 ? getAggregatedPlayerSnapshot(playerSnaps) : null;
    const evaluation = evaluations.find((e) => e.playerId === p.characterId);
    const recommendation = recommendations.find((r) => r.playerId === p.characterId); // FIX: Safe execution

    return {
      player: p,
      snapshot: aggregatedSnap,
      evaluation,
      recommendation
    };
  }).filter((row) => {
    const nameMatch = row.player.currentName.toLowerCase().includes(search.toLowerCase());
    const idMatch = row.player.characterId.toLowerCase().includes(search.toLowerCase());
    const tierMatch = tierFilter === "ALL" || row.evaluation?.performanceTier === tierFilter;
    const powerMatch = !hideUnderBaseline || ((row.snapshot?.currentPower || 0) >= powerBaseline);

    return (nameMatch || idMatch) && tierMatch && powerMatch;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    let aVal: any = "";
    let bVal: any = "";

    if (sortField === "name") {
      aVal = a.player.currentName;
      bVal = b.player.currentName;
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (sortField === "power") {
      aVal = a.snapshot?.currentPower || 0;
      bVal = b.snapshot?.currentPower || 0;
    }
    if (sortField === "merits") {
      aVal = a.snapshot?.merits || 0;
      bVal = b.snapshot?.merits || 0;
    }

    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (field: "name" | "power" | "merits") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Character Name",
      "Character ID",
      "Current Power",
      "Seasonal Merits",
      "Merit % of Power",
      "Performance Tier",
      "Action Recommendation"
    ];

    const rows = sortedRows.map((r) => [
      `"${r.player.currentName}"`,
      `"${r.player.characterId}"`,
      r.snapshot?.currentPower || 0,
      r.snapshot?.merits || 0,
      r.snapshot ? `${((r.snapshot.merits / Math.max(1, r.snapshot.currentPower)) * 100).toFixed(1)}%` : "0%",
      r.evaluation?.performanceTier || "MEETS",
      r.recommendation?.recommendation || "KEEP"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dragon_council_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // FIX: Safely wrap navigation functions to prevent runtime crashes if omitted by App.tsx
  const handleSelectPlayerSafe = (id: string) => {
    if (setSelectedPlayerId) setSelectedPlayerId(id);
  };

  const handleNavigateSafe = (tab: string) => {
    if (onNavigateToTab) onNavigateToTab(tab);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gothic-silver/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#89A6B8] uppercase tracking-widest">
            <Users size={14} /> Alliance Roster Directory
          </div>
          <h1 className="text-2xl font-display font-bold text-gothic-silver tracking-tight">
            Active Roster Ledger
          </h1>
          <p className="text-xs text-gothic-rose/70 font-mono mt-0.5">
            Registered alliance members and seasonal performance metrics.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer"
        >
          <Download size={13} />
          Export Roster CSV
        </button>
      </div>

      <RosterFilterBar
        search={search}
        setSearch={setSearch}
        tierFilter={tierFilter}
        setTierFilter={setTierFilter}
        hideUnderBaseline={hideUnderBaseline}
        setHideUnderBaseline={setHideUnderBaseline}
        powerBaseline={powerBaseline}
      />

      <RosterTable
        sortedRows={sortedRows}
        snapshots={snapshots}
        toggleSort={toggleSort}
        onSelectPlayer={handleSelectPlayerSafe} // FIX: Bound to safe wrapper
        onNavigateToTab={handleNavigateSafe} // FIX: Bound to safe wrapper
        playersCount={players.length}
      />
    </div>
  );
}