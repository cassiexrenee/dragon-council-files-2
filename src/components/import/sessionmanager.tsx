import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, FileSpreadsheet, FileText, FileCode, Plus, 
  Trash2, ListFilter, AlertTriangle, AlertCircle 
} from "lucide-react";
import { ImportSession, Snapshot } from "../../types";

interface SessionManagerProps {
  importSessions: ImportSession[];
  snapshots: Snapshot[];
  onRenameSession: (id: string, newName: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function SessionManager({ importSessions, snapshots, onRenameSession, onDeleteSession }: SessionManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [inspectedSessionId, setInspectedSessionId] = useState<string | null>(null);
  const [inspectSearchQuery, setInspectSearchQuery] = useState("");

  const filteredSessions = importSessions.filter((session) => {
    const matchesSearch = session.filename.toLowerCase().includes(searchQuery.toLowerCase()) || session.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "ALL" || session.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const filteredSnapshotsTotal = filteredSessions.reduce((acc, s) => acc + snapshots.filter((snap) => snap.importId === s.id).length, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-gothic-velvet p-5 rounded-xl border border-gothic-silver/20 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search uploaded documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gothic-void border border-gothic-silver/20 text-xs text-gothic-silver rounded-lg outline-none focus:border-gothic-silver"
          />
          <Database size={14} className="absolute left-3 top-3 text-gothic-rose/50" />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 bg-gothic-void border border-gothic-silver/20 text-xs text-gothic-rose/90 rounded-lg outline-none cursor-pointer"
        >
          <option value="ALL">All Sources</option>
          <option value="DragonStats">DragonStats</option>
          <option value="Farlight">Farlight</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gothic-velvet p-4 rounded-xl border border-gothic-silver/20 space-y-1">
          <span className="text-[10px] font-mono text-gothic-rose/50 uppercase tracking-wider block">Total Documents</span>
          <span className="text-xl font-bold font-display text-gothic-silver">{filteredSessions.length} Files</span>
        </div>
        <div className="bg-gothic-velvet p-4 rounded-xl border border-gothic-silver/20 space-y-1">
          <span className="text-[10px] font-mono text-gothic-rose/50 uppercase tracking-wider block">Total Records</span>
          <span className="text-xl font-bold font-display text-emerald-400">{filteredSnapshotsTotal} Snapshots</span>
        </div>
        <div className="bg-gothic-velvet p-4 rounded-xl border border-gothic-silver/20 space-y-1">
          <span className="text-[10px] font-mono text-gothic-rose/50 uppercase tracking-wider block">Average Density</span>
          <span className="text-xl font-bold font-display text-[#89A6B8]">{Math.round(filteredSnapshotsTotal / (filteredSessions.length || 1))} rows/file</span>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 bg-gothic-velvet rounded-xl border border-gothic-silver/20 text-gothic-rose/50 font-mono text-xs">
            No telemetry documents matched your filters.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const sessionSnaps = snapshots.filter((s) => s.importId === session.id);
            return (
              <div key={session.id} className="bg-gothic-velvet rounded-xl border border-gothic-silver/20 overflow-hidden transition-all hover:border-[#383840]">
                <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="p-3 rounded-lg border bg-gothic-void border-gothic-silver/20 text-gothic-silver">
                      {session.source === "Farlight" ? <FileCode size={20} /> : <FileSpreadsheet size={20} />}
                    </div>
                    <div className="space-y-1 flex-1">
                      {editingSessionId === session.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-gothic-void border border-gothic-silver text-xs text-gothic-silver px-2 py-1 rounded"
                          />
                          <button onClick={() => { onRenameSession(session.id, editingName); setEditingSessionId(null); }} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">Save</button>
                          <button onClick={() => setEditingSessionId(null)} className="px-2 py-1 bg-gothic-ink text-gothic-rose/90 rounded text-[10px] font-bold">Cancel</button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-bold text-gothic-silver flex items-center gap-1.5">
                          {session.filename}
                          <button onClick={() => { setEditingSessionId(session.id); setEditingName(session.filename); }} className="text-gothic-rose/50 hover:text-gothic-silver p-1"><Plus size={12} className="rotate-45" /></button>
                        </h3>
                      )}
                      <div className="text-[11px] font-mono text-gothic-rose/50 flex gap-4">
                        <span>Imported: {new Date(session.importedAt).toLocaleDateString()}</span>
                        <span>Source: {session.source}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 md:justify-end">
                    <button onClick={() => setInspectedSessionId(inspectedSessionId === session.id ? null : session.id)} className={`p-2 rounded-lg border transition-all ${inspectedSessionId === session.id ? "bg-gothic-silver/10 border-gothic-silver text-gothic-silver" : "bg-gothic-ink border-gothic-silver/20 text-gothic-rose/50 hover:text-gothic-rose/90"}`}><ListFilter size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(confirmDeleteId === session.id ? null : session.id)} className={`p-2 rounded-lg border transition-all ${confirmDeleteId === session.id ? "bg-red-950/20 border-red-500/50 text-red-400" : "bg-gothic-ink border-gothic-silver/20 text-gothic-rose/50 hover:text-red-400"}`}><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {confirmDeleteId === session.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-red-950/10 border-t border-red-900/30 p-4 flex justify-between items-center overflow-hidden">
                      <div className="flex gap-2.5 text-xs">
                        <AlertCircle size={16} className="text-red-400" />
                        <div><h4 className="font-bold text-red-200">Confirm Rollback</h4><p className="text-red-300/80">Purging {sessionSnaps.length} records.</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-gothic-ink text-gothic-rose/90 rounded text-[10px] font-mono">Abort</button>
                        <button onClick={() => { onDeleteSession(session.id); setConfirmDeleteId(null); }} className="px-3 py-1.5 bg-red-600 text-white rounded text-[10px] font-mono font-bold">Purge Records</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {inspectedSessionId === session.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-gothic-void border-t border-gothic-silver/20 p-4 space-y-3 overflow-hidden">
                      <input type="text" placeholder="Filter records..." value={inspectSearchQuery} onChange={(e) => setInspectSearchQuery(e.target.value)} className="px-2.5 py-1 bg-gothic-velvet border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver rounded w-full max-w-xs" />
                      <div className="overflow-x-auto max-h-72 overflow-y-auto border border-gothic-silver/20 rounded-lg">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="bg-gothic-velvet border-b border-gothic-silver/20 text-gothic-rose/50">
                            <tr><th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2 text-right">Power</th><th className="p-2 text-right">Merits</th></tr>
                          </thead>
                          <tbody>
                            {sessionSnaps.filter(s => s.playerId.includes(inspectSearchQuery) || s.playerName?.includes(inspectSearchQuery)).map(s => (
                              <tr key={s.id} className="border-b border-gothic-silver/20/40 text-gothic-rose/90">
                                <td className="p-2">{s.playerId}</td><td className="p-2 font-semibold text-gothic-silver">{s.playerName}</td><td className="p-2 text-right">{s.currentPower.toLocaleString()}</td><td className="p-2 text-right text-emerald-400">{s.merits.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}