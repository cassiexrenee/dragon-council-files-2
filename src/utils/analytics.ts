import {
  Snapshot,
  AccountRole,
  ClassificationStatus,
  PerformanceTier,
  RecommendationType,
  PlayerClassification,
  PerformanceEvaluation,
  Recommendation,
  AllianceSettings,
  EligibilityStatus,
  ComplianceStatus,
  ActivityState,
  EvaluationResultStatus,
  RoleRequirementItem,
  ActivityEvidenceItem,
  CohortPercentiles
} from "../types";

// Helper to format numbers into clean abbreviated numbers (e.g., 106m, 10m, 1.1b, 900k)
export function formatWholeNumber(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) {
    const billions = val / 1_000_000_000;
    const rounded = Math.round(billions * 10) / 10;
    if (Number.isInteger(rounded)) {
      return `${Math.round(billions)}b`;
    }
    return `${rounded}b`;
  }
  if (abs >= 1_000_000) {
    const millions = Math.round(val / 1_000_000);
    if (millions >= 1) return `${millions}m`;
  }
  if (abs >= 1_000) {
    const thousands = Math.round(val / 1_000);
    return `${thousands}k`;
  }
  return `${Math.round(val)}`;
}

export interface LastActivityInfo {
  lastActiveDate: string;
  formattedDate: string;
  daysAgo: number;
  lastActiveSnapshotId?: string;
  isInactive: boolean;
  summary: string;
}

export function getLastActivityInfo(playerSnapshots: Snapshot[]): LastActivityInfo {
  if (!playerSnapshots || playerSnapshots.length === 0) {
    return {
      lastActiveDate: new Date().toISOString(),
      formattedDate: "No data",
      daysAgo: 0,
      isInactive: false,
      summary: "No recorded snapshots"
    };
  }

  const sorted = [...playerSnapshots].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  let zeroDataSnap: Snapshot | null = null;
  let hasZeroDataSnap = false;

  // Search backwards for the most recent snapshot where 0 data was added compared to previous snapshot
  for (let i = sorted.length - 1; i > 0; i--) {
    const curr = sorted[i];
    const prev = sorted[i - 1];

    const meritDelta = Math.abs(curr.merits - prev.merits);
    const donationDelta = Math.abs(curr.donations - prev.donations);
    const gatheringDelta = Math.abs(curr.gathering - prev.gathering);
    const powerDelta = Math.abs(curr.currentPower - prev.currentPower);
    const deathDelta = Math.abs((curr.t4Deaths + curr.t5Deaths) - (prev.t4Deaths + prev.t5Deaths));
    const healingDelta = Math.abs((curr.healing || 0) - (prev.healing || 0));
    const assistanceDelta = Math.abs((curr.resourceAssistance || 0) - (prev.resourceAssistance || 0));

    const isZeroDelta = meritDelta === 0 &&
      donationDelta === 0 &&
      gatheringDelta === 0 &&
      powerDelta === 0 &&
      deathDelta === 0 &&
      healingDelta === 0 &&
      assistanceDelta === 0;

    if (isZeroDelta) {
      zeroDataSnap = curr;
      hasZeroDataSnap = true;
      break;
    }
  }

  // Target snapshot is the most recent date with 0 data added if found, else latest snapshot
  const targetSnap = zeroDataSnap || sorted[sorted.length - 1];

  const recordTime = new Date(targetSnap.recordedAt).getTime();
  const now = Date.now();
  const daysAgo = Math.max(0, Math.floor((now - recordTime) / (1000 * 60 * 60 * 24)));
  
  const d = new Date(targetSnap.recordedAt);
  const formattedDate = !isNaN(d.getTime())
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : targetSnap.recordedAt;

  const isInactive = hasZeroDataSnap || sorted.length === 1;

  const summary = hasZeroDataSnap
    ? `${formattedDate} (${daysAgo === 0 ? "Today" : `${daysAgo}d ago`} - 0 data added)`
    : `${formattedDate} (${daysAgo === 0 ? "Today" : `${daysAgo}d ago`} - Active growth)`;

  return {
    lastActiveDate: targetSnap.recordedAt,
    formattedDate,
    daysAgo,
    lastActiveSnapshotId: targetSnap.id,
    isInactive,
    summary
  };
}

export function getPercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;
  const validValues = allValues.filter((v) => !isNaN(v));
  if (validValues.length === 0) return 0;
  
  // If everyone is 0, return 0
  const allZero = validValues.every(v => v === 0);
  if (allZero) return 0;

  const count = validValues.filter((v) => v < value).length;
  const equalCount = validValues.filter((v) => v === value).length;
  
  // Standard fractional ranking percentile
  const rank = count + (equalCount - 1) / 2;
  return Math.round((rank / validValues.length) * 100);
}

export interface PlayerMetricsCohort {
  merits: number[];
  deaths: number[];
  healing: number[];
  donations: number[];
  gathering: number[];
  resourceAssistance: number[];
  allianceHelp: number[];
  behemothWins: number[];
  buildTime: number[];
  destructionTime: number[];
  meritPowerRatios: number[];
}

export function buildCohort(latestSnapshots: Snapshot[]): PlayerMetricsCohort {
  return {
    merits: latestSnapshots.map((s) => s.merits),
    deaths: latestSnapshots.map((s) => s.t4Deaths + s.t5Deaths),
    healing: latestSnapshots.map((s) => s.healing),
    donations: latestSnapshots.map((s) => s.donations),
    gathering: latestSnapshots.map((s) => s.gathering),
    resourceAssistance: latestSnapshots.map((s) => s.resourceAssistance),
    allianceHelp: latestSnapshots.map((s) => s.allianceHelp),
    behemothWins: latestSnapshots.map((s) => s.behemothWins),
    buildTime: latestSnapshots.map((s) => s.buildTime || 0),
    destructionTime: latestSnapshots.map((s) => s.destructionTime || 0),
    meritPowerRatios: latestSnapshots.map((s) => s.merits / Math.max(1, s.currentPower)),
  };
}

export function getAggregatedPlayerSnapshot(playerSnapshots: Snapshot[]): Snapshot {
  if (playerSnapshots.length === 0) {
    const now = new Date().toISOString();
    return {
      id: "snap_empty",
      playerId: "",
      playerName: "Unknown",
      allianceId: "all_unknown",
      importId: "imp_empty",
      recordedAt: now,
      createdAt: now,
      currentPower: 0,
      highestPower: 0,
      merits: 0,
      t4Deaths: 0,
      t5Deaths: 0,
      healing: 0,
      donations: 0,
      gathering: 0,
      resourceAssistance: 0,
      allianceHelp: 0,
      behemothWins: 0,
      buildTime: 0,
      destructionTime: 0
    };
  }

  if (playerSnapshots.length === 1) {
    return playerSnapshots[0];
  }

  const sorted = [...playerSnapshots].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];

  const aggregateMetric = (key: keyof Snapshot): number => {
    const vals = sorted.map((s) => Number(s[key]) || 0);
    
    // Check if values are monotonically non-decreasing (cumulative snapshot series)
    let isCumulative = true;
    for (let i = 1; i < vals.length; i++) {
      if (vals[i] < vals[i - 1]) {
        isCumulative = false;
        break;
      }
    }

    if (isCumulative) {
      // Cumulative scans: maximum achieved metric across all snapshots
      return Math.max(...vals);
    } else {
      // Periodic / weekly logs: sum across ALL snapshots
      return vals.reduce((sum, v) => sum + v, 0);
    }
  };

  return {
    ...latest,
    currentPower: latest.currentPower || earliest.currentPower,
    highestPower: Math.max(...sorted.map((s) => s.highestPower || s.currentPower || 0)),
    merits: aggregateMetric("merits"),
    t4Deaths: aggregateMetric("t4Deaths"),
    t5Deaths: aggregateMetric("t5Deaths"),
    healing: aggregateMetric("healing"),
    donations: aggregateMetric("donations"),
    gathering: aggregateMetric("gathering"),
    resourceAssistance: aggregateMetric("resourceAssistance"),
    allianceHelp: aggregateMetric("allianceHelp"),
    behemothWins: aggregateMetric("behemothWins"),
    buildTime: aggregateMetric("buildTime"),
    destructionTime: aggregateMetric("destructionTime")
  };
}

export function classifyPlayer(
  playerId: string,
  playerSnapshots: Snapshot[],
  cohort: PlayerMetricsCohort,
  settings: AllianceSettings,
  manualOverrideRole?: AccountRole
): PlayerClassification {
  const latestSnapshot = getAggregatedPlayerSnapshot(playerSnapshots);
  const activeSeason = settings.configuration.activeSeason;
  const baseline = settings.configuration.seasonalPowerBaselines[activeSeason] || 10000000;

  // 1. If manual override is active, that dominates
  if (manualOverrideRole) {
    return {
      id: `class_override_${playerId}`,
      playerId,
      snapshotId: latestSnapshot?.id || null,
      role: manualOverrideRole,
      confidenceScore: 100,
      status: "MANUAL_OVERRIDE",
      evidence: { fighter: 100, support: 100, farm: 100, inactive: 100 },
      explanation: {
        summary: `Officer manual override applied. Effective role set to ${manualOverrideRole}.`,
        evidence: [
          `Manual assignment by alliance leadership.`,
          `This override stabilizes evaluations across seasonal changes.`
        ]
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  // If no snapshots, insufficient data
  if (!latestSnapshot) {
    return {
      id: `class_insufficient_${playerId}`,
      playerId,
      snapshotId: null,
      role: "NEEDS_REVIEW",
      confidenceScore: 0,
      status: "INSUFFICIENT_DATA",
      evidence: { fighter: 0, support: 0, farm: 0, inactive: 100 },
      explanation: {
        summary: "No historical snapshots available for this character ID.",
        evidence: ["Requires at least one valid snapshot to execute classification."]
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  // Calculate current player percentiles
  const currentDeaths = latestSnapshot.t4Deaths + latestSnapshot.t5Deaths;
  const currentMeritRatio = latestSnapshot.merits / Math.max(1, latestSnapshot.currentPower);
  const pMerits = getPercentile(currentMeritRatio, cohort.meritPowerRatios);
  const pDeaths = getPercentile(currentDeaths, cohort.deaths);
  const pHealing = getPercentile(latestSnapshot.healing, cohort.healing);
  const pDonations = getPercentile(latestSnapshot.donations, cohort.donations);
  const pGathering = getPercentile(latestSnapshot.gathering, cohort.gathering);
  const pAssistance = getPercentile(latestSnapshot.resourceAssistance, cohort.resourceAssistance);
  const pHelp = getPercentile(latestSnapshot.allianceHelp, cohort.allianceHelp);
  const pBehemoth = getPercentile(latestSnapshot.behemothWins, cohort.behemothWins);
  const pBuildTime = getPercentile(latestSnapshot.buildTime || 0, cohort.buildTime || []);

  // Check if player has multiple snapshots to analyze delta (inactivity)
  const isHistoricallyInactive = playerSnapshots.length >= 2 ? (() => {
    const prev = playerSnapshots[playerSnapshots.length - 2];
    const powerDelta = Math.abs(latestSnapshot.currentPower - prev.currentPower);
    const meritDelta = latestSnapshot.merits - prev.merits;
    const donationDelta = latestSnapshot.donations - prev.donations;
    const gatheringDelta = latestSnapshot.gathering - prev.gathering;
    const buildTimeDelta = (latestSnapshot.buildTime || 0) - (prev.buildTime || 0);

    return powerDelta < 50000 && meritDelta <= 0 && donationDelta <= 0 && gatheringDelta <= 50000 && buildTimeDelta <= 0;
  })() : false;

  // Compute Evidence Scores (0-100)
  // Fighter: Combat metrics (Merits, Deaths, Healing)
  const fighterEvidence = Math.round((pMerits * 0.45) + (pDeaths * 0.35) + (pHealing * 0.20));

  // Support: Alliance infrastructure (Donations, Help, Behemoth, Build Time)
  const supportEvidence = Math.round((pDonations * 0.35) + (pHelp * 0.25) + (pBehemoth * 0.20) + (pBuildTime * 0.20));

  // Farm: Economic metrics (Gathering, Resource Assistance) - weighted against combat
  const economicBase = (pGathering * 0.60) + (pAssistance * 0.40);
  const combatDampener = Math.max(0, (pMerits - 30) * 0.5);
  const farmEvidence = Math.round(Math.max(0, economicBase - combatDampener));

  // Inactive Evidence: Lack of deltas or flat bottom percentiles
  let inactiveEvidence = 0;
  if (isHistoricallyInactive) {
    inactiveEvidence = 95;
  } else {
    // If all key contribution metrics are in the bottom 25% of the cohort
    const allLow = pMerits < 20 && pDonations < 20 && pGathering < 20 && currentDeaths === 0;
    inactiveEvidence = allLow ? 80 : Math.max(0, 30 - Math.max(pMerits, pDonations, pGathering));
  }

  // Low power context adjustment
  const isBelowBaseline = latestSnapshot.currentPower < baseline;

  // Determine automatic role
  let autoRole: AccountRole = "NEEDS_REVIEW";
  let confidence = 0;
  let status: ClassificationStatus = "AUTO_CLASSIFIED";

  const scores = [
    { role: "FIGHTER" as AccountRole, score: fighterEvidence },
    { role: "SUPPORT" as AccountRole, score: supportEvidence },
    { role: "FARM" as AccountRole, score: farmEvidence },
    { role: "INACTIVE" as AccountRole, score: inactiveEvidence },
  ].sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];

  // Refined Role Classification Rules (Smoother & prevents unnecessary NEEDS_REVIEW)
  if (top.score < 25) {
    autoRole = "NEEDS_REVIEW";
    confidence = Math.round(top.score);
    status = "NEEDS_REVIEW";
  } else if (top.score - second.score < 8 && top.score < 45) {
    // Ambiguous low score
    autoRole = "NEEDS_REVIEW";
    confidence = Math.round(top.score);
    status = "NEEDS_REVIEW";
  } else {
    autoRole = top.role;
    confidence = Math.min(99, Math.round(top.score + (top.score - second.score) * 0.2));
  }

  // Low power context: if they are below baseline, redirect to Farm/Inactive unless they have top-tier combat evidence
  if (isBelowBaseline && autoRole === "FIGHTER" && fighterEvidence < 75) {
    autoRole = "FARM";
    confidence = Math.round(farmEvidence);
    status = "AUTO_CLASSIFIED";
  }

  // Compile explanation details and hybrid signatures
  const explanationEvidence: string[] = [];
  let summary = "";

  if (autoRole === "FIGHTER") {
    summary = "Combat activity and casualty absorption are the primary behavioral signature.";
    if (pMerits >= 50) explanationEvidence.push(`Consistent merit generation (Percentile: ${pMerits}%)`);
    if (pDeaths >= 50) explanationEvidence.push(`Frontline troop losses (Deaths Percentile: ${pDeaths}%)`);
    if (pHealing >= 50) explanationEvidence.push(`Active medical recovery (Hospital Healing Percentile: ${pHealing}%)`);
    if (supportEvidence >= 60) explanationEvidence.push("Hybrid Trait: Also demonstrates significant alliance support contributions.");
  } else if (autoRole === "SUPPORT") {
    summary = "Alliance contribution, technology investments, and speed-up aid are the primary focus.";
    if (pDonations >= 50) explanationEvidence.push(`High technology investment (Donations Percentile: ${pDonations}%)`);
    if (pHelp >= 50) explanationEvidence.push(`Consistent speed-up aid (Help clicks Percentile: ${pHelp}%)`);
    if (pBehemoth >= 50) explanationEvidence.push(`Raid event attendance (Behemoth Wins: ${latestSnapshot.behemothWins})`);
    if (fighterEvidence >= 50) explanationEvidence.push("Hybrid Trait: Active combat participant alongside support duties.");
  } else if (autoRole === "FARM") {
    summary = "Resource extraction and logistical transfers characterize this account.";
    if (pGathering >= 50) explanationEvidence.push(`High resource extraction volume (Gathering Percentile: ${pGathering}%)`);
    if (pAssistance >= 50) explanationEvidence.push(`Resource transports to main accounts (Percentile: ${pAssistance}%)`);
    if (latestSnapshot.merits === 0) explanationEvidence.push("Zero merits observed, confirming dedicated farm layout.");
  } else if (autoRole === "INACTIVE") {
    summary = "Account shows extremely low or static activity across consecutive snapshots.";
    if (isHistoricallyInactive) explanationEvidence.push("Zero delta in merits, donations, or power across snapshots.");
    else explanationEvidence.push("Activity signals lie uniformly in the bottom cohort tier.");
  } else {
    summary = "Balanced across multiple roles; escalated for leadership verification.";
    explanationEvidence.push(`Top candidates: ${scores[0].role} vs ${scores[1].role}`);
  }

  if (isBelowBaseline) {
    explanationEvidence.push(`Account power (${(latestSnapshot.currentPower / 1000000).toFixed(1)}M) lies below the ${activeSeason} baseline of ${(baseline / 1000000).toFixed(1)}M.`);
  }

  return {
    id: `class_auto_${playerId}_${latestSnapshot.id}`,
    playerId,
    snapshotId: latestSnapshot.id,
    role: autoRole,
    confidenceScore: confidence,
    status,
    evidence: {
      fighter: Math.round(fighterEvidence),
      support: Math.round(supportEvidence),
      farm: Math.round(farmEvidence),
      inactive: Math.round(inactiveEvidence),
    },
    explanation: {
      summary,
      evidence: explanationEvidence,
    },
    evaluatedAt: new Date().toISOString()
  };
}

function fmtNum(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return val.toLocaleString();
}

export function evaluatePerformance(
  playerId: string,
  playerSnapshots: Snapshot[],
  cohort: PlayerMetricsCohort,
  classification: PlayerClassification,
  settings: AllianceSettings
): PerformanceEvaluation {
  const latestSnapshot = getAggregatedPlayerSnapshot(playerSnapshots);

  // Fallback if no data
  if (!latestSnapshot) {
    return {
      id: `perf_insufficient_${playerId}`,
      playerId,
      classificationId: classification.id,
      snapshotId: null,
      activityState: "UNKNOWN",
      evaluationResult: "NEEDS_REVIEW",
      roleRequirementsChecklist: [],
      activityEvidenceChecklist: [],
      cohortPercentiles: {
        pPower: 0, pMerits: 0, pDeaths: 0, pHealing: 0, pGathering: 0,
        pDonations: 0, pHelps: 0, pAssistance: 0, pBehemoths: 0, pBuildTime: 0, pDestructionTime: 0
      },
      performanceScore: 0,
      performanceTier: "BELOW",
      combatScore: 0,
      contributionScore: 0,
      activityScore: 0,
      weights: { combat: 0.33, contribution: 0.33, activity: 0.33 },
      explanation: {
        summary: "Insufficient data to evaluate role requirements.",
        positives: [],
        negatives: ["No snapshots available for evaluation."]
      },
      evaluatedAt: new Date().toISOString(),
      eligibilityStatus: "BELOW_BASELINE",
      complianceStatus: "NOT_APPLICABLE"
    };
  }

  const activeSeason = settings.configuration.activeSeason || "S3";
  const baseline = settings.configuration.seasonalPowerBaselines[activeSeason] || 10000000;

  // 1. Calculate Cohort Percentiles for context
  const currentDeaths = latestSnapshot.t4Deaths + latestSnapshot.t5Deaths;
  const currentMeritRatio = latestSnapshot.merits / Math.max(1, latestSnapshot.currentPower);
  
  const cohortPower = cohort.meritPowerRatios ? cohort.meritPowerRatios.map((_, i) => latestSnapshot.currentPower) : [];
  const pPower = getPercentile(latestSnapshot.currentPower, cohortPower.length ? cohortPower : [latestSnapshot.currentPower]);
  const pMerits = getPercentile(currentMeritRatio, cohort.meritPowerRatios);
  const pDeaths = getPercentile(currentDeaths, cohort.deaths);
  const pHealing = getPercentile(latestSnapshot.healing, cohort.healing);
  const pDonations = getPercentile(latestSnapshot.donations, cohort.donations);
  const pGathering = getPercentile(latestSnapshot.gathering, cohort.gathering);
  const pAssistance = getPercentile(latestSnapshot.resourceAssistance, cohort.resourceAssistance);
  const pHelps = getPercentile(latestSnapshot.allianceHelp, cohort.allianceHelp);
  const pBehemoths = getPercentile(latestSnapshot.behemothWins, cohort.behemothWins);
  const pBuildTime = getPercentile(latestSnapshot.buildTime || 0, cohort.buildTime || []);
  const pDestructionTime = getPercentile(latestSnapshot.destructionTime || 0, cohort.destructionTime || []);

  const cohortPercentiles: CohortPercentiles = {
    pPower, pMerits, pDeaths, pHealing, pGathering, pDonations,
    pHelps, pAssistance, pBehemoths, pBuildTime, pDestructionTime
  };

  // 2. Determine Activity State (ACTIVE | LOW_ACTIVITY | INACTIVE | UNKNOWN)
  let activityState: ActivityState = "ACTIVE";
  if (classification.role === "INACTIVE") {
    activityState = "INACTIVE";
  } else {
    const hasGathering = latestSnapshot.gathering > 1_000_000;
    const hasDonations = latestSnapshot.donations > 10_000;
    const hasHelps = latestSnapshot.allianceHelp > 50;
    const hasCombat = latestSnapshot.merits > 10_000 || currentDeaths > 5_000;
    const hasAssistance = latestSnapshot.resourceAssistance > 500_000;

    const activityPoints = (hasGathering ? 1 : 0) + (hasDonations ? 1 : 0) + (hasHelps ? 1 : 0) + (hasCombat ? 1 : 0) + (hasAssistance ? 1 : 0);

    if (activityPoints === 0) {
      activityState = "INACTIVE";
    } else if (activityPoints <= 1) {
      activityState = "LOW_ACTIVITY";
    } else {
      activityState = "ACTIVE";
    }
  }

  // 3. Evaluate Compliance Targets & Requirements
  const role = classification.role;
  const targetMeritRatioPct = settings.configuration.complianceTargets?.meritRatioPct ?? 10;
  const targetDeathsMin = settings.configuration.complianceTargets?.deathsMin ?? 50000;
  const reqPower = baseline;
  const reqMerits = Math.round(latestSnapshot.currentPower * (targetMeritRatioPct / 100));

  const powerPassed = latestSnapshot.currentPower >= reqPower;
  const meritRatioPassed = latestSnapshot.merits >= reqMerits;
  const deathsPassed = currentDeaths >= targetDeathsMin;
  const activityPassed = activityState !== "INACTIVE";

  const roleRequirementsChecklist: RoleRequirementItem[] = [
    {
      id: "req_power",
      label: "Minimum Power Baseline",
      passed: powerPassed,
      actual: fmtNum(latestSnapshot.currentPower),
      required: `${fmtNum(reqPower)} required`
    },
    {
      id: "req_merits",
      label: `Merits (${targetMeritRatioPct}% of Power)`,
      passed: meritRatioPassed,
      actual: fmtNum(latestSnapshot.merits),
      required: `${fmtNum(reqMerits)} required`
    },
    {
      id: "req_deaths",
      label: "T4/T5 Troop Deaths",
      passed: deathsPassed,
      actual: fmtNum(currentDeaths),
      required: `${fmtNum(targetDeathsMin)} required`
    },
    {
      id: "req_activity",
      label: "Account Activity Status",
      passed: activityPassed,
      actual: activityState,
      required: "Active / Low Activity required"
    }
  ];

  // 4. Build Activity Evidence Checklist
  const activityEvidenceChecklist: ActivityEvidenceItem[] = [
    {
      id: "ev_gathering",
      category: "Gathering",
      label: "Resource Gathering",
      present: latestSnapshot.gathering > 1_000_000,
      actualValue: `${fmtNum(latestSnapshot.gathering)} gathered (${pGathering}th percentile)`
    },
    {
      id: "ev_assistance",
      category: "Resource Assistance",
      label: "Resource Dispatches",
      present: latestSnapshot.resourceAssistance > 500_000,
      actualValue: `${fmtNum(latestSnapshot.resourceAssistance)} transferred (${pAssistance}th percentile)`
    },
    {
      id: "ev_donations",
      category: "Alliance Tech",
      label: "Alliance Tech Donations",
      present: latestSnapshot.donations > 10_000,
      actualValue: `${fmtNum(latestSnapshot.donations)} points (${pDonations}th percentile)`
    },
    {
      id: "ev_helps",
      category: "Alliance Helps",
      label: "Alliance Helps Rendered",
      present: latestSnapshot.allianceHelp > 50,
      actualValue: `${latestSnapshot.allianceHelp} speed-up clicks (${pHelps}th percentile)`
    },
    {
      id: "ev_build",
      category: "Infrastructure",
      label: "Construction / Build Time",
      present: (latestSnapshot.buildTime || 0) > 600,
      actualValue: `${latestSnapshot.buildTime || 0}s build time (${pBuildTime}th percentile)`
    },
    {
      id: "ev_destruction",
      category: "Infrastructure",
      label: "Demolition / Destruction Time",
      present: (latestSnapshot.destructionTime || 0) > 0,
      actualValue: `${latestSnapshot.destructionTime || 0}s demolition time (${pDestructionTime}th percentile)`
    },
    {
      id: "ev_behemoth",
      category: "Raid Attendance",
      label: "Behemoth Raid Victory",
      present: latestSnapshot.behemothWins > 0,
      actualValue: `${latestSnapshot.behemothWins} behemoth victories (${pBehemoths}th percentile)`
    },
    {
      id: "ev_combat",
      category: "Combat",
      label: "Frontline Combat Output",
      present: latestSnapshot.merits > 10_000 || currentDeaths > 5_000,
      actualValue: `${fmtNum(latestSnapshot.merits)} merits / ${fmtNum(currentDeaths)} deaths`
    }
  ];

  // 5. Determine Evaluation Result Status
  const allReqsPassed = roleRequirementsChecklist.length > 0 && roleRequirementsChecklist.every((r) => r.passed);
  let evaluationResult: EvaluationResultStatus = "MEETS_REQUIREMENTS";

  if (role === "NEEDS_REVIEW" || (activityState as string) === "UNKNOWN") {
    evaluationResult = "NEEDS_REVIEW";
  } else if (!allReqsPassed) {
    evaluationResult = "BELOW_REQUIREMENTS";
  } else if (allReqsPassed && pMerits >= 80 && pDeaths >= 80) {
    evaluationResult = "EXCEEDS_EXPECTATIONS";
  } else {
    evaluationResult = "MEETS_REQUIREMENTS";
  }

  // Legacy Compatibility Mappings
  const performanceScore = (activityState === "INACTIVE" || role === "INACTIVE") ? 0 : (allReqsPassed ? (evaluationResult === "EXCEEDS_EXPECTATIONS" ? 90 : 78) : 42);
  const performanceTier: PerformanceTier = (activityState === "INACTIVE" || role === "INACTIVE")
    ? "INACTIVE"
    : evaluationResult === "EXCEEDS_EXPECTATIONS"
      ? "EXCEEDS"
      : allReqsPassed
        ? "MEETS"
        : "BELOW";
  const eligibilityStatus: EligibilityStatus = latestSnapshot.currentPower >= baseline ? "ELIGIBLE" : (role === "FARM" ? "LIKELY_FARM" : "BELOW_BASELINE");
  const complianceStatus: ComplianceStatus = evaluationResult === "EXCEEDS_EXPECTATIONS" ? "EXEMPLARY" : (allReqsPassed ? "COMPLIANT" : "NON_COMPLIANT");

  const summary = `Evaluation: ${evaluationResult.replace("_", " ")}. Account Activity: ${activityState}. (${roleRequirementsChecklist.filter(r => r.passed).length}/${roleRequirementsChecklist.length} compliance criteria met).`;

  return {
    id: `perf_${playerId}_${latestSnapshot.id}`,
    playerId,
    classificationId: classification.id,
    snapshotId: latestSnapshot.id,
    activityState,
    evaluationResult,
    roleRequirementsChecklist,
    activityEvidenceChecklist,
    cohortPercentiles,
    performanceScore,
    performanceTier,
    combatScore: Math.round((pMerits + pDeaths) / 2),
    contributionScore: Math.round((pHealing + pDonations) / 2),
    activityScore: Math.round(pGathering),
    weights: { combat: 0.4, contribution: 0.3, activity: 0.3 },
    explanation: {
      summary,
      positives: roleRequirementsChecklist.filter(r => r.passed).map(r => `Met ${r.label} (${r.actual})`),
      negatives: roleRequirementsChecklist.filter(r => !r.passed).map(r => `Below ${r.label} (${r.actual} vs ${r.required})`)
    },
    evaluatedAt: new Date().toISOString(),
    customScores: {
      deaths: Math.round(pDeaths),
      merits: Math.round(pMerits),
      gathering: Math.round(pGathering),
      healing: Math.round(pHealing),
      donations: Math.round(pDonations),
      buildTime: Math.round(pBuildTime),
      destructionTime: Math.round(pDestructionTime),
      resourceAssistance: Math.round(pAssistance),
      behemothWins: Math.round(latestSnapshot.behemothWins || 0),
      allianceHelp: Math.round(pHelps)
    },
    eligibilityStatus,
    complianceStatus,
    complianceMetrics: {
      powerPassed,
      meritRatioPassed,
      deathsPassed,
      activityPassed,
      powerVal: latestSnapshot.currentPower,
      powerReq: reqPower,
      meritVal: latestSnapshot.merits,
      meritReq: reqMerits,
      meritPctOfPower: Number((currentMeritRatio * 100).toFixed(1)),
      meritRatioPctTarget: targetMeritRatioPct,
      deathsVal: currentDeaths,
      deathsReq: targetDeathsMin,
      activityVal: activityState,
      activityReq: "ACTIVE"
    }
  };
}

export function generateRecommendation(
  playerId: string,
  classification: PlayerClassification,
  evaluation: PerformanceEvaluation,
  playerSnapshots: Snapshot[]
): Recommendation {
  const latestSnapshot = getAggregatedPlayerSnapshot(playerSnapshots);
  let recommendation: RecommendationType = "KEEP";
  const evidence: string[] = [];
  const drivers: string[] = [];
  let summary = "";

  const role = classification.role;
  const tier = evaluation.performanceTier;
  const eligibility = evaluation.eligibilityStatus || "ELIGIBLE";
  const compliance = evaluation.complianceStatus || "COMPLIANT";

  // Check custom exception cases requested by the user:
  
  // Exception Case 1: Merit Failure but strong combat percentiles (Fighter)
  const isMeritFailureButStrongCombat = 
    eligibility === "ELIGIBLE" && 
    !evaluation.complianceMetrics?.meritRatioPassed && 
    classification.role === "FIGHTER" && 
    (evaluation.customScores?.merits || 0) >= 75; // Strong Combat/Merit percentile

  // Exception Case 2: Merit Passed but poor fighter (Below expectations)
  const isMeritPassButPoorFighter = 
    eligibility === "ELIGIBLE" && 
    evaluation.complianceMetrics?.meritRatioPassed && 
    classification.role === "FIGHTER" && 
    tier === "BELOW";

  // Exception Case 3: Low power, strong Farm
  const isLowPowerStrongFarm = 
    eligibility !== "ELIGIBLE" && 
    classification.role === "FARM" && 
    (evaluation.customScores?.gathering || 0) >= 70;

  if (isLowPowerStrongFarm) {
    recommendation = "KEEP_AS_FARM";
    summary = "Recommend keeping account within specialized farm roster.";
    drivers.push("Low power farm account with exceptional gathering logistics.");
    evidence.push(`Gathering percentile is ${evaluation.customScores?.gathering}%. Excluded from main player performance rankings.`);
  } else if (isMeritFailureButStrongCombat) {
    recommendation = "MANUAL_REVIEW";
    summary = "System flags player for manual review due to strong combat presence despite missing flat merit requirements.";
    drivers.push("Technically missed flat merit target, but combat activity/casualty percentiles are in top tier.");
    evidence.push("This player technically missed the requirement, but the reason may be that their combat contribution is being expressed through other metrics.");
  } else if (isMeritPassButPoorFighter) {
    recommendation = "MONITOR";
    summary = "Recommend monitoring. Player technically passes flat merit target but demonstrates weak active fighter contributions.";
    drivers.push("Passes basic merit compliance rule, but active fighter performance (casualty ratios) is below peer standard.");
    evidence.push("The player technically passes the alliance rule but may still be a weak combat account.");
  } else if (eligibility === "LIKELY_INACTIVE" || role === "INACTIVE") {
    recommendation = "REMOVE";
    summary = "Recommend roster review or removal due to persistent inactivity.";
    drivers.push("Account shows no meaningful delta activity across consecutive weeks or falls below baseline with zero output.");
    evidence.push("Zero metrics change between snapshots or falls below baseline with zero active indicators.");
  } else if (eligibility === "LIKELY_FARM") {
    recommendation = "KEEP_AS_FARM";
    summary = "Keep as developer farm account. Excluded from primary roster expectations.";
    drivers.push("Sub-baseline account with active gathering or technology support indicators.");
    evidence.push(`Current power is ${(latestSnapshot?.currentPower || 0) / 1000000}M with high utility statistics.`);
  } else if (role === "NEEDS_REVIEW") {
    recommendation = "MANUAL_REVIEW";
    summary = "System requests manual officer audit due to ambiguous behavioral signal.";
    drivers.push("Contradictory account signature.");
    evidence.push("Top classifications are within too close a margins range.");
  } else {
    // Normal Eligible Player Routing
    if (tier === "EXCEEDS") {
      recommendation = "KEEP";
      summary = "Strong frontline combat contribution. Meets seasonal requirements and significantly outperforms peers.";
      drivers.push("Core role performance is substantially above peer medians.");
      evidence.push(`Performance score of ${evaluation.performanceScore} placing in the exceeds tier.`);
    } else if (tier === "MEETS") {
      recommendation = "KEEP";
      summary = "Steady, contributing player. Maintain current roster position.";
      drivers.push("Sustains normal baseline activity for this role.");
      evidence.push(`Stable metrics matching ${role} expectations.`);
    } else {
      // Below expectations but eligible
      const historicallyStrong = playerSnapshots.length >= 3 && (() => {
        const first = playerSnapshots[0];
        const latest = playerSnapshots[playerSnapshots.length - 1];
        return (latest.merits - first.merits) > 1000000;
      })();

      if (historicallyStrong) {
        recommendation = "MONITOR";
        summary = "Temporary performance dip observed. Historically reliable contributor.";
        drivers.push("Active combat history contradicts recent reporting drop.");
        evidence.push("Monitor player combat indicators during the next KvK reporting cycle.");
      } else {
        recommendation = "SUPPORT";
        summary = "Recommend officer mentoring or reallocation to secondary support rosters.";
        drivers.push("Sustained below-threshold contribution.");
        evidence.push("Provide guidelines for alliance help, donation and merit milestones.");
      }
    }
  }

  return {
    id: `rec_${playerId}_${Date.now()}`,
    playerId,
    classificationId: classification.id,
    evaluationId: evaluation.id,
    recommendation,
    reason: {
      summary,
      evidence,
      drivers
    },
    status: "PENDING",
    createdAt: new Date().toISOString()
  };
}

// Sunday Reset & Cumulative Metrics handling helper functions
export function getPrecedingSundayUTC(dateStr: string): Date {
  const d = new Date(dateStr);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday, etc.
  
  const preceding = new Date(d.getTime());
  preceding.setUTCDate(d.getUTCDate() - day);
  preceding.setUTCHours(0, 0, 0, 0);
  return preceding;
}

export function crossedSundayUTC(dateStr1: string, dateStr2: string): boolean {
  const sunday1 = getPrecedingSundayUTC(dateStr1);
  const sunday2 = getPrecedingSundayUTC(dateStr2);
  return sunday1.getTime() !== sunday2.getTime();
}

export function getSeasonIndex(dateStr: string, seasonStartDate?: string, seasonEndDate?: string): number {
  const startStr = seasonStartDate || "2026-06-19";
  const endStr = seasonEndDate || "2026-07-31";
  
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const currentDate = new Date(dateStr).getTime();
  
  const diffMs = currentDate - start;
  const oneDayMs = 1000 * 60 * 60 * 24;
  const seasonLengthDays = Math.max(1, Math.round((end - start) / oneDayMs));
  const divisor = seasonLengthDays + 1; // standard day count divisor
  
  const diffDays = diffMs / oneDayMs;
  return Math.floor(diffDays / divisor);
}

export function reconstructSnapshots(
  snapshots: Snapshot[],
  seasonStartDate?: string,
  seasonEndDate?: string
): Snapshot[] {
  if (snapshots.length === 0) return [];

  // Group snapshots by playerId
  const playerGroups: Record<string, Snapshot[]> = {};
  snapshots.forEach((s) => {
    if (!playerGroups[s.playerId]) {
      playerGroups[s.playerId] = [];
    }
    playerGroups[s.playerId].push(s);
  });

  const reconstructedList: Snapshot[] = [];

  Object.entries(playerGroups).forEach(([playerId, pSnaps]) => {
    // Sort by recordedAt ascending
    const sorted = [...pSnaps].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      reconstructedList.push(sorted[i]);
    }
  });

  return reconstructedList;
}

export interface PlayerRecord {
  characterId: string;
  name: string;
  power: number;
  merits: number;
  deaths: number;
  migrationStatus?: 'IMMIGRATED' | 'MIGRATED' | 'RETAINED';
}

export function reconcileSnapshots(
  previousSnapshot: PlayerRecord[],
  newSnapshot: PlayerRecord[]
): PlayerRecord[] {
  const prevMap = new Map(previousSnapshot.map((p) => [p.characterId, p]));
  const currMap = new Map(newSnapshot.map((p) => [p.characterId, p]));

  const reconciledRoster: PlayerRecord[] = [];

  // 1. Process all players in the NEW snapshot
  newSnapshot.forEach((player) => {
    if (!prevMap.has(player.characterId)) {
      // Absent from previous snapshot, present in new -> IMMIGRATED
      reconciledRoster.push({
        ...player,
        migrationStatus: 'IMMIGRATED',
      });
    } else {
      // Present in both -> RETAINED
      reconciledRoster.push({
        ...player,
        migrationStatus: 'RETAINED',
      });
    }
  });

  // 2. Identify players missing from the NEW snapshot
  previousSnapshot.forEach((player) => {
    if (!currMap.has(player.characterId)) {
      // Present in previous snapshot, absent from new -> MIGRATED
      reconciledRoster.push({
        ...player,
        migrationStatus: 'MIGRATED',
      });
    }
  });

  return reconciledRoster;
}

