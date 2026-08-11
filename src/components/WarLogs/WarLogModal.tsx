import React from "react";
import { Plus } from "lucide-react";

interface WarLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newActor: string;
  setNewActor: (v: string) => void;
  newSeverity: "DIPLOMATIC" | "VANGUARD" | "CRITICAL" | "SYSTEM";
  setNewSeverity: (v: any) => void;
  newZone: string;
  setNewZone: (v: string) => void;
  newCoords: string;
  setNewCoords: (v: string) => void;
  newDescription: string;
  setNewDescription: (v: string) => void;
}

export default function WarLogModal({
  isOpen,
  onClose,
  onSubmit,
  newTitle,
  setNewTitle,
  newActor,
  setNewActor,
  newSeverity,
  setNewSeverity,
  newZone,
  setNewZone,
  newCoords,
  setNewCoords,
  newDescription,
  setNewDescription
}: WarLogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#222831] border border-[#4B5563]/50 rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
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

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
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

          <div className="pt-3 border-t border-[#4B5563]/30 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
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
  );
}