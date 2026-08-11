export type AccountRole = "FIGHTER" | "SUPPORT" | "FARM" | "NEEDS_REVIEW" | "INACTIVE";

export type PerformanceTier = "EXCEEDS" | "MEETS" | "BELOW" | "INACTIVE";

export type RecommendationType = "KEEP" | "SUPPORT" | "MONITOR" | "REMOVE" | "MANUAL_REVIEW" | "KEEP_AS_FARM";

export type EligibilityStatus = "ELIGIBLE" | "INELIGIBLE" | "PENDING" | "BELOW_BASELINE" | "LIKELY_FARM" | "LIKELY_INACTIVE";

export type ComplianceStatus = "COMPLIANT" | "EXEMPLARY" | "NON_COMPLIANT" | "PARTIAL" | "NOT_APPLICABLE";

export interface Player {
  characterId: string;
  currentName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  playerId: string;
  playerName: string;
  allianceId: string;
  allianceTag?: string;
  importId: string;
  currentPower: number;
  highestPower: number;
  merits: number;
  t4Deaths: number;
  t5Deaths: number;
  healing: number;
  donations: number;
  gathering: number;
  resourceAssistance: number;
  allianceHelp: number;
  behemothWins: number;
  buildTime?: number;
  destructionTime?: number;
  recordedAt: string;
  createdAt: string;
}

export interface PlayerClassification {
  id: string;
  playerId: string;
  snapshotId?: string | null;
  role: AccountRole;
  confidence: number;
  explanation: {
    summary: string;
    evidence: string[];
  };
  createdAt: string;
}

export interface PerformanceEvaluation {
  id: string;
  playerId: string;
  classificationId?: string;
  performanceTier: PerformanceTier;
  complianceStatus: ComplianceStatus;
  eligibilityStatus?: EligibilityStatus;
  performanceScore?: number;
  complianceMetrics?: {
    meritRatioPassed: boolean;
    deathsPassed: boolean;
  };
  customScores?: {
    merits?: number;
    gathering?: number;
  };
  metrics: {
    powerScore: number;
    meritScore: number;
    activityScore: number;
  };
  createdAt: string;
}

export interface Recommendation {
  id: string;
  playerId: string;
  classificationId: string;
  recommendation: RecommendationType;
  reason: {
    summary: string;
    drivers: string[];
    evidence?: string[];
  };
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "OVERRIDDEN";
  createdAt: string;
}

export interface RoleOverride {
  id: string;
  playerId: string;
  role: AccountRole;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface PlayerNote {
  id: string;
  playerId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportSession {
  id: string;
  filename: string;
  uploadedBy: string;
  importedAt: string;
  rowCount: number;
  status: "COMPLETED" | "COMPLETED_WITH_WARNINGS" | "FAILED";
  warnings: string[];
  source: "DragonStats" | "Farlight" | "Manual";
}

export interface WarLogEntry {
  id: string;
  timestamp: string;
  title: string;
  actor: string;
  severity: "DIPLOMATIC" | "VANGUARD" | "CRITICAL" | "SYSTEM";
  zone: string;
  locationCoordinates?: string;
  description: string;
  recordedBy: string;
}

export interface AllianceSettings {
  allianceId: string;
  activeProfile: string;
  configuration: {
    activeSeason: "S1" | "S2" | "S3" | "SoS";
    seasonalPowerBaselines: {
      S1: number;
      S2: number;
      S3: number;
      SoS: number;
    };
    seasonStartDate: string;
    finalZoneOpenDate: string;
    seasonSummaryDate: string;
    seasonEndDate: string;
    complianceTargets: {
      meritRatioPct: number;
      deathsMin: number;
      activityRequired: boolean;
    };
    weights?: Record<string, any>;
    thresholds?: Record<string, any>;
    customScoringWeights?: Record<string, any>;
  };
  updatedAt: string;
}