import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Shield, Sparkles, RefreshCw, CheckCircle2, Zap, Radio, Layers, Cpu } from "lucide-react";

export type LoadingVariant = "dragonfire" | "cyber_cyan" | "emerald_guard" | "obsidian_gothic";

export interface CustomLoadingBarProps {
  progress: number; // 0 to 100
  statusText?: string;
  subText?: string;
  variant?: LoadingVariant;
  size?: "sm" | "md" | "lg";
  showPercent?: boolean;
  showRuneAnimation?: boolean;
  showGlowWave?: boolean;
  isIndeterminate?: boolean;
  className?: string;
}

export const VARIANT_CONFIGS = {
  dragonfire: {
    name: "Dragonfire Gold",
    barGradient: "from-[#8C6D2D] via-[#D4B26A] to-[#F3EFE6]",
    glowColor: "rgba(212, 178, 106, 0.4)",
    borderColor: "border-[#D4B26A]/40",
    accentBg: "bg-[#D4B26A]/10",
    textColor: "text-[#D4B26A]",
    badgeBg: "bg-[#2A2318]",
    sparkColor: "#D4B26A",
    icon: Flame
  },
  cyber_cyan: {
    name: "Cyber Arcane Cyan",
    barGradient: "from-[#0284C7] via-[#38BDF8] to-[#E0F2FE]",
    glowColor: "rgba(56, 189, 248, 0.4)",
    borderColor: "border-[#38BDF8]/40",
    accentBg: "bg-[#38BDF8]/10",
    textColor: "text-[#38BDF8]",
    badgeBg: "bg-[#0C2333]",
    sparkColor: "#38BDF8",
    icon: Zap
  },
  emerald_guard: {
    name: "Emerald Vanguard",
    barGradient: "from-[#059669] via-[#34D399] to-[#ECFDF5]",
    glowColor: "rgba(52, 211, 153, 0.4)",
    borderColor: "border-[#34D399]/40",
    accentBg: "bg-[#34D399]/10",
    textColor: "text-[#34D399]",
    badgeBg: "bg-[#0B251B]",
    sparkColor: "#34D399",
    icon: Shield
  },
  obsidian_gothic: {
    name: "Obsidian Gothic Silver",
    barGradient: "from-[#475569] via-[#94A3B8] to-[#F8FAFC]",
    glowColor: "rgba(148, 163, 184, 0.4)",
    borderColor: "border-[#94A3B8]/40",
    accentBg: "bg-[#94A3B8]/10",
    textColor: "text-[#CBD5E1]",
    badgeBg: "bg-[#1E293B]",
    sparkColor: "#CBD5E1",
    icon: Cpu
  }
};

export const CustomLoadingBar: React.FC<CustomLoadingBarProps> = ({
  progress,
  statusText,
  subText,
  variant = "dragonfire",
  size = "md",
  showPercent = true,
  showRuneAnimation = true,
  showGlowWave = true,
  isIndeterminate = false,
  className = ""
}) => {
  const cfg = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.dragonfire;
  const IconComponent = cfg.icon;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: "h-2.5",
    md: "h-4",
    lg: "h-6"
  }[size];

  return (
    <div className={`w-full space-y-2 font-mono ${className}`}>
      {/* Top Status & Percentage Row */}
      {(statusText || showPercent) && (
        <div className="flex items-center justify-between text-xs tracking-wider">
          <div className="flex items-center gap-2 truncate">
            {showRuneAnimation && (
              <motion.div
                animate={{ rotate: isIndeterminate ? 360 : 0, scale: [1, 1.15, 1] }}
                transition={{
                  rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                  scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                }}
                className={`p-1 rounded ${cfg.accentBg} ${cfg.textColor} ${cfg.borderColor} border flex items-center justify-center`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </motion.div>
            )}
            {statusText && (
              <span className="font-semibold text-gothic-silver truncate">
                {statusText}
              </span>
            )}
          </div>

          {showPercent && (
            <div className={`font-bold ${cfg.textColor} flex items-center gap-1 font-mono text-xs bg-gothic-void px-2 py-0.5 rounded border ${cfg.borderColor}`}>
              {isIndeterminate ? (
                <span className="animate-pulse">PROCESSING...</span>
              ) : (
                <span>{Math.round(clampedProgress)}%</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Bar Track with Gothic Corners */}
      <div className="relative group">
        {/* Outer Frame with Metallic Border */}
        <div 
          className={`relative w-full ${heightClasses} bg-[#11141A] rounded-md border ${cfg.borderColor} overflow-hidden p-0.5 shadow-inner`}
          style={{
            boxShadow: `0 0 12px ${cfg.glowColor} inset`
          }}
        >
          {/* Background Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "8px 8px"
            }}
          />

          {/* Animated Fill Bar */}
          <motion.div
            className={`h-full rounded-sm bg-gradient-to-r ${cfg.barGradient} relative overflow-hidden`}
            initial={{ width: 0 }}
            animate={{ 
              width: isIndeterminate ? "100%" : `${clampedProgress}%` 
            }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 15
            }}
            style={{
              boxShadow: `0 0 16px ${cfg.glowColor}`
            }}
          >
            {/* Shimmer Light Bar */}
            <motion.div
              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ["-100%", "200%"]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut"
              }}
            />

            {/* Tactical Striped Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 6px, transparent 6px, transparent 12px)"
              }}
            />

            {/* Glowing Leading Edge Wave */}
            {showGlowWave && clampedProgress > 0 && (
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-3 bg-white shadow-[0_0_12px_#ffffff]"
                animate={{
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Decorative Metallic Corner Accents */}
        <div className={`absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 ${cfg.borderColor}`} />
        <div className={`absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 ${cfg.borderColor}`} />
        <div className={`absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 ${cfg.borderColor}`} />
        <div className={`absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 ${cfg.borderColor}`} />
      </div>

      {/* Optional Subtext / Detail Footer */}
      {subText && (
        <div className="flex items-center justify-between text-[10px] text-gothic-rose/60 pt-0.5">
          <span className="truncate">{subText}</span>
          <span className="font-bold uppercase tracking-widest text-gothic-silver/40">Dragon Telemetry</span>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* FULLSCREEN / MODAL OVERLAY CUSTOM LOADER                                  */
/* -------------------------------------------------------------------------- */

export interface CustomLoadingOverlayProps {
  isOpen: boolean;
  progress: number;
  title?: string;
  statusText?: string;
  subText?: string;
  variant?: LoadingVariant;
  steps?: { label: string; completed: boolean; active: boolean }[];
  onCancel?: () => void;
}

export const CustomLoadingOverlay: React.FC<CustomLoadingOverlayProps> = ({
  isOpen,
  progress,
  title = "Alliance Telemetry Processing",
  statusText = "Syncing snapshot records...",
  subText,
  variant = "dragonfire",
  steps,
  onCancel
}) => {
  if (!isOpen) return null;

  const cfg = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.dragonfire;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B0E]/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className={`w-full max-w-lg p-6 bg-[#161A22] border ${cfg.borderColor} rounded-xl shadow-2xl space-y-6 relative overflow-hidden`}
        >
          {/* Header Title */}
          <div className="flex items-center gap-3 border-b border-gothic-silver/20 pb-4">
            <div className={`p-2.5 rounded-lg ${cfg.accentBg} ${cfg.textColor} border ${cfg.borderColor}`}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Flame size={22} />
              </motion.div>
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-gothic-silver tracking-wide">
                {title}
              </h3>
              <p className="text-xs text-gothic-rose/60 font-mono">
                Dragon's Call Telemetry Matrix Engine
              </p>
            </div>
          </div>

          {/* Loading Bar Main Component */}
          <CustomLoadingBar
            progress={progress}
            statusText={statusText}
            subText={subText}
            variant={variant}
            size="lg"
            showPercent={true}
          />

          {/* Optional Steps List */}
          {steps && steps.length > 0 && (
            <div className="space-y-2 bg-[#0E1117] p-3 rounded-lg border border-gothic-silver/20 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-gothic-rose/50 tracking-wider block mb-1">
                Execution Pipeline
              </span>
              <div className="space-y-1.5">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className={step.completed ? "text-emerald-400 font-semibold" : step.active ? cfg.textColor + " font-bold animate-pulse" : "text-gothic-rose/40"}>
                      {idx + 1}. {step.label}
                    </span>
                    {step.completed ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : step.active ? (
                      <RefreshCw size={13} className={`animate-spin ${cfg.textColor}`} />
                    ) : (
                      <span className="text-[10px] text-gothic-rose/30">QUEUED</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel Button if provided */}
          {onCancel && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-1.5 text-xs font-mono font-semibold text-gothic-rose/70 hover:text-gothic-silver bg-gothic-ink hover:bg-gothic-ink/80 rounded border border-gothic-silver/20 transition-all cursor-pointer"
              >
                Cancel Execution
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
