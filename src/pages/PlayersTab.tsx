import React, { useState } from "react";
import { Search } from "lucide-react";
import {
  Player,
  Snapshot,
  PlayerClassification,
  PerformanceEvaluation,
  Recommendation,
  PlayerNote,
  AllianceSettings,
  RoleOverride // FIX: Added missing type
} from "../types";
import { getAggregatedPlayerSnapshot, getLastActivityInfo } from "../utils/Analytics";
import PlayerDirectorySidebar from "../components/Players/PlayerDirectorySidebar";
import PlayerProfileDetail from "../components/Players/PlayerProfileDetail";

// FIX: Renamed and added missing props to match App.tsx mapping
interface PlayersTabProps {
  players: Player[];
  snapshots: Snapshot[];
  classifications: PlayerClassification[];
  evaluations: PerformanceEvaluation[];
  recommendations: Recommendation[];
  notes: PlayerNote[];
  overrides?: RoleOverride[];
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void; 
  handleAddNote: (playerId: string, content: string) => void; 
  handleDeleteNote: (noteId: string) => void; 
  handleApplyOverride?: (override: RoleOverride) => void; 
  handleRemoveOverride?: (playerId: string) => void; 
  settings?: AllianceSettings;
  onNavigateToTab?: (tab: string) => void;
}

export default function PlayersTab({
  players,
  snapshots,
  evaluations,
  recommendations,
  notes,
  overrides = [], // FIX: Destructured new props
  selectedPlayerId,
  setSelectedPlayerId,
  handleAddNote,
  handleDeleteNote,
  handleApplyOverride,
  handleRemoveOverride,
  settings,
  onNavigateToTab
}: PlayersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [hideUnderBaseline, setHideUnderBaseline] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 10000000;

  const filteredPlayers = React.useMemo(() => {
    return players.filter((player) => {
      const playerSnaps = snapshots.filter((s) => s.playerId === player.characterId);
      const latestSnap = playerSnaps.length > 0 ? getAggregatedPlayerSnapshot(playerSnaps) : null;
      const evaluation = evaluations.find((e) => e.playerId === player.characterId);

      const nameMatches = player.currentName.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatches = player.characterId.toLowerCase().includes(searchQuery.toLowerCase());
      const tierMatches = tierFilter === "ALL" || (evaluation && evaluation.performanceTier === tierFilter);
      const powerMatches = !hideUnderBaseline || (latestSnap && latestSnap.currentPower >= powerBaseline);

      return (nameMatches || idMatches) && tierMatches && powerMatches;
    }).sort((a, b) => a.currentName.localeCompare(b.currentName));
  }, [players, snapshots, evaluations, searchQuery, tierFilter, hideUnderBaseline, powerBaseline]);

  const activePlayer = players.find((p) => p.characterId === selectedPlayerId) || filteredPlayers[0] || null;
  
  React.useEffect(() => {
    if (activePlayer && selectedPlayerId !== activePlayer.characterId) {
      setSelectedPlayerId(activePlayer.characterId); // FIX: Updated function call
    }
  }, [activePlayer, selectedPlayerId, setSelectedPlayerId]);

  if (!activePlayer) {
    return (
      <div className="p-8 text-center rounded-xl bg-gothic-velvet border border-gothic-silver/20 text-gothic-rose/50">
        <Search size={48} className="mx-auto mb-3 opacity-40 text-gothic-silver" />
        <h3 className="text-lg font-bold text-gothic-silver font-display">No Players Located</h3>
        {players.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs mt-1 font-mono">No alliance roster has been imported yet.</p>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab("imports")}
                className="px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-silver border border-gothic-silver/20 hover:border-gothic-silver rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
              >
                Go to Import Manager
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs mt-1 font-mono">Adjust search parameters or filters to expand discovery query.</p>
        )}
      </div>
    );
  }

  const playerSnapshots = snapshots.filter((s) => s.playerId === activePlayer.characterId)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const latestSnapshot = playerSnapshots[playerSnapshots.length - 1];
  
  const playerEvaluation = evaluations.find((e) => e.playerId === activePlayer.characterId);
  const playerLastActivity = getLastActivityInfo(playerSnapshots);
  const playerNotes = notes.filter((n) => n.playerId === activePlayer.characterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  // FIX: Identify if the current player has an active override
  const activeOverride = overrides.find(o => o.playerId === activePlayer.characterId);

  const handleAddNoteInternal = (playerId: string, content: string) => {
    handleAddNote(playerId, content); // FIX: Updated function call
    setFeedbackMsg(`✓ Officer note appended for ${activePlayer.currentName}. Record saved to ledger.`);
    setTimeout(() => setFeedbackMsg(null), 8000);
  };

  return (
    <div className="space-y-6 font-sans text-gothic-silver pb-12">
      {feedbackMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400/60 hover:text-emerald-200 cursor-pointer">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <PlayerDirectorySidebar
          filteredPlayers={filteredPlayers}
          activePlayer={activePlayer}
          onSelectPlayer={(id) => setSelectedPlayerId(id)} // FIX: Updated function call
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tierFilter={tierFilter}
          setTierFilter={setTierFilter}
          hideUnderBaseline={hideUnderBaseline}
          setHideUnderBaseline={setHideUnderBaseline}
          powerBaseline={powerBaseline}
          evaluations={evaluations}
          snapshots={snapshots}
        />

        <PlayerProfileDetail
          activePlayer={activePlayer}
          playerSnapshots={playerSnapshots}
          latestSnapshot={latestSnapshot}
          playerEvaluation={playerEvaluation}
          playerLastActivity={playerLastActivity}
          playerNotes={playerNotes}
          settings={settings}
          override={activeOverride} // FIX: Passed override down
          onAddNote={handleAddNoteInternal}
          onDeleteNote={handleDeleteNote} // FIX: Updated function call
          onApplyOverride={handleApplyOverride} // FIX: Passed override control down
          onRemoveOverride={handleRemoveOverride} // FIX: Passed override control down
        />
      </div>
    </div>
  );
}