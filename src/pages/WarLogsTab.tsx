import React, { useState, useEffect } from "react";
import { 
  Scroll, 
  Sword, 
  Skull, 
  ShieldAlert, 
  Award, 
  Search, 
  X, 
  MapPin, 
  Trash2, 
  Clock, 
  UserCheck, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { WarLogEntry, Player, Snapshot, AllianceSettings } from "../types"; // FIX: Added missing types
import WarLogStatsSummary from "../components/WarLogs/WarLogStatsSummary";
import WarLogModal from "../components/WarLogs/WarLogModal";

// FIX: Aligned interface with App.tsx payload and standard prop naming
interface WarLogsTabProps {
  players?: Player[];
  snapshots?: Snapshot[];
  settings?: AllianceSettings;
  setSelectedPlayerId?: (characterId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const initialWarLogs: WarLogEntry[] = [];

export default function WarLogsTab({ 
  players = [], // FIX: Default array to prevent undefined crashes
  snapshots = [], 
  settings, 
  setSelectedPlayerId, 
  onNavigateToTab 
}: WarLogsTabProps) {
  const [logs, setLogs] = useState<WarLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem("dragon_council_war_logs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return initialWarLogs;
  });

  useEffect(() => {
    try {
      localStorage.setItem("dragon_council_war_logs", JSON.stringify(logs));
    } catch (_) {}
  }, [logs]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newActor, setNewActor] = useState("");
  const [newSeverity, setNewSeverity] = useState<"DIPLOMATIC" | "VANGUARD" | "CRITICAL" | "SYSTEM">("VANGUARD");
  const [newZone, setNewZone] = useState("");
  const [newCoords, setNewCoords] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newActor.trim() || !newDescription.trim()) {
      alert("Please provide Title, Commander/Actor, and Description.");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newLog: WarLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: formattedDate,
      title: newTitle.trim(),
      actor: newActor.trim(),
      severity: newSeverity,
      zone: newZone.trim() || "Frontline Zone",
      locationCoordinates: newCoords.trim() || undefined,
      description: newDescription.trim(),
      recordedBy: "Command Officer"
    };

    setLogs((prev) => [newLog, ...prev]);

    setNewTitle("");
    setNewActor("");
    setNewSeverity("VANGUARD");
    setNewZone("");
    setNewCoords("");
    setNewDescription("");
    setIsAddModalOpen(false);
  };

  const handleDeleteLog = (id: string) => {
    if (confirm("Are you sure you want to remove this campaign war log entry?")) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.zone && log.zone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = selectedSeverity === "ALL" || log.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  }).sort((a, b) => {
    if (sortOrder === "NEWEST") {
      return b.id.localeCompare(a.id);
    } else {
      return a.id.localeCompare(b.id);
    }
  });

  const totalCount = logs.length;
  const vanguardCount = logs.filter((l) => l.severity === "VANGUARD").length;
  const criticalCount = logs.filter((l) => l.severity === "CRITICAL").length;
  const diplomaticCount = logs.filter((l) => l.severity === "DIPLOMATIC").length;

  const findMatchingPlayer = (actorName: string) => {
    if (!actorName || !players) return null;
    return players.find((p) => p.currentName.toLowerCase() === actorName.toLowerCase());
  };

  return (
    <div className="space-y-6">
      <WarLogStatsSummary
        totalCount={totalCount}
        vanguardCount={vanguardCount}
        criticalCount={criticalCount}
        diplomaticCount={diplomaticCount}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <div className="bg-[#222831] border border-[#4B5563]/30 rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B96A5]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search log title, commander name, or tactical details..."
            className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded-md pl-9 pr-4 py-2 text-xs text-[#F2F0E8] placeholder-[#8B96A5] focus:outline-none focus:border-[#D4B26A]"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B96A5] hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {[
            { id: "ALL", label: "All Logs" },
            { id: "VANGUARD", label: "Vanguard Honors" },
            { id: "CRITICAL", label: "Hazards" },
            { id: "DIPLOMATIC", label: "Pacts" },
            { id: "SYSTEM", label: "System Ledger" }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedSeverity(type.id)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                selectedSeverity === type.id
                  ? "bg-[#D4B26A] text-[#16181D] border border-[#D4B26A] shadow-[0_0_10px_rgba(212,178,106,0.3)]"
                  : "bg-[#16181D] text-[#C8CCD2]/70 border border-[#4B5563]/30 hover:text-white hover:bg-[#2F3743]"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === "NEWEST" ? "OLDEST" : "NEWEST")}
          className="flex items-center gap-1.5 bg-[#16181D] border border-[#4B5563]/30 px-3 py-2 rounded text-xs font-mono text-[#C8CCD2] hover:text-white cursor-pointer"
        >
          <Clock size={14} />
          <span>{sortOrder === "NEWEST" ? "Newest First" : "Oldest First"}</span>
        </button>
      </div>

      <div className="bg-[#222831] border border-[#4B5563]/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#4B5563]/30 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-[#D4B26A]" />
            <h3 className="font-display text-sm tracking-widest text-[#F2F0E8] uppercase font-bold">
              Campaign Sequence ({filteredLogs.length} Records)
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[#8B96A5]">Immutable Operations Log</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#4B5563]/30 rounded-lg bg-[#16181D]/60">
            <ShieldAlert size={36} className="mx-auto text-[#8B96A5] mb-3" />
            <p className="font-display text-sm font-bold text-[#F2F0E8] uppercase tracking-wider mb-1">
              {logs.length === 0 ? "No War Logs Recorded Yet" : "No Matching War Logs Found"}
            </p>
            {logs.length === 0 ? (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-3 px-4 py-2 bg-[#D4B26A] hover:bg-[#c3a159] text-[#16181D] rounded text-xs font-bold font-mono transition-all cursor-pointer"
              >
                Record First War Log
              </button>
            ) : (
              <button
                onClick={() => { setSearchTerm(""); setSelectedSeverity("ALL"); }}
                className="mt-3 px-4 py-2 bg-[#2F3743] border border-[#D4B26A]/50 rounded text-xs font-mono text-[#D4B26A] hover:text-white transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="relative border-l-2 border-[#D4B26A]/40 ml-4 pl-6 space-y-8 relative z-10 my-2">
            {filteredLogs.map((log) => {
              const matchedPlayer = findMatchingPlayer(log.actor);

              return (
                <div key={log.id} className="relative group bg-[#16181D]/80 border border-[#4B5563]/30 hover:border-[#D4B26A]/60 p-5 rounded-lg transition-all shadow-lg">
                  <div className={`absolute -left-[35px] top-5 w-5 h-5 rounded-full border-2 bg-[#16181D] flex items-center justify-center transition-transform group-hover:scale-125 ${
                    log.severity === 'CRITICAL' ? 'border-[#B85A5A] text-[#B85A5A]' :
                    log.severity === 'VANGUARD' ? 'border-[#7FA8C9] text-[#7FA8C9]' :
                    log.severity === 'DIPLOMATIC' ? 'border-[#D9A441] text-[#D9A441]' : 'border-[#4B5563] text-[#C8CCD2]'
                  }`}>
                    {log.severity === 'CRITICAL' && <Skull size={10} />}
                    {log.severity === 'VANGUARD' && <Sword size={10} />}
                    {log.severity === 'DIPLOMATIC' && <Award size={10} />}
                    {log.severity === 'SYSTEM' && <Scroll size={10} />}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#4B5563]/20 pb-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display text-lg font-bold tracking-wide text-[#F2F0E8]">{log.title}</h4>
                        <span className="font-display text-[9px] tracking-widest px-2 py-0.5 rounded uppercase font-semibold bg-[#2F3743] border border-[#4B5563]/50 text-[#C8CCD2]">
                          {log.severity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#C8CCD2] pt-0.5">
                        <span>Led by</span>
                        <span className="font-semibold text-[#F2F0E8] bg-[#2F3743] px-2 py-0.5 rounded border border-[#4B5563]/30 flex items-center gap-1.5">
                          <UserCheck size={12} className="text-[#D4B26A]" />
                          {log.actor}
                        </span>

                        {matchedPlayer && setSelectedPlayerId && onNavigateToTab && ( // FIX: Updated function reference
                          <button
                            onClick={() => {
                              setSelectedPlayerId(matchedPlayer.characterId); // FIX: Trigger standard routing func
                              onNavigateToTab("players");
                            }}
                            className="text-[10px] text-[#D4B26A] hover:text-white font-mono bg-[#D4B26A]/15 hover:bg-[#D4B26A]/30 px-2 py-0.5 rounded border border-[#D4B26A]/40 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Profile</span>
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-start">
                      <time className="font-mono text-xs italic text-[#8B96A5] bg-[#16181D] px-2.5 py-1 rounded border border-[#4B5563]/30 whitespace-nowrap">
                        {log.timestamp}
                      </time>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-[#8B96A5] hover:text-[#B85A5A] transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[#F2F0E8]/90 leading-relaxed bg-[#16181D]/60 p-3 rounded border border-[#4B5563]/20 italic mb-3">
                    "{log.description}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8B96A5] pt-1">
                    <div className="flex items-center gap-3">
                      {log.zone && (
                        <span className="flex items-center gap-1 text-[#7FA8C9]">
                          <MapPin size={12} />
                          {log.zone}
                        </span>
                      )}
                      {log.locationCoordinates && (
                        <span className="text-[#8B96A5] border-l border-[#4B5563]/30 pl-3">
                          Grid: {log.locationCoordinates}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WarLogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLog}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newActor={newActor}
        setNewActor={setNewActor}
        newSeverity={newSeverity}
        setNewSeverity={setNewSeverity}
        newZone={newZone}
        setNewZone={setNewZone}
        newCoords={newCoords}
        setNewCoords={setNewCoords}
        newDescription={newDescription}
        setNewDescription={setNewDescription}
      />
    </div>
  );
}