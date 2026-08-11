import React, { useState } from "react";
import { UserCheck, Shield, Plus, Link as LinkIcon, Trash2, CheckCircle2 } from "lucide-react";
import { Player, Snapshot, AllianceSettings } from "../types";
import { apiFetch } from "../apiConfig";

interface MemberPortalTabProps {
  players: Player[];
  snapshots: Snapshot[];
  settings: AllianceSettings;
  onRefreshData?: () => void;
}

export default function MemberPortalTab({
  players,
  snapshots,
  settings,
  onRefreshData
}: MemberPortalTabProps) {
  const [selectedMainId, setSelectedMainId] = useState<string>("");
  const [farmName, setFarmName] = useState("");
  const [farmPower, setFarmPower] = useState("");
  const [linkedFarms, setLinkedFarms] = useState<Array<{ name: string; power: string }>>([]);
  const [portalFeedback, setPortalFeedback] = useState<string | null>(null);

  const handleClaimMain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMainId) return alert("Please select your main character profile.");

    try {
      const res = await apiFetch("/api/roster/claims", {
        method: "POST",
        body: JSON.stringify({ characterId: selectedMainId })
      });
      if (res.ok) {
        setPortalFeedback("✓ Main character profile successfully claimed and verified.");
        if (onRefreshData) onRefreshData();
      } else {
        setPortalFeedback("⚠️ Failed to register character claim with backend service.");
      }
    } catch (err) {
      setPortalFeedback("⚠️ Network error while communicating with council server.");
    }
    setTimeout(() => setPortalFeedback(null), 7000);
  };

  const handleAddFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim() || !farmPower) return alert("Please provide farm name and power.");

    setLinkedFarms(prev => [...prev, { name: farmName.trim(), power: farmPower }]);
    setFarmName("");
    setFarmPower("");
    setPortalFeedback("✓ Farm account linked to your command session.");
    setTimeout(() => setPortalFeedback(null), 5000);
  };

  const handleRemoveFarm = (idx: number) => {
    setLinkedFarms(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="border-b border-gothic-silver/25 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#89A6B8] uppercase tracking-widest">
          <UserCheck size={14} /> Member Self-Service Portal
        </div>
        <h1 className="text-2xl font-display font-bold text-gothic-silver tracking-tight">
          Lord Profile & Farm Account Management
        </h1>
        <p className="text-xs text-gothic-rose/70 font-mono mt-0.5">
          Claim your in-game main character profile and link secondary resource-generation farm accounts.
        </p>
      </div>

      {portalFeedback && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2"><CheckCircle2 size={14} /> {portalFeedback}</span>
          <button onClick={() => setPortalFeedback(null)} className="text-emerald-400/60 hover:text-emerald-200 cursor-pointer">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Character Claim Box */}
        <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-gothic-silver/20 pb-3">
            <Shield size={18} className="text-[#D4B26A]" />
            <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">Claim Main Character</h3>
          </div>
          <p className="text-xs text-gothic-rose/70 font-mono leading-relaxed">
            Select your registered in-game lord from the imported alliance roster to establish your primary command identity.
          </p>

          <form onSubmit={handleClaimMain} className="space-y-4 font-mono text-xs pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Registered Alliance Lord</label>
              <select
                value={selectedMainId}
                onChange={(e) => setSelectedMainId(e.target.value)}
                className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none cursor-pointer"
              >
                <option value="">-- Select your main character --</option>
                {players.map((p) => (
                  <option key={p.characterId} value={p.characterId}>
                    {p.currentName} (ID: {p.characterId})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gothic-silver hover:bg-white text-[#111113] font-bold uppercase rounded-lg tracking-wider text-xs transition-all cursor-pointer shadow-md"
            >
              Verify & Claim Profile
            </button>
          </form>
        </div>

        {/* Farm Account Linking Box */}
        <div className="p-6 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-gothic-silver/20 pb-3">
            <LinkIcon size={18} className="text-[#89A6B8]" />
            <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">Link Farm Accounts</h3>
          </div>
          <p className="text-xs text-gothic-rose/70 font-mono leading-relaxed">
            Attach secondary resource-gathering accounts to your main identity for alliance resource tracking.
          </p>

          <form onSubmit={handleAddFarm} className="space-y-3 font-mono text-xs pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Farm Lord Name</label>
                <input
                  type="text"
                  placeholder="e.g. FarmAlt_01"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2 rounded-lg outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Farm Power</label>
                <input
                  type="number"
                  placeholder="e.g. 2500000"
                  value={farmPower}
                  onChange={(e) => setFarmPower(e.target.value)}
                  className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2 rounded-lg outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gothic-ink hover:bg-gothic-void text-gothic-silver border border-gothic-silver/30 font-bold uppercase rounded-lg tracking-wider text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Link Farm Account
            </button>
          </form>

          {linkedFarms.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-gothic-silver/15">
              <span className="text-[10px] font-mono uppercase font-bold text-gothic-rose/60 block">Linked Farms ({linkedFarms.length})</span>
              <div className="space-y-1.5">
                {linkedFarms.map((farm, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-gothic-ink border border-gothic-silver/15 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-gothic-silver font-bold">{farm.name}</span>
                      <span className="text-gothic-rose/50 ml-2">• Power: {Number(farm.power).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFarm(idx)}
                      className="text-red-400 hover:text-red-300 cursor-pointer p-1"
                      title="Unlink farm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}