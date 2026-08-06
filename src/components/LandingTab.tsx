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
  players = [],
  snapshots = [],
  settings = {},
  evaluations = [],
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
    if (!snapshots || snapshots.length === 0) return 0;
    const uniquePlayers = new Set(snapshots.map(s => s?.playerId)).size || players?.length || 1;
    return snapshots.reduce((acc, s) => acc + (s?.currentPower || 0), 0) / (snapshots.length / uniquePlayers || 1);
  }, [snapshots, players]);

  const totalMerits = React.useMemo(() => {
    if (!snapshots) return 0;
    return snapshots.reduce((acc, s) => acc + (s?.merits || 0), 0);
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
    <div className="space-y-16 pb-16 text-[#E0D4F5] font-sans">
      
      {/* 1. HERO SECTION: Royal Council Archive & Beyond the Spreadsheet */}
      <div className="relative rounded-3xl bg-[#130A24] border border-[#4A306D] p-8 sm:p-12 lg:p-16 shadow-[0_0_40px_rgba(74,48,109,0.2)] overflow-hidden">
        
        {/* Tech Grid & Atmosphere */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(#7C52AB_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#9D7BCE]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#EC4899]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-8 max-w-5xl">
          
          {/* Main Headline & Subhead */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] flex items-center gap-4">
              Lead Your Alliance, Ditch the Spreadsheets <Sparkles className="text-[#F2D48E] hidden md:block" size={48} />
            </h1>
            <p className="text-xl sm:text-2xl text-[#F2D48E] tracking-wide font-medium">
              Dragon Council — A friendly workspace for alliance leaders
            </p>
            <p className="text-base sm:text-lg text-[#CDBCEB] leading-relaxed max-w-3xl pt-2">
              Keep track of player progress, history, and daily stats all in one organized place. Spend less time crunching numbers and more time actually playing the game!
            </p>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onNavigateToTab("overview")}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#6B4E90] via-[#855CAE] to-[#9D7BCE] hover:from-[#7C52AB] hover:to-[#B594DF] text-white font-bold text-sm uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(157,123,206,0.4)] transition-all cursor-pointer group border border-[#B594DF]/30"
            >
              <Sparkle size={18} className="text-[#F2D48E]" />
              <span>Open Your Workspace</span>
              <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform text-[#F2D48E]" />
            </button>
          </div>

        </div>

      </div>

      {/* 2. HERO NARRATIVE: Beyond the Spreadsheet */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#1A1033]/90 border border-[#4A306D] shadow-[0_0_30px_rgba(30,15,50,0.5)] relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6B4E90]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
              <Sparkles size={32} className="text-[#9D7BCE]" /> Say Goodbye to Data Stress
            </h2>
            <p className="text-sm sm:text-base text-[#CDBCEB] leading-relaxed">
              Running a big alliance is tough enough without staring at endless rows of data. It's easy to get <strong className="text-[#F472B6]">burnt out</strong> trying to remember everyone's stats, farm accounts, and recent activity. 
            </p>
            <p className="text-sm sm:text-base text-[#CDBCEB] leading-relaxed">
              Dragon Council makes it simple. We take all your game exports and organize them into clear, easy-to-read profiles. It's built to give you and your officers <strong className="text-[#F2D48E]">helpful summaries and quick answers</strong>, so you can make confident decisions without the headache.
            </p>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#10081C] border border-[#4A306D]/80 space-y-4 relative">
            <Sparkle className="absolute -top-3 -right-3 text-[#F2D48E]/70" size={20} />
            <Sparkle className="absolute -bottom-3 -left-3 text-[#F2D48E]/70" size={20} />
            
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#1A1033] border border-[#4A306D]/50">
                <span className="text-[#F472B6] font-bold font-mono">BEFORE</span>
                <span className="text-[#A28BB2]">Messy spreadsheets, confusing alt accounts, and spending hours trying to figure out who is who.</span>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#1A1033] border border-[#F2D48E]/40 shadow-[0_0_15px_rgba(242,212,142,0.15)]">
                <span className="text-[#F2D48E] font-bold font-mono">AFTER</span>
                <span className="text-[#E0D4F5]">Clean player profiles, automatically linked farm accounts, and easy-to-read alliance summaries.</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
