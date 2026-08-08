import React, { useState } from "react";
import { formatWholeNumber } from "../utils/analytics";
import { 
  Player, 
  Snapshot, 
  AllianceSettings, 
  PerformanceEvaluation 
} from "../types";
import { 
  Shield, 
  Swords, 
  Trophy, 
  Users, 
  Flame, 
  Scroll, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Crown, 
  Target, 
  Activity, 
  Send, 
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap,
  Award,
  Layers,
  Link2,
  Scale,
  Globe,
  Radio,
  Lock,
  MessageSquare,
  BarChart3,
  HelpCircle,
  Clock,
  Sparkle,
  Compass
} from "lucide-react";

interface LandingTabProps {
  players: Player[];
  snapshots: Snapshot[];
  settings: AllianceSettings;
  evaluations: PerformanceEvaluation[];
  onNavigateToTab: (tab: string) => void;
  onSelectPlayer?: (playerId: string) => void;
  onApplyForRecruitment?: (applicant: {
    characterName: string;
    power: number;
    merits: number;
    troopTier: string;
    preferredRole: string;
  }) => void;
}

export default function LandingTab({
  players,
  snapshots,
  settings,
  evaluations,
  onNavigateToTab,
  onSelectPlayer,
  onApplyForRecruitment
}: LandingTabProps) {
  // Application Form State
  const [showAppModal, setShowAppModal] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantPower, setApplicantPower] = useState("18000000");
  const [applicantMerits, setApplicantMerits] = useState("2200000");
  const [applicantTier, setApplicantTier] = useState("T4");
  const [applicantRole, setApplicantRole] = useState("FIGHTER");
  const [appSubmitted, setAppSubmitted] = useState(false);

  // Interactive Pipeline Demo State
  const [pipelineStep, setPipelineStep] = useState<number>(1);
  const [simulatedPower, setSimulatedPower] = useState<number>(22000000);
  const [simulatedMerits, setSimulatedMerits] = useState<number>(2500000);

  // Active season & baseline values
  const activeSeason = settings?.configuration?.activeSeason || "S3";
  const powerBaseline = settings?.configuration?.seasonalPowerBaselines?.[activeSeason] || 15000000;
  const meritTargetPct = settings?.configuration?.complianceTargets?.meritRatioPct || 10;

  // Aggregate stats
  const totalPower = React.useMemo(() => {
    if (snapshots.length === 0) return 0;
    const uniquePlayers = new Set(snapshots.map(s => s.playerId)).size || players.length || 1;
    return snapshots.reduce((acc, s) => acc + (s.currentPower || 0), 0) / (snapshots.length / uniquePlayers || 1);
  }, [snapshots, players]);

  const totalMerits = React.useMemo(() => {
    return snapshots.reduce((acc, s) => acc + (s.merits || 0), 0);
  }, [snapshots]);

  // Instant eligibility evaluation for applicant
  const parsedPower = parseFloat(applicantPower) || 0;
  const parsedMerits = parseFloat(applicantMerits) || 0;
  const meritRatio = parsedPower > 0 ? (parsedMerits / parsedPower) * 100 : 0;
  
  const isPowerEligible = parsedPower >= powerBaseline;
  const isMeritEligible = meritRatio >= meritTargetPct;

  let eligibilityStatus: "EXCELLENT" | "QUALIFIED" | "REVIEW_NEEDED" | "ACADEMY" = "REVIEW_NEEDED";
  if (isPowerEligible && isMeritEligible) {
    eligibilityStatus = "EXCELLENT";
  } else if (isPowerEligible) {
    eligibilityStatus = "QUALIFIED";
  } else if (parsedPower >= powerBaseline * 0.7) {
    eligibilityStatus = "REVIEW_NEEDED";
  } else {
    eligibilityStatus = "ACADEMY";
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) return;

    if (onApplyForRecruitment) {
      onApplyForRecruitment({
        characterName: applicantName.trim(),
        power: parsedPower,
        merits: parsedMerits,
        troopTier: applicantTier,
        preferredRole: applicantRole
      });
    }

    setAppSubmitted(true);
    setTimeout(() => {
      setShowAppModal(false);
      setAppSubmitted(false);
      setApplicantName("");
    }, 7000);
  };

  // Pipeline simulation calculations
  const simRatio = simulatedPower > 0 ? (simulatedMerits / simulatedPower) * 100 : 0;
  const simEligible = simulatedPower >= powerBaseline;
  const simCompliant = simRatio >= meritTargetPct;

  return (
    <div className="space-y-16 pb-16 text-slate-200">
      
      {/* 1. HERO SECTION: Royal Council Archive & Beyond the Spreadsheet */}
      <div className="relative rounded-2xl bg-[#171719] border border-[#364958] p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden">
        
        {/* Constellation Grid & Radiant Atmosphere */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(#E7CB9C_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#E7CB9C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#364958]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8 max-w-5xl">
          
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#364958]/40 border border-[#364958] text-slate-300 text-xs font-mono font-medium">
              <Compass size={14} className="text-amber-300" /> Kingdom #142 Military Telemetry
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              Active Season {activeSeason}
            </span>
          </div>

          {/* Main Headline & Subhead */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-script font-bold text-white tracking-tight leading-[1.1]">
              Lead with Intelligence, Not Spreadsheets
            </h1>
            <p className="text-xl sm:text-2xl font-script text-[#E7CB9C] tracking-wide font-medium">
              Dragon Council — Alliance Intelligence & Decision Platform
            </p>
            <p className="text-base sm:text-lg text-slate-300 font-ledger leading-relaxed max-w-3xl pt-2">
              Centralize player analytics, historical records, and performance insights into one strategic workspace designed for alliance leadership.
            </p>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onNavigateToTab("overview")}
              className="flex items-center gap-3 px-7 py-4 bg-gradient-to-r from-[#E7CB9C] via-[#d4b37d] to-[#c5a168] hover:from-[#f0d6aa] hover:to-[#d4b37d] text-[#171719] font-display font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(231,203,156,0.3)] transition-all cursor-pointer group"
            >
              <span>Enter Command Console</span>
              <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform text-[#171719]" />
            </button>
          </div>

        </div>

      </div>

      {/* 2. HERO NARRATIVE: Beyond the Spreadsheet */}
      <div className="p-8 sm:p-12 rounded-2xl bg-[#171719]/90 border border-[#364958] shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-script font-bold text-white">
              Beyond the Spreadsheet
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-ledger leading-relaxed">
              Competitive kingdoms operate under intense administrative pressure, often resulting in <strong className="text-amber-300">"spreadsheet burnout"</strong> and subjective decision-making based on incomplete context. 
            </p>
            <p className="text-sm sm:text-base text-slate-300 font-ledger leading-relaxed">
              Dragon Council is the solution — a platform that acts as an <strong className="text-white">active intelligence layer</strong>, unifying data from Farlight exports, DragonStats, and manual records into a centralized, explainable archive. Unlike standard stat trackers, this system is engineered to <strong className="text-[#E7CB9C]">inform leadership, not replace it</strong>, ensuring human officers retain final execution authority.
            </p>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-[#0F0F12] border border-[#364958]/80 space-y-4">
            <div className="space-y-3 text-xs font-ledger">
              <div className="flex items-start gap-3 p-2.5 rounded bg-[#171719] border border-[#364958]/40">
                <span className="text-red-400 font-bold font-mono">BEFORE</span>
                <span className="text-slate-400">150 raw spreadsheet rows, lost multi-account context, recency bias & fatigue.</span>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded bg-[#171719] border border-[#E7CB9C]/30">
                <span className="text-[#E7CB9C] font-bold font-mono">AFTER</span>
                <span className="text-slate-200">Structured 5-layer decision pipeline, linked main/farm identities & plain-text advisory queues.</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
