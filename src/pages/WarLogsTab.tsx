import React, { useState, useEffect } from "react";
import { 
  Scroll, 
  Sword, 
  Skull, 
  ShieldAlert, 
  Award, 
  Milestone, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ArrowRight,
  Shield,
  Sparkles
} from "lucide-react";
import { WarLogEntry, Player } from "../types";

interface WarLogsTabProps {
  players: Player[];
  onSelectPlayer?: (characterId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const initialWarLogs: WarLogEntry[] = [];

export default function WarLogsTab({ players, onSelectPlayer, onNavigateToTab }: WarLogsTabProps) {
  // Persistence state
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

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");

  // Modal State for New Log
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

    // Reset Form
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

  // Filtered Logs
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

  // Calculate Metrics
  const totalCount = logs.length;
  const vanguardCount = logs.filter((l) => l.severity === "VANGUARD").length;
  const criticalCount = logs.filter((l) => l.severity === "CRITICAL").length;
  const diplomaticCount = logs.filter((l) => l.severity === "DIPLOMATIC").length;

  // Helper to match actor with player list
  const findMatchingPlayer = (actorName: string) => {
    if (!actorName || !players) return null;
    return players.find((p) => p.currentName.toLowerCase() === actorName.toLowerCase());
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER CARD */}
      <div className="bg-[#222831] border border-[#4B5563]/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
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
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-[#D4B26A] hover:bg-[#c3a159] text-[#16181D] px-4 py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider border border-[#D4B26A]/60 shadow-[0_0_15px_rgba(212,178,106,0.3)] transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Record War Log</span>
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY HUB */}
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

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-[#222831] border border-[#4B5563]/30 rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
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
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B96A5] hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {[
            { id: "ALL", label: "All Logs" },
            { id: "VANGUARD", label: "Vanguard Honors", color: "border-[#7FA8C9] text-[#7FA8C9]" },
            { id: "CRITICAL", label: "Hazards", color: "border-[#B85A5A] text-[#B85A5A]" },
            { id: "DIPLOMATIC", label: "Pacts", color: "border-[#D9A441] text-[#D9A441]" },
            { id: "SYSTEM", label: "System Ledger", color: "border-[#4B5563] text-[#C8CCD2]" }
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

        {/* Sort Order Selector */}
        <button
          onClick={() => setSortOrder(sortOrder === "NEWEST" ? "OLDEST" : "NEWEST")}
          className="flex items-center gap-1.5 bg-[#16181D] border border-[#4B5563]/30 px-3 py-2 rounded text-xs font-mono text-[#C8CCD2] hover:text-white cursor-pointer"
        >
          <Clock size={14} />
          <span>{sortOrder === "NEWEST" ? "Newest First" : "Oldest First"}</span>
        </button>

      </div>

      {/* WAR LOGS CHRONICLE TIMELINE CONTAINER */}
      <div className="bg-[#222831] border border-[#4B5563]/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Corner Ornaments */}
        <div className="absolute top-2 left-2 text-[#4B5563]/40 font-display text-[10px]">✦</div>
        <div className="absolute top-2 right-2 text-[#4B5563]/40 font-display text-[10px]">✦</div>
        <div className="absolute bottom-2 left-2 text-[#4B5563]/40 font-display text-[10px]">✦</div>
        <div className="absolute bottom-2 right-2 text-[#4B5563]/40 font-display text-[10px]">✦</div>

        <div className="flex items-center justify-between border-b border-[#4B5563]/30 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-[#D4B26A]" />
            <h3 className="font-display text-sm tracking-widest text-[#F2F0E8] uppercase font-bold">
              Campaign Sequence ({filteredLogs.length} Records)
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[#8B96A5]">
            Immutable Operations Log
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#4B5563]/30 rounded-lg bg-[#16181D]/60">
            <ShieldAlert size={36} className="mx-auto text-[#8B96A5] mb-3" />
            <p className="font-display text-sm font-bold text-[#F2F0E8] uppercase tracking-wider mb-1">
              {logs.length === 0 ? "No War Logs Recorded Yet" : "No Matching War Logs Found"}
            </p>
            <p className="text-xs text-[#C8CCD2]/70 max-w-md mx-auto mb-4">
              {logs.length === 0
                ? "The chronicle is empty. Record your first campaign milestone, battlefield honor, or diplomatic event to begin the ledger."
                : "No chronicle entries match your current search criteria or severity filters."}
            </p>
            {logs.length === 0 ? (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-[#D4B26A] hover:bg-[#c3a159] text-[#16181D] rounded text-xs font-bold font-mono transition-all cursor-pointer"
              >
                Record First War Log
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSeverity("ALL");
                }}
                className="px-4 py-2 bg-[#2F3743] border border-[#D4B26A]/50 rounded text-xs font-mono text-[#D4B26A] hover:text-white transition-all cursor-pointer"
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
                  
                  {/* Timeline Node Icon Indicator */}
                  <div className={`absolute -left-[35px] top-5 w-5 h-5 rounded-full border-2 bg-[#16181D] flex items-center justify-center transition-transform group-hover:scale-125 ${
                    log.severity === 'CRITICAL' ? 'border-[#B85A5A] text-[#B85A5A] shadow-[0_0_10px_#B85A5A]' :
                    log.severity === 'VANGUARD' ? 'border-[#7FA8C9] text-[#7FA8C9] shadow-[0_0_10px_#7FA8C9]' :
                    log.severity === 'DIPLOMATIC' ? 'border-[#D9A441] text-[#D9A441] shadow-[0_0_8px_#D9A441]' : 'border-[#4B5563] text-[#C8CCD2]'
                  }`}>
                    {log.severity === 'CRITICAL' && <Skull size={10} />}
                    {log.severity === 'VANGUARD' && <Sword size={10} />}
                    {log.severity === 'DIPLOMATIC' && <Award size={10} />}
                    {log.severity === 'SYSTEM' && <Scroll size={10} />}
                  </div>

                  {/* Log Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#4B5563]/20 pb-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display text-lg font-bold tracking-wide text-[#F2F0E8]">
                          {log.title}
                        </h4>
                        
                        {/* Severity Badge */}
                        {log.severity === 'CRITICAL' && (
                          <span className="font-display text-[9px] tracking-widest text-[#B85A5A] bg-[#B85A5A]/15 border border-[#B85A5A]/40 px-2 py-0.5 rounded uppercase font-semibold">
                            Execution Hazard
                          </span>
                        )}
                        {log.severity === 'VANGUARD' && (
                          <span className="font-display text-[9px] tracking-widest text-[#7FA8C9] bg-[#7FA8C9]/15 border border-[#7FA8C9]/40 px-2 py-0.5 rounded uppercase font-semibold">
                            Combat Honor
                          </span>
                        )}
                        {log.severity === 'DIPLOMATIC' && (
                          <span className="font-display text-[9px] tracking-widest text-[#D9A441] bg-[#D9A441]/15 border border-[#D9A441]/40 px-2 py-0.5 rounded uppercase font-semibold">
                            Council Pact
                          </span>
                        )}
                        {log.severity === 'SYSTEM' && (
                          <span className="font-display text-[9px] tracking-widest text-[#C8CCD2] bg-[#2F3743] border border-[#4B5563]/50 px-2 py-0.5 rounded uppercase font-semibold">
                            Ledger Entry
                          </span>
                        )}
                      </div>

                      {/* Actor / Commander Metadata */}
                      <div className="flex items-center gap-2 text-xs text-[#C8CCD2] pt-0.5">
                        <span>Led by</span>
                        <span className="font-semibold text-[#F2F0E8] bg-[#2F3743] px-2 py-0.5 rounded border border-[#4B5563]/30 flex items-center gap-1.5">
                          <UserCheck size={12} className="text-[#D4B26A]" />
                          {log.actor}
                        </span>

                        {matchedPlayer && onSelectPlayer && onNavigateToTab && (
                          <button
                            onClick={() => {
                              onSelectPlayer(matchedPlayer.characterId);
                              onNavigateToTab("players");
                            }}
                            className="text-[10px] text-[#D4B26A] hover:text-white font-mono bg-[#D4B26A]/15 hover:bg-[#D4B26A]/30 px-2 py-0.5 rounded border border-[#D4B26A]/40 transition-all flex items-center gap-1 cursor-pointer"
                            title="View Player Workspace Profile"
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
                        className="text-[#8B96A5] hover:text-[#B85A5A] transition-colors p-1"
                        title="Remove log entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Description Copy */}
                  <p className="text-sm text-[#F2F0E8]/90 leading-relaxed bg-[#16181D]/60 p-3 rounded border border-[#4B5563]/20 italic mb-3">
                    "{log.description}"
                  </p>

                  {/* Zone & Location Footer */}
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
                    {log.recordedBy && (
                      <span className="text-[10px] text-[#8B96A5]">
                        Recorder: {log.recordedBy}
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* RECORD NEW WAR LOG MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#222831] border border-[#4B5563]/50 rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-[#C8CCD2]/60 hover:text-white text-sm font-display cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-[#4B5563]/30 pb-4 mb-5">
              <div className="p-2.5 rounded bg-[#D4B26A]/20 border border-[#D4B26A]/50 text-[#D4B26A]">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#F2F0E8]">
                  Record Campaign War Log
                </h3>
                <p className="text-xs text-[#C8CCD2]/70">
                  Log battlefield milestones, vanguard breaches, diplomatic pacts, or execution hazard warnings into the permanent chronicle.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4 text-xs">
              
              {/* Event Title */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#C8CCD2]">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Pass 3 Gatehouse Siege & Breach"
                  className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4B26A]"
                />
              </div>

              {/* Grid: Commander & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#C8CCD2]">
                    Lead Commander / Actor *
                  </label>
                  <input
                    type="text"
                    required
                    value={newActor}
                    onChange={(e) => setNewActor(e.target.value)}
                    placeholder="e.g. Warmonger, Hecate, Officer Sam"
                    className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4B26A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#C8CCD2]">
                    Classification Category *
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4B26A]"
                  >
                    <option value="VANGUARD">VANGUARD (Combat Honor)</option>
                    <option value="CRITICAL">CRITICAL (Execution Hazard)</option>
                    <option value="DIPLOMATIC">DIPLOMATIC (Council Pact)</option>
                    <option value="SYSTEM">SYSTEM (Ledger Entry)</option>
                  </select>
                </div>

              </div>

              {/* Grid: Zone & Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#C8CCD2]">
                    Campaign Zone / Phase
                  </label>
                  <input
                    type="text"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    placeholder="e.g. Zone 3 - Flame Dragon Ridge"
                    className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4B26A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-[#C8CCD2]">
                    Grid Coordinates (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCoords}
                    onChange={(e) => setNewCoords(e.target.value)}
                    placeholder="e.g. K12: X:482 Y:910"
                    className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4B26A]"
                  />
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#C8CCD2]">
                  Tactical Details & Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide tactical context, merit output, resource transfers, or diplomatic terms..."
                  className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4B26A]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#4B5563]/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#16181D] border border-[#4B5563]/40 rounded text-xs text-[#C8CCD2] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D4B26A] hover:bg-[#c3a159] text-[#16181D] rounded text-xs font-bold font-display uppercase tracking-wider border border-[#D4B26A]/60 shadow-[0_0_12px_rgba(212,178,106,0.3)] transition-all cursor-pointer"
                >
                  Save Log Entry
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
