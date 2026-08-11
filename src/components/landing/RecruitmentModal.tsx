import React, { useState } from "react";
import { X, Send, Shield } from "lucide-react";

interface RecruitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyForRecruitment: (applicant: {
    characterName: string;
    power: number;
    merits: number;
    troopTier: string;
    preferredRole: string;
  }) => void;
}

export default function RecruitmentModal({ isOpen, onClose, onApplyForRecruitment }: RecruitmentModalProps) {
  const [characterName, setCharacterName] = useState("");
  const [power, setPower] = useState<string>("");
  const [merits, setMerits] = useState<string>("");
  const [troopTier, setTroopTier] = useState("T5");
  const [preferredRole, setPreferredRole] = useState("FIGHTER");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterName.trim()) return alert("Character name is required.");

    onApplyForRecruitment({
      characterName: characterName.trim(),
      power: Number(power) || 0,
      merits: Number(merits) || 0,
      troopTier,
      preferredRole
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCharacterName("");
      setPower("");
      setMerits("");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gothic-velvet border border-gothic-silver/30 rounded-xl p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-gothic-silver/20 pb-3">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#D4B26A]" />
            <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">Alliance Recruitment Application</h3>
          </div>
          <button onClick={onClose} className="text-gothic-rose/50 hover:text-gothic-silver cursor-pointer"><X size={18} /></button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2 font-mono text-xs text-emerald-400">
            <p className="font-bold uppercase text-sm">Application Transmitted!</p>
            <p className="text-gothic-rose/70">Your candidacy has been securely logged into the leadership evaluation queue.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">In-Game Lord Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alexander"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none focus:border-[#D4B26A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Current Power</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000000"
                  value={power}
                  onChange={(e) => setPower(e.target.value)}
                  className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none focus:border-[#D4B26A]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Total Merits</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2000000"
                  value={merits}
                  onChange={(e) => setMerits(e.target.value)}
                  className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none focus:border-[#D4B26A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Highest Troop Tier</label>
                <select
                  value={troopTier}
                  onChange={(e) => setTroopTier(e.target.value)}
                  className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="T5">Tier 5 (T5)</option>
                  <option value="T4">Tier 4 (T4)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Preferred Role</label>
                <select
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                  className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="FIGHTER">Fighter (Combat)</option>
                  <option value="SUPPORT">Support (Garrison/Behemoth)</option>
                  <option value="FARM">Farm Account</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gothic-silver/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gothic-ink hover:bg-gothic-void text-gothic-rose/70 rounded-lg font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#D4B26A] hover:bg-[#c29f57] text-[#1A1400] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send size={13} /> Submit Application
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}