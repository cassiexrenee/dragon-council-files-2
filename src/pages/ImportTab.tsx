// @ts-nocheck
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, Database, CheckCircle, X, AlertTriangle, 
  History as HistoryIcon, FileCode, FileText, FileSpreadsheet 
} from "lucide-react";
import * as XLSX from "xlsx";
import { Snapshot, Player, ImportSession } from "../types";

// Corrected component paths
import { CustomLoadingOverlay } from "../components/CustomLoadingBar"; 
import SessionManager from "../components/Import/SessionManager";
import DraftEditorCard from "../components/Import/DraftEditorCard";

// Consolidated parser imports
import { 
  CANONICAL_FIELDS, extractDateFromFilename, parseFarlightFilenameInfo, 
  sanitizeDateString, normalizeHeader, buildSnapshotsFromRaw, parseNumericValue 
} from "../utils/importParsers";
interface ImportTabProps {
  importSessions: ImportSession[];
  onImportSnapshots: (newPlayers: Player[], newSnapshots: Snapshot[], sessions: ImportSession[]) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newFilename: string) => void;
  snapshots: Snapshot[];
}

export interface FileDraft {
  id: string;
  filename: string;
  fileSize: number;
  fileType: "json" | "csv" | "excel";
  date: string;
  dateAutoDetected: boolean;
  source: "DragonStats" | "Farlight" | "Manual";
  rawRows: any[];
  mappedHeaders: Record<string, string>;
  snapshots: Snapshot[];
  warnings: string[];
  isExpanded: boolean;
  isMappingExpanded: boolean;
}

export default function ImportTab({ importSessions, onImportSnapshots, onDeleteSession, onRenameSession, snapshots }: ImportTabProps) {
  const [drafts, setDrafts] = useState<FileDraft[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsed" | "success" | "failed">("idle");
  const [activeMainTab, setActiveMainTab] = useState<"upload" | "manager">("upload");
  const [dragActive, setDragActive] = useState(false);
  
  const [isCommitLoading, setIsCommitLoading] = useState(false);
  const [commitProgress, setCommitProgress] = useState(0);
  
  const [duplicateModalState, setDuplicateModalState] = useState<{
    isOpen: boolean;
    draftId: string;
    filename: string;
    date: string;
    matchingSessions: any[];
    matchingOtherDrafts: any[];
    totalExistingRecords: number;
    newDateValue: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDuplicateDateInfo = (dateStr: string, currentDraftId?: string) => {
    const sanitized = sanitizeDateString(dateStr);
    const matchingSnapshots = snapshots.filter((s) => s.recordedAt?.startsWith(sanitized));
    const matchingSessionIds = Array.from(new Set(matchingSnapshots.map((s) => s.importId)));
    return {
      sanitizedDate: sanitized,
      matchingSnapshotsCount: matchingSnapshots.length,
      matchingSessions: importSessions.filter((sess) => matchingSessionIds.includes(sess.id)),
      matchingOtherDrafts: drafts.filter((d) => d.id !== currentDraftId && sanitizeDateString(d.date) === sanitized),
      isDuplicate: matchingSessionIds.length > 0 || drafts.some((d) => d.id !== currentDraftId && sanitizeDateString(d.date) === sanitized)
    };
  };

  const createDraftFromFile = (filename: string, fileSize: number, fileType: "json" | "csv" | "excel", date: string, dateAutoDetected: boolean, source: any, rawRows: any[]) => {
    if (rawRows.length === 0) return alert(`File "${filename}" contains no legible rows!`);
    
    const draftId = `draft_${Date.now()}`;
    const rawHeadersSet = new Set<string>();
    rawRows.forEach((row) => { if (typeof row === "object" && row !== null) Object.keys(row).forEach((k) => rawHeadersSet.add(k)); });
    
    const mappedHeaders: Record<string, string> = {};
    Array.from(rawHeadersSet).forEach((rh) => mappedHeaders[rh] = normalizeHeader(rh));

    const { snapshots: newSnaps, warnings } = buildSnapshotsFromRaw(rawRows, mappedHeaders, date, source, draftId);
    
    setDrafts((prev) => [...prev, {
      id: draftId, filename, fileSize, fileType, date: sanitizeDateString(date), dateAutoDetected,
      source, rawRows, mappedHeaders, snapshots: newSnaps, warnings, isExpanded: true, isMappingExpanded: false
    }]);
    setImportStatus("parsed");
  };

  const handleFilesUpload = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const filename = file.name;
      const detectedDateStr = extractDateFromFilename(filename);
      const date = detectedDateStr || new Date().toISOString().split("T")[0];
      const source = filename.toLowerCase().includes("farlight") || parseFarlightFilenameInfo(filename) ? "Farlight" : "DragonStats";
      const fileType = filename.endsWith(".json") ? "json" : filename.endsWith(".csv") ? "csv" : "excel";

      const reader = new FileReader();
      if (fileType === "json") {
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target?.result as string);
            createDraftFromFile(filename, file.size, fileType, date, !!detectedDateStr, source, Array.isArray(parsed) ? parsed : [parsed]);
          } catch (err) { alert(`JSON Parse Error: ${err}`); }
        };
        reader.readAsText(file);
      } else {
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: "array" });
            const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
            createDraftFromFile(filename, file.size, fileType, date, !!detectedDateStr, source, rawRows);
          } catch (err) { alert(`Excel/CSV Parse Error: ${err}`); }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files[0]) handleFilesUpload(e.dataTransfer.files); };

  const handleDraftDateChange = (draftId: string, newDate: string) => {
    const sanitized = sanitizeDateString(newDate);
    setDrafts((prev) => prev.map((d) => d.id === draftId ? { ...d, date: sanitized, snapshots: d.snapshots.map(s => ({ ...s, recordedAt: `${sanitized}T12:00:00.000Z` })) } : d));
  };

  const handleDraftNameChange = (draftId: string, newName: string) => {
    setDrafts((prev) => prev.map((d) => d.id === draftId ? { ...d, filename: newName } : d));
  };

  const handleDraftSourceChange = (draftId: string, source: any) => {
    setDrafts((prev) => prev.map((d) => d.id === draftId ? { ...d, source } : d));
  };

  const handleCellChange = (draftId: string, snapId: string, field: keyof Snapshot, value: any) => {
    setDrafts((prev) => prev.map((d) => {
      if (d.id !== draftId) return d;
      return {
        ...d,
        snapshots: d.snapshots.map((s) => {
          if (s.id !== snapId) return s;
          const val = typeof s[field] === "number" ? parseNumericValue(value) : value;
          return { ...s, [field]: val, highestPower: field === "currentPower" ? Math.max(s.highestPower, val) : s.highestPower };
        })
      };
    }));
  };

  const handleDeleteRow = (draftId: string, snapId: string) => {
    setDrafts((prev) => prev.map((d) => d.id === draftId ? { ...d, snapshots: d.snapshots.filter((s) => s.id !== snapId) } : d));
  };

  const handleHeaderMapChange = (draftId: string, rawHeader: string, canonicalKey: string) => {
    setDrafts((prev) => prev.map((d) => {
      if (d.id !== draftId) return d;
      const updatedMappedHeaders = { ...d.mappedHeaders, [rawHeader]: canonicalKey };
      const { snapshots, warnings } = buildSnapshotsFromRaw(d.rawRows, updatedMappedHeaders, d.date, d.source, d.id);
      return { ...d, mappedHeaders: updatedMappedHeaders, snapshots, warnings };
    }));
  };

  const toggleDraftExpansion = (draftId: string) => {
    setDrafts((prev) => prev.map((d) => d.id === draftId ? { ...d, isExpanded: !d.isExpanded } : d));
  };

  const toggleMappingExpansion = (draftId: string) => {
    setDrafts((prev) => prev.map((d) => d.id === draftId ? { ...d, isMappingExpanded: !d.isMappingExpanded } : d));
  };

  const handleDeleteDraft = (draftId: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    if (drafts.length <= 1) setImportStatus("idle");
  };

  const handleAddPlayerSubmit = (draftId: string, formFields: Partial<Snapshot>) => {
    const characterId = (formFields.playerId || "").trim();
    if (!characterId) return alert("Lord Character ID is required.");
    
    setDrafts((prev) => prev.map((d) => {
      if (d.id !== draftId) return d;
      const newSnap: Snapshot = {
        id: `snap_draft_${characterId}_${d.id}_manual_${Date.now()}`,
        playerId: characterId,
        playerName: formFields.playerName || "Manually Added Lord",
        allianceId: "all_dragon_claw",
        allianceTag: "DCLW",
        importId: `import_${d.id}`,
        currentPower: parseNumericValue(formFields.currentPower),
        highestPower: parseNumericValue(formFields.currentPower),
        merits: parseNumericValue(formFields.merits),
        t4Deaths: parseNumericValue(formFields.t4Deaths),
        t5Deaths: 0,
        healing: 0, donations: 0, gathering: 0, resourceAssistance: 0, allianceHelp: 0, behemothWins: 0,
        recordedAt: `${sanitizeDateString(d.date)}T12:00:00.000Z`,
        createdAt: new Date().toISOString(),
      };
      return { ...d, snapshots: [...d.snapshots, newSnap] };
    }));
  };

  const handleBulkCommit = () => {
    if (drafts.length === 0) return;
    setIsCommitLoading(true);
    setCommitProgress(15);
    
    const interval = setInterval(() => setCommitProgress(p => p >= 90 ? 90 : p + 25), 250);

    setTimeout(() => {
      clearInterval(interval);
      setCommitProgress(100);

      const allPlayers: Player[] = [];
      const allSnapshots: Snapshot[] = [];
      const sessionsList: ImportSession[] = [];

      drafts.forEach((draft) => {
        draft.snapshots.forEach((s) => {
          allSnapshots.push(s);
          allPlayers.push({ characterId: s.playerId, currentName: s.playerName, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        });
        sessionsList.push({
          id: `import_${draft.id}`, filename: draft.filename, uploadedBy: "Officer", importedAt: new Date().toISOString(),
          rowCount: draft.snapshots.length, status: draft.warnings.length > 0 ? "COMPLETED_WITH_WARNINGS" : "COMPLETED",
          warnings: draft.warnings, source: draft.source,
        });
      });

      onImportSnapshots(allPlayers, allSnapshots, sessionsList);
      setImportStatus("success");
      setTimeout(() => { setIsCommitLoading(false); setDrafts([]); setImportStatus("idle"); }, 500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-gothic-velvet p-5 rounded-xl border border-gothic-silver/20">
        <div className="space-y-1">
          <h1 className="text-xl font-bold font-display text-gothic-silver flex items-center gap-2"><Database size={22} className="text-[#89A6B8]" /> Ingestion Workspace</h1>
          <p className="text-xs text-gothic-rose/90">Upload telemetry documents to parse characters prior to ledger commit.</p>
        </div>
        {activeMainTab === "upload" && importStatus === "parsed" && (
          <div className="flex gap-2.5">
            <button onClick={() => { setDrafts([]); setImportStatus("idle"); }} className="px-4 py-2 bg-gothic-ink hover:bg-red-950/20 text-xs font-semibold rounded-lg border border-gothic-silver/20">Clear Queue</button>
            <button onClick={handleBulkCommit} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"><CheckCircle size={14} /> Commit All ({drafts.reduce((a,d)=>a+d.snapshots.length,0)})</button>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-gothic-silver/20 pb-px">
        <button onClick={() => setActiveMainTab("upload")} className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${activeMainTab === "upload" ? "border-gothic-silver text-gothic-silver" : "border-transparent text-gothic-rose/50"}`}>Upload New Telemetry</button>
        <button onClick={() => setActiveMainTab("manager")} className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeMainTab === "manager" ? "border-gothic-silver text-gothic-silver" : "border-transparent text-gothic-rose/50"}`}>
          <HistoryIcon size={14} /> Document History
        </button>
      </div>

      {activeMainTab === "upload" ? (
        <AnimatePresence mode="wait">
          {importStatus === "idle" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div
                onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer min-h-[360px] flex flex-col items-center justify-center ${dragActive ? "border-gothic-silver bg-gothic-silver/5" : "border-gothic-silver/20 bg-gothic-velvet hover:bg-gothic-ink/40"}`}
              >
                <input ref={fileInputRef} type="file" multiple accept=".csv,.xlsx,.xls,.json" onChange={(e) => e.target.files && handleFilesUpload(e.target.files)} className="hidden" />
                <Upload size={32} className="text-gothic-silver mb-4" />
                <h3 className="text-sm font-bold text-gothic-silver uppercase">Drag and Drop Ingestion Files</h3>
                <p className="text-xs text-[#C8CCD2] mt-2">Select multiple .xlsx, .csv, or .json files.</p>
              </div>
            </motion.div>
          )}

          {importStatus === "parsed" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {drafts.map((draft) => (
                <DraftEditorCard
                  key={draft.id}
                  draft={draft}
                  importSessions={importSessions}
                  snapshots={snapshots}
                  onDraftDateChange={handleDraftDateChange}
                  onDraftNameChange={handleDraftNameChange}
                  onDraftSourceChange={handleDraftSourceChange}
                  onCellChange={handleCellChange}
                  onDeleteRow={handleDeleteRow}
                  onHeaderMapChange={handleHeaderMapChange}
                  toggleDraftExpansion={toggleDraftExpansion}
                  toggleMappingExpansion={toggleMappingExpansion}
                  onDeleteDraft={handleDeleteDraft}
                  onAddPlayerSubmit={handleAddPlayerSubmit}
                  getDuplicateDateInfo={getDuplicateDateInfo}
                  onOpenDuplicateModal={(draftId, filename, date, matchingSessions, count) => {
                    setDuplicateModalState({
                      isOpen: true, draftId, filename, date, matchingSessions, matchingOtherDrafts: [], totalExistingRecords: count, newDateValue: date
                    });
                  }}
                  onDeleteSession={onDeleteSession}
                  CANONICAL_FIELDS={CANONICAL_FIELDS}
                />
              ))}
            </motion.div>
          )}

          {importStatus === "success" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-center space-y-5 my-12">
              <CheckCircle size={36} className="mx-auto text-emerald-400" />
              <h3 className="text-base font-bold text-gothic-silver uppercase">Ingestion Successful</h3>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <SessionManager importSessions={importSessions} snapshots={snapshots} onRenameSession={onRenameSession} onDeleteSession={onDeleteSession} />
      )}

      {/* Duplicate Date Modal */}
      {duplicateModalState && duplicateModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gothic-velvet border border-amber-500/40 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gothic-silver/20 pb-4">
              <h3 className="text-sm font-bold text-gothic-silver uppercase">Duplicate Telemetry Date Flagged</h3>
              <button onClick={() => setDuplicateModalState(null)} className="text-gothic-rose/50 hover:text-gothic-silver"><X size={18} /></button>
            </div>
            <p className="text-xs text-gothic-rose/80">Telemetry for date {duplicateModalState.date} already exists in your records.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDuplicateModalState(null)} className="px-4 py-2 bg-gothic-ink text-gothic-silver rounded text-xs font-mono">Cancel</button>
              <button onClick={() => { setDuplicateModalState(null); handleBulkCommit(); }} className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-mono font-bold">Proceed & Append</button>
            </div>
          </div>
        </div>
      )}

      <CustomLoadingOverlay isOpen={isCommitLoading} progress={commitProgress} title="Committing Telemetry Records" statusText="Encrypting snapshots..." variant="dragonfire" steps={[]} />
    </div>
  );
}