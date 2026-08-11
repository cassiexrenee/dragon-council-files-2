import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Sparkles, X, Shield } from "lucide-react";
import { CustomLoadingOverlay } from "./CustomLoadingBar";

interface ShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomLoadingShowcaseModal({ isOpen, onClose }: ShowcaseModalProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const startSimulation = () => {
    setIsSimulating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsSimulating(false), 600);
          return 100;
        }
        return prev + 20;
      });
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gothic-velvet border border-gothic-silver/30 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative"
      >
        <div className="flex items-center justify-between border-b border-gothic-silver/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gothic-ink border border-gothic-silver/30 text-amber-400">
              <Sparkles size={18} />
            </div>
            <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">
              Loading Overlay Showcase & Test Bench
            </h3>
          </div>
          <button onClick={onClose} className="text-gothic-rose/50 hover:text-gothic-silver cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gothic-rose/80 font-mono leading-relaxed">
          Test the transactional execution loader variants with mock step sequencing and animated dragonfire progress bars.
        </p>

        <div className="p-4 rounded-xl bg-gothic-void border border-gothic-silver/20 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gothic-silver block font-mono">Simulate Async Commit</span>
            <span className="text-[10px] text-gothic-rose/60 font-mono block">Tests multi-step state progress transitions</span>
          </div>
          <button
            onClick={startSimulation}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#16181D] font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Play size={13} /> Run Simulation
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-gothic-silver/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gothic-ink hover:bg-gothic-void text-gothic-rose/70 rounded-lg text-xs font-mono cursor-pointer"
          >
            Close Showcase
          </button>
        </div>
      </motion.div>

      <CustomLoadingOverlay
        isOpen={isSimulating}
        progress={progress}
        title="Simulating Council Operation"
        statusText="Executing test ledger transactions..."
        subText="Dragon Council Diagnostics"
        variant="dragonfire"
        steps={[
          { label: "Initialize Test Environment", completed: progress > 25, active: progress <= 25 },
          { label: "Dispatch Asynchronous Payloads", completed: progress > 60, active: progress > 25 && progress <= 60 },
          { label: "Verify State Synchronization", completed: progress >= 100, active: progress > 60 && progress < 100 }
        ]}
      />
    </div>
  );
}