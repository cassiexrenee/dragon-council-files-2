export type AccountRole = "FIGHTER" | "SUPPORT" | "FARM" | "INACTIVE" | "NEEDS_REVIEW";

export type ClassificationStatus = "AUTO_CLASSIFIED" | "MANUAL_OVERRIDE" | "NEEDS_REVIEW" | "INSUFFICIENT_DATA";

export type PerformanceTier = "EXCEEDS" | "MEETS" | "BELOW" | "INACTIVE";

export type EligibilityStatus = "ELIGIBLE" | "BELOW_BASELINE" | "LIKELY_FARM" | "LIKELY_INACTIVE";

export type ComplianceStatus = "EXEMPLARY" | "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";

export type ActivityState = "ACTIVE" | "LOW_ACTIVITY" | "INACTIVE" | "UNKNOWN";

export type EvaluationResultStatus = "MEETS_REQUIREMENTS" | "EXCEEDS_EXPECTATIONS" | "BELOW_REQUIREMENTS" | "NEEDS_REVIEW" | "NOT_APPLICABLE";

export type RecommendationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "OVERRIDDEN";

export type RecommendationType = "KEEP" | "SUPPORT" | "MONITOR" | "KEEP_AS_FARM" | "REMOVE" | "MANUAL_REVIEW";

export interface RoleRequirementItem {
  id: string;
  label: string;
  passed: boolean;
  actual: string;
  required: string;
  detail?: string;
}

export interface ActivityEvidenceItem {
  id: string;
  category: string;
  label: string;
  present: boolean;
  actualValue: string;
}

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

export interface Player {
  characterId: string;
  currentName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerNameHistory {
  id: string;
  playerId: string;
  name: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Snapshot {
  id: string;
  playerId: string;
  playerName: string; // convenience to avoid joining inside components
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
  snapshotId: string | null;
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

export interface PerformanceEvaluation {
  id: string;
  playerId: string;
  classificationId: string;
  snapshotId: string | null;
  activityState?: ActivityState;
  evaluationResult?: EvaluationResultStatus;
  roleRequirementsChecklist?: RoleRequirementItem[];
  activityEvidenceChecklist?: ActivityEvidenceItem[];
  cohortPercentiles?: CohortPercentiles;
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
  customScores?: {
    deaths: number;
    merits: number;
    gathering: number;
    healing: number;
    donations: number;
    buildTime: number;
    destructionTime: number;
    resourceAssistance: number;
    behemothWins: number;
    allianceHelp: number;
  };
  eligibilityStatus?: EligibilityStatus;
  complianceStatus?: ComplianceStatus;
  complianceMetrics?: {
    powerPassed: boolean;
    meritRatioPassed: boolean;
    deathsPassed: boolean;
    activityPassed: boolean;
    powerVal: number;
    powerReq: number;
    meritVal: number;
    meritReq: number;
    meritPctOfPower?: number;
    meritRatioPctTarget?: number;
    deathsVal: number;
    deathsReq: number;
    activityVal: string;
    activityReq: string;
  };
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

export interface Recommendation {
  id: string;
  playerId: string;
  classificationId: string;
  evaluationId: string;
  recommendation: RecommendationType;
  reason: {
    summary: string;
    evidence: string[];
    drivers: string[];
  };
  status: RecommendationStatus;
  createdAt: string;
}

export interface RecommendationReview {
  id: string;
  recommendationId: string;
  reviewedBy: string;
  decision: "ACCEPTED" | "REJECTED" | "OVERRIDDEN";
  reason: string;
  createdAt: string;
}

export interface ImportSession {
  id: string;
  filename: string;
  uploadedBy: string;
  importedAt: string;
  rowCount: number;
  status: "PENDING" | "VALIDATED" | "COMPLETED" | "FAILED" | "COMPLETED_WITH_WARNINGS";
  warnings: string[];
  source: "DragonStats" | "Farlight" | "Manual";
}

export interface AllianceSettings {
  allianceId: string;
  activeProfile: "CASUAL" | "STANDARD" | "HARDCORE" | "CUSTOM";
  configuration: {
    weights: {
      FIGHTER: { combat: number; contribution: number; activity: number };
      SUPPORT: { combat: number; contribution: number; activity: number };
      FARM: { combat: number; contribution: number; activity: number };
      INACTIVE: { combat: number; contribution: number; activity: number };
      NEEDS_REVIEW: { combat: number; contribution: number; activity: number };
    };
    thresholds: {
      below: number; // e.g. 45
      meets: number; // e.g. 75
    };
    seasonalPowerBaselines: {
      S1: number;
      S2: number;
      S3: number;
      SoS: number;
    };
    activeSeason: "S1" | "S2" | "S3" | "SoS";
    seasonStartDate?: string;
    finalZoneOpenDate?: string;
    seasonSummaryDate?: string;
    seasonEndDate?: string;
    roleRequirements?: {
      FIGHTER?: {
        minPower?: number;
        minMeritsPct?: number; // e.g., 10 (%)
        minDeaths?: number; // e.g., 50000
        minBehemothWins?: number; // e.g., 5
        requireActivity?: boolean;
      };
      SUPPORT?: {
        minPower?: number;
        minMeritsPct?: number; // e.g., 5 (%)
        minBehemothWins?: number; // e.g., 5
        minDonations?: number; // e.g., 50000
        minAllianceHelp?: number; // e.g., 500
        requireActivity?: boolean;
      };
      FARM?: {
        minGathering?: number; // e.g. 50000000
        minResourceAssistance?: number; // e.g. 5000000
        minAllianceHelp?: number; // e.g. 200
        requireActivity?: boolean;
      };
    };
    complianceTargets?: {
      meritRatioPct?: number; // e.g. 10 (%)
      deathsMin?: number; // e.g. 50000
      activityRequired?: boolean; // default true
    };
    discordWebhookUrl?: string;
    customScoringWeights?: {
      deaths: number;
      merits: number;
      gathering: number;
      healing: number;
      donations: number;
      buildTime: number;
      destructionTime: number;
      resourceAssistance: number;
      behemothWins: number;
      allianceHelp: number;
    };
    customScoringWeightsMode?: "percentage" | "millions";
    customScoringWeightsModes?: {
      deaths: "percentage" | "millions";
      merits: "percentage" | "millions";
      gathering: "percentage" | "millions";
      healing: "percentage" | "millions";
      donations: "percentage" | "millions";
      buildTime: "percentage" | "millions";
      destructionTime: "percentage" | "millions";
      resourceAssistance: "percentage" | "millions";
      behemothWins: "percentage" | "millions";
      allianceHelp: "percentage" | "millions";
    };
    customScoringWeightsEnabled?: {
      deaths: boolean;
      merits: boolean;
      gathering: boolean;
      healing: boolean;
      donations: boolean;
      buildTime: boolean;
      destructionTime: boolean;
      resourceAssistance: boolean;
      behemothWins: boolean;
      allianceHelp: boolean;
    };
  };
  updatedAt: string;
}

export interface WarLogEntry {
  id: string;
  timestamp: string;
  title: string;
  actor: string;
  description: string;
  severity: "DIPLOMATIC" | "VANGUARD" | "CRITICAL" | "SYSTEM";
  zone?: string;
  locationCoordinates?: string;
  recordedBy?: string;
}
