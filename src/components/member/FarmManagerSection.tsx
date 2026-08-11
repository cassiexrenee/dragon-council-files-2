import React, { useState } from "react";
import { Link2, Plus, Trash2, AlertCircle, ShieldCheck } from "lucide-react";
import { formatWholeNumber } from "../../utils/Analytics";

interface FarmManagerSectionProps {
  farms: { id: string; mainPlayerId: string; farmName: string; farmPower: number }[];
  isFarmsLoading: boolean;
  isOwner: boolean;
  isSessionLoading: boolean;
  session: { user: { username: string } | null; claimedCharacterId: string | null };
  selectedPlayerName: string;
  claimError: string | null;
  farmActionError: string | null;
  isClaiming: boolean;
  onClaimCharacter: () => void;
  onAddFarm: (farmName: string, farmPower: number) => Promise<void>;
  onRemoveFarm: (farmId: string) => Promise<void>;
}

export default function FarmManagerSection({
  farms,
  isFarmsLoading,
  isOwner,
  isSessionLoading,
  session,
  selectedPlayerName,
  claimError,
  farmActionError,
  isClaiming,
  onClaimCharacter,
  onAddFarm,
  onRemoveFarm
}: FarmManagerSectionProps) {
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [farmPower, setFarmPower] = useState("5000000");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;
    await onAddFarm(farmName.trim(), parseFloat(farmPower) || 0);
    setFarmName("");
    setShowAddFarmModal(false);
  };

  return (
    <div className="p-6 rounded-2xl bg-gothic-velvet border border-gothic-silver/20 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gothic-silver/20 pb-3">
        <div>
          <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider flex items-center gap-2">
            <Link2 size={16} className="text-[#89A6B8]" /> User-Linked Farm Accounts ({farms.length})
          </h3>
          <p className="text-xs text-gothic-rose/70 font-mono">
            {isOwner
              ? "Manage the farm accounts linked to your character below."
              : "Farm accounts can only be added or removed by the Discord member who claimed this character."}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowAddFarmModal(true)}
            className="px-3.5 py-1.5 bg-gothic-silver hover:bg-white text-[#111113] font-mono font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-md"
          >
            <Plus size={14} /> Link New Farm Account
          </button>
        )}
      </div>

      {!isSessionLoading && !isOwner && (
        <div className="p-4 rounded-xl bg-gothic-ink/60 border border-gothic-silver/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          {!session.user ? (
            <p className="text-gothic-rose/60">
              Log in with Discord above to claim <strong className="text-gothic-silver">{selectedPlayerName}</strong> and manage farm accounts.
            </p>
          ) : session.claimedCharacterId === null ? (
            <>
              <p className="text-gothic-rose/60">This character hasn't been claimed yet. Claim it as yours to manage farm accounts.</p>
              <button
                onClick={onClaimCharacter}
                disabled={isClaiming}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck size={13} /> {isClaiming ? "Claiming..." : `Claim ${selectedPlayerName} As Mine`}
              </button>
            </>
          ) : (
            <p className="text-gothic-rose/60">
              You're logged in as <strong className="text-gothic-silver">{session.user.username}</strong>, linked to a different character.
            </p>
          )}
        </div>
      )}

      {claimError && <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2"><AlertCircle size={13} /> {claimError}</div>}
      {farmActionError && <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2"><AlertCircle size={13} /> {farmActionError}</div>}

      {isFarmsLoading ? (
        <div className="p-8 text-center text-xs font-mono text-gothic-rose/50">Loading farm accounts...</div>
      ) : farms.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-gothic-silver/10 rounded-xl space-y-2 font-mono text-xs text-gothic-rose/50">
          No linked farms detected for <strong className="text-gothic-silver">{selectedPlayerName}</strong>.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {farms.map((farm) => (
            <div key={farm.id} className="p-3.5 bg-gothic-ink border border-gothic-silver/20 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="font-bold text-gothic-silver block">{farm.farmName}</span>
                <span className="text-[10px] text-gothic-rose/60">Power: <strong className="text-amber-300">{formatWholeNumber(farm.farmPower)}</strong></span>
              </div>
              {isOwner && (
                <button onClick={() => onRemoveFarm(farm.id)} className="p-1.5 hover:bg-red-950/40 text-red-400 rounded-lg cursor-pointer border border-transparent">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddFarmModal && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-gothic-velvet border border-gothic-silver/30 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider border-b border-gothic-silver/25 pb-3">Link Farm Account</h3>
            <div className="space-y-3 font-mono text-xs">
              <input type="text" required placeholder="Farm Lord Name" value={farmName} onChange={(e) => setFarmName(e.target.value)} className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none" />
              <input type="number" required placeholder="Farm Current Power" value={farmPower} onChange={(e) => setFarmPower(e.target.value)} className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gothic-silver/20">
              <button type="button" onClick={() => setShowAddFarmModal(false)} className="px-3 py-1.5 bg-gothic-ink text-gothic-rose/70 rounded text-xs font-mono">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-gothic-silver text-[#111113] font-bold rounded text-xs font-mono">Save & Link</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}