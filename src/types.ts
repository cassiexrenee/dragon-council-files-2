export type AccountRole = "FIGHTER" | "SUPPORT" | "FARM" | "NEEDS_REVIEW" | "INACTIVE";

export type PerformanceTier = "EXCEEDS" | "MEETS" | "BELOW" | "INACTIVE";

export type RecommendationType = "KEEP" | "SUPPORT" | "MONITOR" | "REMOVE" | "MANUAL_REVIEW" | "KEEP_AS_FARM";

export type EligibilityStatus = "ELIGIBLE" | "INELIGIBLE" | "PENDING" | "BELOW_BASELINE" | "LIKELY_FARM" | "LIKELY_INACTIVE";

export type ComplianceStatus = "COMPLIANT" | "EXEMPLARY" | "NON_COMPLIANT" | "PARTIAL" | "NOT_APPLICABLE";

// CHANGED: these values now match what classifyPlayer() actually assigns
// (was: "STAY" | "REVIEW" | "LEAVE" | "VANGUARD")
export type ClassificationStatus = "MANUAL_OVERRIDE" | "INSUFFICIENT_DATA" | "AUTO_CLASSIFIED" | "NEEDS_REVIEW";

// CHANGED: added "LOW_ACTIVITY" and "UNKNOWN" (used in evaluatePerformance's fallback branch)
export type ActivityState = "ACTIVE" | "LOW_ACTIVITY" | "INACTIVE" | "UNKNOWN";

// CHANGED: these values now match what evaluatePerformance() actually assigns
// (was: "PASS" | "FAIL" | "EXCEPTIONAL")
export type EvaluationResultStatus = "NEEDS_REVIEW" | "MEETS_REQUIREMENTS" | "BELOW_REQUIREMENTS" | "EXCEEDS_EXPECTATIONS";

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

// CHANGED: confidence -> confidenceScore, added status and evidence, createdAt -> evaluatedAt
export interface PlayerClassification {
  id: string;
  playerId: string;
  snapshotId?: string | null;
  role: AccountRole;
  confidenceScore: number;
  status: ClassificationStatus;
  evidence: {
    fighter: number;
    support: number;
    farm: number;
    inactive: number;
  };
  explanation: {
    summary: string;
    evidence: string[];
  };
  evaluatedAt: string;
}

// NEW: matches the cohortPercentiles object built in evaluatePerformance()
export interface CohortPercentiles {
  pPower: number;
  pMerits: number;
  pDeaths: number;
  pHealing: number;
  pGathering: number;
  pDonations: number;
  pHelps: number;
  pAssistance: number;
  pBehemoths: number;
  pBuildTime: number;
  pDestructionTime: number;
}

// CHANGED: rewritten to match the object evaluatePerformance() actually returns
export interface PerformanceEvaluation {
  id: string;
  playerId: string;
  classificationId: string;
  snapshotId?: string | null;
  activityState: ActivityState;
  evaluationResult: EvaluationResultStatus;
  roleRequirementsChecklist: RoleRequirementItem[];
  activityEvidenceChecklist: ActivityEvidenceItem[];
  cohortPercentiles: CohortPercentiles;
  performanceScore: number;
  performanceTier: PerformanceTier;
  combatScore: number;
  contributionScore: number;
  activityScore: number;
  weights: {
    combat: number;
    contribution: number;
    activity: number;
  };
  explanation: {
    summary: string;
    positives: string[];
    negatives: string[];
  };
  evaluatedAt: string;
  eligibilityStatus: EligibilityStatus;
  complianceStatus: ComplianceStatus;
  customScores?: {
    merits?: number;
    gathering?: number;
    deaths?: number;
    healing?: number;
    donations?: number;
    buildTime?: number;
    destructionTime?: number;
    resourceAssistance?: number;
    behemothWins?: number;
    allianceHelp?: number;
  };
  complianceMetrics?: {
    powerPassed?: boolean;
    meritRatioPassed: boolean;
    deathsPassed: boolean;
    activityPassed?: boolean;
    powerVal?: number;
    powerReq?: number;
    meritVal?: number;
    meritReq?: number;
    meritPctOfPower?: number;
    meritRatioPctTarget?: number;
    deathsVal?: number;
    deathsReq?: number;
    activityVal?: string;
    activityReq?: string;
  };
}

export interface Recommendation {
  id: string;
  playerId: string;
  classificationId: string;
  evaluationId?: string;
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

// CHANGED: rewritten to match { id, label, passed, actual, required } used in evaluatePerformance()
// (was: { role, requirement, met })
export interface RoleRequirementItem {
  id: string;
  label: string;
  passed: boolean;
  actual: string;
  required: string;
}

// CHANGED: rewritten to match { id, category, label, present, actualValue } used in evaluatePerformance()
// (was: { date, action, value })
export interface ActivityEvidenceItem {
  id: string;
  category: string;
  label: string;
  present: boolean;
  actualValue: string;
}