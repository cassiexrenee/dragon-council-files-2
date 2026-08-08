import React, { useState, useMemo, useEffect } from "react";
import { formatWholeNumber } from "../utils/analytics";
import { 
  Player, 
  Snapshot, 
  AllianceSettings, 
  PerformanceEvaluation, 
  PlayerClassification,
  PlayerNote
} from "../types";
import { 
  UserCheck, 
  ShieldCheck, 
  Link2, 
  Plus, 
  AlertCircle, 
  Trash2,
  Lock,
  User,
  CheckCircle2,
  Share2
} from "lucide-react";

import { apiFetch, API_BASE } from "../apiConfig";

interface MemberPortalTabProps {
  players: Player[];
  snapshots: Snapshot[];
  settings: AllianceSettings;
  evaluations: PerformanceEvaluation[];
  classifications: PlayerClassification[];
  notes: PlayerNote[];
  onAddNote?: (playerId: string, noteText: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function MemberPortalTab({
  players,
  snapshots,
  settings,
  evaluations,
  classifications,
  notes,
  onNavigateToTab
}: MemberPortalTabProps) {
  // Sort players in strict alphabetical order
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.currentName.localeCompare(b.currentName));
  }, [players]);

  // Selected character state — honors a shared deep-link (?tab=member&player=CHAR_ID)
  // so a member opening a link sent by an officer lands directly on their own profile.
  const [isLockedToLinkedPlayer] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const linkedPlayer = params.get("player");
      return !!(linkedPlayer && sortedPlayers.some((p) => p.characterId === linkedPlayer));
    } catch (_) {
      return false;
    }
  });

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const linkedPlayer = params.get("player");
      if (linkedPlayer && sortedPlayers.some((p) => p.characterId === linkedPlayer)) {
        return linkedPlayer;
      }
    } catch (_) {}
    return sortedPlayers[0]?.characterId || "";
  });

  // Real Discord session state (server-verified via httpOnly cookie), plus
  // which alliance character (if any) that Discord identity has claimed.
  const [session, setSession] = useState<{
    user: { id: string; username: string; avatarUrl?: string } | null;
    claimedCharacterId: string | null;
  }>({ user: null, claimedCharacterId: null });
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const refreshSession = () => {
    apiFetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setSession({ user: data.user || null, claimedCharacterId: data.claimedCharacterId || null });
        setIsSessionLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load Discord session:", err);
        setIsSessionLoading(false);
      });
  };

  useEffect(() => {
    refreshSession();
  }, []);

  // Re-check session after a Discord login popup completes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      const expectedOrigin = API_BASE ? new URL(API_BASE).origin : window.location.origin;
      if (origin !== expectedOrigin && !origin.includes("localhost") && !origin.includes("0.0.0.0")) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        refreshSession();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleLoginWithDiscord = async () => {
    try {
      const response = await apiFetch("/api/auth/discord/url");
      if (!response.ok) throw new Error("Failed to get Discord authorization URL");
      const { url } = await response.json();
      const authWindow = window.open(url, "discord_oauth_popup", "width=500,height=680");
      if (!authWindow) alert("Please allow popups to log in with Discord.");
    } catch (err) {
      console.error("Error initiating Discord login:", err);
    }
  };

  const handleClaimCharacter = async () => {
    setClaimError(null);
    setIsClaiming(true);
    try {
      const res = await apiFetch("/api/auth/claim", {
        method: "POST",
        body: JSON.stringify({ characterId: selectedPlayerId })
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error || "Failed to claim this character.");
      } else {
        setSession((prev) => ({ ...prev, claimedCharacterId: data.claimedCharacterId }));
      }
    } catch (err) {
      setClaimError("Couldn't reach the server. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  // Linked farm accounts, loaded from the backend for the selected character
  const [farms, setFarms] = useState<{ id: string; mainPlayerId: string; farmName: string; farmPower: number }[]>([]);
  const [isFarmsLoading, setIsFarmsLoading] = useState(true);
  const [farmActionError, setFarmActionError] = useState<string | null>(null);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [farmPower, setFarmPower] = useState("5000000");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!selectedPlayerId) return;
    setClaimError(null);
    setFarmActionError(null);
    setIsFarmsLoading(true);
    apiFetch(`/api/farms/${encodeURIComponent(selectedPlayerId)}`)
      .then((res) => res.json())
      .then((data) => setFarms(Array.isArray(data.farms) ? data.farms : []))
      .catch((err) => console.warn("Failed to load farm links:", err))
      .finally(() => setIsFarmsLoading(false));
  }, [selectedPlayerId]);

  const handleCopyMemberLink = () => {
    try {
      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("tab", "member");
      url.searchParams.set("player", selectedPlayerId);
      navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (_) {}
  };

  const selectedPlayer = sortedPlayers.find((p) => p.characterId === selectedPlayerId) || sortedPlayers[0];
  const snap = snapshots.find((s) => s.playerId === selectedPlayerId) || snapshots[0];

  if (sortedPlayers.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
        <UserCheck size={48} className="mx-auto mb-3 opacity-40 text-gothic-silver" />
        <h3 className="text-lg font-bold text-gothic-silver font-display">No Registered Lords Yet</h3>
        <p className="text-xs mt-1 font-mono max-w-sm mx-auto">
          The Member Gateway populates once alliance characters have been imported via the Import Manager or added through the recruitment portal.
        </p>
        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab("imports")}
            className="mt-4 px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            Go to Import Manager
          </button>
        )}
      </div>
    );
  }

  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 15000000;
  const meritTargetPct = settings?.configuration?.complianceTargets?.meritRatioPct || 10;

  const currentPower = snap?.currentPower || 0;
  const merits = snap?.merits || 0;
  const meritRatio = currentPower > 0 ? (merits / currentPower) * 100 : 0;

  const isPowerEligible = currentPower >= powerBaseline;
  const isMeritEligible = meritRatio >= meritTargetPct;

  // Aggregate stats across linked accounts
  const aggregateFarmPower = farms.reduce((acc, f) => acc + f.farmPower, 0);
  const totalAggregatePower = currentPower + aggregateFarmPower;
  const isOwner = !!session.user && session.claimedCharacterId === selectedPlayerId;

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;
    setFarmActionError(null);

    try {
      const res = await apiFetch("/api/farms", {
        method: "POST",
        body: JSON.stringify({
          characterId: selectedPlayerId,
          farmName: farmName.trim(),
          farmPower: parseFloat(farmPower) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setFarmActionError(data.error || "Failed to link farm account.");
        return;
      }
      setFarms((prev) => [...prev, data.farm]);
      setFarmName("");
      setShowAddFarmModal(false);
    } catch (err) {
      setFarmActionError("Couldn't reach the server. Please try again.");
    }
  };

  const handleRemoveFarm = async (farmId: string) => {
    setFarmActionError(null);
    const previous = farms;
    setFarms((prev) => prev.filter((f) => f.id !== farmId));
    try {
      const res = await apiFetch(`/api/farms/${farmId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFarmActionError(data.error || "Failed to remove farm account.");
        setFarms(previous); // roll back optimistic update
      }
    } catch (err) {
      setFarmActionError("Couldn't reach the server. Please try again.");
      setFarms(previous);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-gothic-silver">
      
      {/* Header & Alphabetically Sorted Character Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gothic-silver/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#89A6B8] uppercase tracking-widest">
            <UserCheck size={14} /> Member Gateway & Farm Linkage
          </div>
          <h1 className="text-3xl font-display font-bold text-gothic-silver tracking-tight mt-1">
            Member Command Gateway
          </h1>
          <p className="text-xs text-gothic-rose/70 font-mono">
            Verify individual performance vectors, seasonal compliance, and manually link farm accounts to your main lord profile.
          </p>
        </div>

        {/* Member Lord Selector (Alphabetical) + Shareable Link */}
        <div className="flex flex-wrap items-center gap-3 bg-gothic-velvet p-2.5 rounded-xl border border-gothic-silver/20">
          <span className="text-xs font-mono text-gothic-rose/60 uppercase">
            {isLockedToLinkedPlayer ? "Logged In As:" : "Select Lord:"}
          </span>
          {isLockedToLinkedPlayer ? (
            <span className="bg-gothic-ink border border-gothic-silver/20 rounded-lg px-3 py-1.5 text-xs text-gothic-silver font-mono font-bold">
              {selectedPlayer?.currentName} ({selectedPlayerId})
            </span>
          ) : (
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="bg-gothic-ink border border-gothic-silver/20 rounded-lg px-3 py-1.5 text-xs text-gothic-silver font-mono focus:outline-none focus:border-[#89A6B8] cursor-pointer"
            >
              {sortedPlayers.map((p) => (
                <option key={p.characterId} value={p.characterId}>
                  {p.currentName} ({p.characterId})
                </option>
              ))}
            </select>
          )}

          {!isLockedToLinkedPlayer && (
            <button
              onClick={handleCopyMemberLink}
              title="Copy a direct link to this member's portal — share it in Discord so they can log in and link their own farm accounts"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                linkCopied
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : "bg-gothic-ink hover:bg-gothic-ink/80 border-gothic-silver/20 hover:border-gothic-silver text-gothic-silver"
              }`}
            >
              {linkCopied ? <CheckCircle2 size={13} /> : <Share2 size={13} />}
              {linkCopied ? "Link Copied!" : "Copy Member Link"}
            </button>
          )}
        </div>
      </div>

      {/* Discord Identity Status */}
      <div className="p-4 rounded-xl bg-gothic-velvet border border-gothic-silver/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {isSessionLoading ? (
          <span className="text-xs font-mono text-gothic-rose/50">Checking Discord identity...</span>
        ) : session.user ? (
          <div className="flex items-center gap-3">
            {session.user.avatarUrl && (
              <img src={session.user.avatarUrl} alt={session.user.username} className="w-8 h-8 rounded-full border border-gothic-silver/30" />
            )}
            <div className="text-xs font-mono">
              <span className="text-gothic-silver font-bold">{session.user.username}</span>
              <span className="text-gothic-rose/50 block text-[10px]">
                {session.claimedCharacterId
                  ? `Linked to character: ${session.claimedCharacterId}`
                  : "No character claimed yet"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-gothic-rose/60">
            <Lock size={14} />
            Log in with Discord to claim your character and manage farm accounts.
          </div>
        )}

        {!isSessionLoading && !session.user && (
          <button
            onClick={handleLoginWithDiscord}
            className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <User size={13} /> Log In With Discord
          </button>
        )}
      </div>

      {/* Main Member Gateway Interface */}
      <div className="space-y-6">
          
          {/* Main Profile Card */}
          <div className="p-8 rounded-2xl bg-gothic-velvet border border-gothic-silver/20 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gothic-silver/20 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gothic-ink border border-gothic-silver/40 flex items-center justify-center text-gothic-silver text-2xl font-bold font-display">
                  {selectedPlayer?.currentName?.slice(0, 2).toUpperCase() || "DC"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-display font-bold text-gothic-silver">{selectedPlayer?.currentName}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-gothic-ink text-gothic-silver border border-gothic-silver/30 text-[10px] font-mono font-bold">
                      Character ID: {selectedPlayerId}
                    </span>
                  </div>
                  <p className="text-xs text-gothic-rose/70 font-mono mt-1">
                    Alliance: <strong className="text-gothic-silver">{settings.allianceId || "Dragon Council"}</strong> • Season {activeSeason} Member
                  </p>
                </div>
              </div>

              {/* Compliance Status Badge */}
              <div className="flex items-center gap-3">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  isPowerEligible && isMeritEligible
                    ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-950/20 border-amber-500/40 text-amber-300"
                }`}>
                  {isPowerEligible && isMeritEligible ? <ShieldCheck size={28} /> : <AlertCircle size={28} />}
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-gothic-rose/60">Season {activeSeason} Compliance</span>
                    <span className="font-display font-bold text-sm uppercase">
                      {isPowerEligible && isMeritEligible ? "Compliant & Verified" : "Below Target Baseline"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Vector Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-gothic-ink border border-gothic-silver/20">
                <span className="text-gothic-rose/60 text-[10px] uppercase block">Main Power</span>
                <span className="text-xl font-bold text-gothic-silver">{formatWholeNumber(currentPower)}</span>
                <span className="text-[10px] text-gothic-rose/50 block mt-1">Baseline: {formatWholeNumber(powerBaseline)}</span>
              </div>

              <div className="p-4 rounded-xl bg-gothic-ink border border-gothic-silver/20">
                <span className="text-gothic-rose/60 text-[10px] uppercase block">Seasonal Merits</span>
                <span className="text-xl font-bold text-red-400">{formatWholeNumber(merits)}</span>
                <span className={`text-[10px] block mt-1 ${isMeritEligible ? "text-emerald-400" : "text-amber-400"}`}>
                  Ratio: {Math.round(meritRatio)}% (Target: {meritTargetPct}%)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gothic-ink border border-gothic-silver/20">
                <span className="text-gothic-rose/60 text-[10px] uppercase block">Troop Casualties</span>
                <span className="text-xl font-bold text-[#89A6B8]">
                  {formatWholeNumber((snap?.t4Deaths || 0) + (snap?.t5Deaths || 0))}
                </span>
                <span className="text-[10px] text-gothic-rose/50 block mt-1">
                  Target: {formatWholeNumber(settings?.configuration?.complianceTargets?.deathsMin || 50000)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gothic-ink border border-gothic-silver/20">
                <span className="text-gothic-rose/60 text-[10px] uppercase block">Combined Power (Main + Farms)</span>
                <span className="text-xl font-bold text-amber-300">{formatWholeNumber(totalAggregatePower)}</span>
                <span className="text-[10px] text-gothic-rose/50 block mt-1">
                  {farms.length} Linked Farm Account{farms.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Farms Management Section */}
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

            {/* Ownership / claim status messaging */}
            {!isSessionLoading && !isOwner && (
              <div className="p-4 rounded-xl bg-gothic-ink/60 border border-gothic-silver/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {!session.user ? (
                  <p className="text-xs font-mono text-gothic-rose/60">
                    Log in with Discord above to claim <strong className="text-gothic-silver">{selectedPlayer?.currentName}</strong> and manage farm accounts.
                  </p>
                ) : session.claimedCharacterId === null ? (
                  <>
                    <p className="text-xs font-mono text-gothic-rose/60">
                      This character hasn't been claimed yet. Claim it as yours to manage farm accounts.
                    </p>
                    <button
                      onClick={handleClaimCharacter}
                      disabled={isClaiming}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-mono font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                    >
                      <ShieldCheck size={13} /> {isClaiming ? "Claiming..." : `Claim ${selectedPlayer?.currentName} As Mine`}
                    </button>
                  </>
                ) : (
                  <p className="text-xs font-mono text-gothic-rose/60">
                    You're logged in as <strong className="text-gothic-silver">{session.user.username}</strong>, linked to a different character
                    (<span className="text-gothic-silver">{session.claimedCharacterId}</span>). Switch to your own profile using the selector above to manage its farms.
                  </p>
                )}
              </div>
            )}

            {claimError && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle size={13} /> {claimError}
              </div>
            )}
            {farmActionError && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle size={13} /> {farmActionError}
              </div>
            )}

            {isFarmsLoading ? (
              <div className="p-8 text-center text-xs font-mono text-gothic-rose/50">Loading farm accounts...</div>
            ) : farms.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gothic-silver/10 rounded-xl space-y-2">
                <p className="text-xs font-mono text-gothic-rose/50">
                  No linked farms detected for <strong className="text-gothic-silver">{selectedPlayer?.currentName}</strong>.
                </p>
                {isOwner && (
                  <p className="text-[11px] text-gothic-rose/40 font-mono">
                    Click "Link New Farm Account" above to connect your gathering or alt accounts.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {farms.map((farm) => (
                  <div
                    key={farm.id}
                    className="p-3.5 bg-gothic-ink border border-gothic-silver/20 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-gothic-silver font-mono block">{farm.farmName}</span>
                      <span className="text-[10px] text-gothic-rose/60 font-mono">
                        Power: <strong className="text-amber-300">{formatWholeNumber(farm.farmPower)}</strong>
                      </span>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleRemoveFarm(farm.id)}
                        className="p-1.5 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-900/40"
                        title="Unlink Farm Account"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Farm Modal */}
          {showAddFarmModal && isOwner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <form
                onSubmit={handleAddFarm}
                className="bg-gothic-velvet border border-gothic-silver/30 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl"
              >
                <div className="border-b border-gothic-silver/20 pb-3">
                  <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">
                    Link Farm Account to {selectedPlayer?.currentName}
                  </h3>
                  <p className="text-xs text-gothic-rose/60 font-mono mt-0.5">
                    Enter details for your alt or resource farm account.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Farm Lord Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Farm_Alpha_99"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none focus:border-[#89A6B8]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gothic-rose/60 block">Farm Current Power</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g., 5000000"
                      value={farmPower}
                      onChange={(e) => setFarmPower(e.target.value)}
                      className="w-full bg-gothic-ink border border-gothic-silver/20 text-gothic-silver p-2.5 rounded-lg outline-none focus:border-[#89A6B8]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gothic-silver/20">
                  <button
                    type="button"
                    onClick={() => setShowAddFarmModal(false)}
                    className="px-3.5 py-1.5 bg-gothic-ink hover:bg-gothic-void text-gothic-rose/70 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gothic-silver hover:bg-white text-[#111113] font-mono font-bold rounded-lg text-xs cursor-pointer shadow-md"
                  >
                    Save & Link Farm
                  </button>
                </div>
              </form>
            </div>
          )}

      </div>
    </div>
  );
}
