import React, { useState } from "react";
import { Trash2, Plus, AlertTriangle, Calendar, FileCode, FileSpreadsheet, FileText, ChevronUp, ChevronDown, Map, Check } from "lucide-react";
import { Snapshot, ImportSession } from "../../types";
import { FileDraft } from "../ImportTab";
import { formatBytes, parseFarlightFilenameInfo, parseNumericValue } from "../../utils/importParsers";

interface DraftEditorCardProps {
  draft: FileDraft;
  importSessions: ImportSession[];
  snapshots: Snapshot[];
  onDraftDateChange: (draftId: string, newDate: string) => void;
  onDraftNameChange: (draftId: string, newName: string) => void;
  onDraftSourceChange: (draftId: string, source: "DragonStats" | "Farlight" | "Manual") => void;
  onCellChange: (draftId: string, snapId: string, field: keyof Snapshot, value: any) => void;
  onDeleteRow: (draftId: string, snapId: string) => void;
  onHeaderMapChange: (draftId: string, rawHeader: string, canonicalKey: string) => void;
  toggleDraftExpansion: (draftId: string) => void;
  toggleMappingExpansion: (draftId: string) => void;
  onDeleteDraft: (draftId: string) => void;
  onAddPlayerSubmit: (draftId: string, formValues: Partial<Snapshot>) => void;
  getDuplicateDateInfo: (dateStr: string, currentDraftId?: string) => any;
  onOpenDuplicateModal: (draftId: string, filename: string, date: string, matchingSessions: any[], count: number) => void;
  onDeleteSession: (sessionId: string) => void;
  CANONICAL_FIELDS: Array<{ key: string; label: string }>;
}

export default function DraftEditorCard({
  draft,
  onDraftDateChange,
  onDraftNameChange,
  onDraftSourceChange,
  onCellChange,
  onDeleteRow,
  onHeaderMapChange,
  toggleDraftExpansion,
  toggleMappingExpansion,
  onDeleteDraft,
  onAddPlayerSubmit,
  getDuplicateDateInfo,
  onOpenDuplicateModal,
  onDeleteSession,
  CANONICAL_FIELDS
}: DraftEditorCardProps) {
  const [showAllRows, setShowAllRows] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Snapshot>>({});
  const dupInfo = getDuplicateDateInfo(draft.date, draft.id);
  const farlightInfo = parseFarlightFilenameInfo(draft.filename);

  return (
    <div className="bg-gothic-velvet rounded-xl border border-gothic-silver/20 overflow-hidden transition-all shadow-md">
      
      {/* Draft Header Bar */}
      <div className="p-4 bg-gothic-ink/40 border-b border-gothic-silver/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-gothic-void border border-gothic-silver/20">
            {draft.fileType === "json" ? <FileCode size={18} className="text-[#D4B26A]" /> : draft.fileType === "csv" ? <FileText size={18} className="text-[#7FA8C9]" /> : <FileSpreadsheet size={18} className="text-[#7FB685]" />}
          </div>
          <div className="space-y-0.5">
            <input
              type="text"
              value={draft.filename}
              onChange={(e) => onDraftNameChange(draft.id, e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-[#77777A] focus:border-gothic-silver focus:outline-none text-sm font-bold text-gothic-silver font-mono px-0.5"
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gothic-rose/50 font-mono">
              <span>{formatBytes(draft.fileSize)}</span>
              <span>•</span>
              <span className="uppercase text-[#89A6B8] font-bold">{draft.fileType}</span>
              <span>•</span>
              <span>{draft.snapshots.length} records</span>
              {farlightInfo && (
                <>
                  <span>•</span>
                  <span className="text-[#89A6B8] bg-[#89A6B8]/10 px-1.5 py-0.2 rounded border border-[#89A6B8]/20">
                    Server {farlightInfo.server} ({farlightInfo.startDate} to {farlightInfo.endDate})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dupInfo.isDuplicate && (
            <div className="px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <AlertTriangle size={12} className="text-amber-400 shrink-0" />
              <span>DUPLICATE DATE: {dupInfo.sanitizedDate}</span>
            </div>
          )}

          <div className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border ${draft.dateAutoDetected ? "bg-amber-950/20 border-amber-900/40 text-gothic-silver" : "bg-gothic-void border-gothic-silver/20 text-gothic-rose/50"}`}>
            <Calendar size={10} />
            {draft.dateAutoDetected ? "Filename Date Match" : "Assigned Date"}
          </div>

          <button
            onClick={() => toggleMappingExpansion(draft.id)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1 ${draft.isMappingExpanded ? "bg-gothic-silver border-gothic-silver text-[#111113]" : "bg-gothic-void border-gothic-silver/20 text-gothic-rose/90 hover:bg-gothic-ink"}`}
          >
            <Map size={12} /> Map Headers
          </button>

          <button onClick={() => toggleDraftExpansion(draft.id)} className="p-1.5 rounded bg-gothic-void border border-gothic-silver/20 hover:bg-gothic-ink text-gothic-rose/90 cursor-pointer">
            {draft.isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button onClick={() => onDeleteDraft(draft.id)} className="p-1.5 rounded bg-red-950/10 border border-red-900/30 text-red-400 hover:bg-red-950/30 cursor-pointer" title="Remove Draft">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Duplicate Date Warning Banner */}
      {dupInfo.isDuplicate && (
        <div className="p-3.5 bg-amber-950/30 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-300 font-mono">Duplicate Telemetry Date Flagged ({dupInfo.sanitizedDate})</h4>
              <p className="text-gothic-rose/80 text-[11px]">Telemetry for this date is already recorded in the system.</p>
            </div>
          </div>
          <button
            onClick={() => onOpenDuplicateModal(draft.id, draft.filename, dupInfo.sanitizedDate, dupInfo.matchingSessions, dupInfo.matchingSnapshotsCount)}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold cursor-pointer"
          >
            Review Options
          </button>
        </div>
      )}

      {/* Mapping Section */}
      {draft.isMappingExpanded && (
        <div className="border-b border-gothic-silver/20 bg-gothic-void/60 p-5">
          <h4 className="text-xs font-bold text-gothic-silver uppercase mb-3 flex items-center gap-1"><Map size={12} /> Column Mapping Configuration</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-2">
            {Object.entries(draft.mappedHeaders).map(([rawHeader, canonical]) => (
              <div key={rawHeader} className="flex items-center justify-between p-2 rounded bg-gothic-void border border-gothic-silver/20 text-xs font-mono">
                <span className="text-gothic-rose/50 truncate max-w-[120px] font-bold">{rawHeader}</span>
                <select
                  value={canonical}
                  onChange={(e) => onHeaderMapChange(draft.id, rawHeader, e.target.value)}
                  className="bg-gothic-ink border border-gothic-silver/20 text-[11px] text-gothic-rose/90 px-1.5 py-0.5 rounded outline-none cursor-pointer"
                >
                  <option value="unknown">Ignore Column</option>
                  {CANONICAL_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draft Spreadsheet Table Workspace */}
      {draft.isExpanded && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-1 space-y-4">
              <div className="p-4 rounded-xl bg-gothic-void border border-gothic-silver/20 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gothic-rose/50 font-mono border-b border-gothic-silver/20 pb-1.5">File Context Controls</h4>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block">Ledger Date Record</label>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) => onDraftDateChange(draft.id, e.target.value)}
                    className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs font-mono text-gothic-silver p-2 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block">Platform Source</label>
                  <select
                    value={draft.source}
                    onChange={(e) => onDraftSourceChange(draft.id, e.target.value as any)}
                    className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-rose/90 p-2 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="DragonStats">DragonStats</option>
                    <option value="Farlight">Farlight</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="xl:col-span-3 space-y-4">
              <div className="rounded-lg border border-gothic-silver/20 overflow-hidden bg-gothic-void">
                <div className="p-3 bg-gothic-velvet border-b border-gothic-silver/20 flex justify-between items-center">
                  <h4 className="text-[11px] font-bold uppercase text-gothic-rose/50 font-mono">Spreadsheet Records Editor</h4>
                  <span className="text-[10px] font-mono text-gothic-silver bg-gothic-silver/10 px-2 py-0.5 rounded border border-gothic-silver/20">{draft.snapshots.length} Rows</span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-gothic-void border-b border-gothic-silver/20 text-[10px] uppercase font-bold text-gothic-rose/50 font-mono">
                        <th className="p-2 pl-3">Lord ID</th>
                        <th className="p-2">Lord Name</th>
                        <th className="p-2 w-16">Tag</th>
                        <th className="p-2 text-right">Power</th>
                        <th className="p-2 text-right">Merits</th>
                        <th className="p-2 text-right">T4 Deaths</th>
                        <th className="p-2 text-right">T5 Deaths</th>
                        <th className="p-2 text-right">Healing</th>
                        <th className="p-2 text-center w-10">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232328] font-mono">
                      {(showAllRows ? draft.snapshots : draft.snapshots.slice(0, 50)).map((snap) => (
                        <tr key={snap.id} className="hover:bg-gothic-ink/40 text-xs">
                          <td className="p-2 pl-3 text-gothic-rose/50 font-semibold">{snap.playerId}</td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={snap.playerName}
                              onChange={(e) => onCellChange(draft.id, snap.id, "playerName", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-gothic-silver"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={snap.allianceTag || ""}
                              onChange={(e) => onCellChange(draft.id, snap.id, "allianceTag", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-gothic-rose/90"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={snap.currentPower}
                              onChange={(e) => onCellChange(draft.id, snap.id, "currentPower", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-amber-300 font-bold"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={snap.merits}
                              onChange={(e) => onCellChange(draft.id, snap.id, "merits", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-cyan-400 font-semibold"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={snap.t4Deaths}
                              onChange={(e) => onCellChange(draft.id, snap.id, "t4Deaths", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-red-400"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={snap.t5Deaths}
                              onChange={(e) => onCellChange(draft.id, snap.id, "t5Deaths", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-red-500 font-semibold"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              value={snap.healing}
                              onChange={(e) => onCellChange(draft.id, snap.id, "healing", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-emerald-400"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button onClick={() => onDeleteRow(draft.id, snap.id)} className="p-1 text-red-400 hover:text-red-300 cursor-pointer" title="Delete record">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {draft.snapshots.length > 50 && (
                  <div className="p-2.5 bg-gothic-ink border-t border-gothic-silver/20 flex justify-between items-center text-[10px] font-mono text-gothic-rose/70">
                    <span>Showing {showAllRows ? draft.snapshots.length : 50} of {draft.snapshots.length} parsed records.</span>
                    <button type="button" onClick={() => setShowAllRows(!showAllRows)} className="text-gothic-silver hover:text-amber-300 underline cursor-pointer">
                      {showAllRows ? "Show First 50" : `Show All ${draft.snapshots.length}`}
                    </button>
                  </div>
                )}

                {/* Manual row appending form */}
                <div className="p-3.5 bg-gothic-ink/20 border-t border-gothic-silver/20 space-y-2.5">
                  <h5 className="text-[10px] font-bold text-gothic-silver uppercase font-mono tracking-wider flex items-center gap-1">
                    <Plus size={12} /> Manually Append Lord Character Row
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    <input type="text" placeholder="Lord ID" value={addForm.playerId || ""} onChange={(e) => setAddForm({ ...addForm, playerId: e.target.value })} className="bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none" />
                    <input type="text" placeholder="Lord Name" value={addForm.playerName || ""} onChange={(e) => setAddForm({ ...addForm, playerName: e.target.value })} className="bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none" />
                    <input type="number" placeholder="Power" value={addForm.currentPower || ""} onChange={(e) => setAddForm({ ...addForm, currentPower: Number(e.target.value) })} className="bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none" />
                    <input type="number" placeholder="Merits" value={addForm.merits || ""} onChange={(e) => setAddForm({ ...addForm, merits: Number(e.target.value) })} className="bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none" />
                    <input type="number" placeholder="Deaths" value={addForm.t4Deaths || ""} onChange={(e) => setAddForm({ ...addForm, t4Deaths: Number(e.target.value) })} className="bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none" />
                    <button onClick={() => { onAddPlayerSubmit(draft.id, addForm); setAddForm({}); }} className="bg-gothic-silver hover:bg-white text-[#111113] font-bold text-[10px] rounded p-1.5 cursor-pointer flex items-center justify-center gap-1">
                      <Plus size={10} /> Add
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}