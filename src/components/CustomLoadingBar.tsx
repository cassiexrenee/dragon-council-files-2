import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, CheckCircle2 } from "lucide-react";

interface LoadingStep {
  label: string;
  completed: boolean;
  active: boolean;
}

interface CustomLoadingOverlayProps {
  isOpen: boolean;
  progress: number; // 0 to 100
  title?: string;
  statusText?: string;
  subText?: string;
  variant?: "dragonfire" | "standard";
  steps?: LoadingStep[];
}

export function CustomLoadingBar({ progress, variant = "dragonfire" }: { progress: number; variant?: string }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-gothic-ink rounded-full overflow-hidden p-0.5 border border-gothic-silver/20 relative">
      <motion.div
        className={`h-2 rounded-full ${
          variant === "dragonfire"
            ? "bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(212,178,106,0.6)]"
            : "bg-gothic-silver"
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${clampedProgress}%` }}
        transition={{ ease: "easeInOut", duration: 0.3 }}
      />
    </div>
  );
}

export function CustomLoadingOverlay({
  isOpen,
  progress,
  title = "Processing Transaction",
  statusText = "Please wait while council operations execute...",
  subText,
  variant = "dragonfire",
  steps = []
}: CustomLoadingOverlayProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          className="bg-gothic-velvet border border-gothic-silver/30 rounded-2xl max-w-md w-full p-8 space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3.5 border-b border-gothic-silver/20 pb-4">
            <div className="p-3 rounded-xl bg-gothic-ink border border-gothic-silver/30 text-amber-400 shadow-inner">
              <Shield size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gothic-silver font-display uppercase tracking-wider">{title}</h3>
              <p className="text-xs text-gothic-rose/70 font-mono mt-0.5">{subText || "Dragon Council Ledger Synchronizer"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gothic-rose/90 animate-pulse">{statusText}</span>
              <span className="font-bold text-amber-300">{Math.round(progress)}%</span>
            </div>

            <CustomLoadingBar progress={progress} variant={variant} />
          </div>

          {steps.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gothic-silver/10">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-mono">
                  {step.completed ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : step.active ? (
                    <Sparkles size={14} className="text-amber-400 shrink-0 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-gothic-silver/30 shrink-0" />
                  )}
                  <span className={step.completed ? "text-gothic-silver line-through opacity-75" : step.active ? "text-amber-300 font-bold" : "text-gothic-rose/50"}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}