import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, RefreshCw, Play, Pause, Flame, Layers, Shield, Zap, Cpu } from "lucide-react";
import { 
  CustomLoadingBar, 
  CustomLoadingOverlay, 
  LoadingVariant, 
  VARIANT_CONFIGS 
} from "./CustomLoadingBar";

interface CustomLoadingShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomLoadingShowcaseModal: React.FC<CustomLoadingShowcaseModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedVariant, setSelectedVariant] = useState<LoadingVariant>("dragonfire");
  const [progress, setProgress] = useState<number>(65);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isIndeterminate, setIsIndeterminate] = useState<boolean>(false);
  const [barSize, setBarSize] = useState<"sm" | "md" | "lg">("md");
  const [showOverlayDemo, setShowOverlayDemo] = useState<boolean>(false);

  // Auto increment simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSimulating) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsSimulating(false);
            return 100;
          }
          return prev + 1;
        });
      }, 80);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating]);

  if (!isOpen) return null;

  const currentCfg = VARIANT_CONFIGS[selectedVariant];

  const sampleSteps = [
    { label: "Validating Telemetry Signatures", completed: progress >= 25, active: progress > 0 && progress < 25 },
    { label: "Reconstructing Roster Member Snapshots", completed: progress >= 60, active: progress >= 25 && progress < 60 },
    { label: "Writing Persistent DB Transactions", completed: progress >= 90, active: progress >= 60 && progress < 90 },
    { label: "Finalizing Synchronization Pipeline", completed: progress >= 100, active: progress >= 90 && progress < 100 }
  ];

  return (
    <AnimatePresence>
      <div id="loading-showcase-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          id="loading-showcase-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-[#12161F] border border-gothic-silver/20 rounded-xl shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gothic-silver/15 bg-[#181D28]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gothic-gold/10 border border-gothic-gold/30 text-gothic-gold">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-gothic-silver tracking-wide">
                  Custom Loading Bar Showcase
                </h2>
                <p className="text-xs text-gothic-rose/50 font-mono">
                  Dragon Council UI Telemetry Component Sandbox
                </p>
              </div>
            </div>
            <button
              id="loading-showcase-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gothic-rose/60 hover:text-gothic-silver hover:bg-gothic-silver/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Live Interactive Preview Card */}
            <div className="p-5 bg-[#0B0D13] border border-gothic-silver/20 rounded-lg space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gothic-rose/60 flex items-center gap-2">
                  <Layers size={14} className="text-gothic-gold" /> Live Preview ({currentCfg.name})
                </span>
                <span className="text-[11px] text-gothic-rose/40 font-mono">
                  Size: {barSize.toUpperCase()} | Progress: {progress}%
                </span>
              </div>

              <CustomLoadingBar
                progress={progress}
                statusText="Synchronizing Dragon Council State Matrix..."
                subText="Connected to SQLite backend persistence engine"
                variant={selectedVariant}
                size={barSize}
                isIndeterminate={isIndeterminate}
                showPercent={true}
              />
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Variant Picker */}
              <div className="p-4 bg-[#181D28] border border-gothic-silver/15 rounded-lg space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gothic-rose/60 block">
                  Theme Variant
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(VARIANT_CONFIGS) as LoadingVariant[]).map((varKey) => {
                    const cfg = VARIANT_CONFIGS[varKey];
                    const isSelected = selectedVariant === varKey;
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={varKey}
                        type="button"
                        onClick={() => setSelectedVariant(varKey)}
                        className={`flex items-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-all text-left ${
                          isSelected
                            ? `${cfg.badgeBg} ${cfg.borderColor} ${cfg.textColor} shadow-md`
                            : "bg-[#11141C] border-gothic-silver/10 text-gothic-rose/60 hover:border-gothic-silver/30"
                        }`}
                      >
                        <Icon size={14} />
                        <span className="truncate">{cfg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size & State Toggles */}
              <div className="p-4 bg-[#181D28] border border-gothic-silver/15 rounded-lg space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gothic-rose/60 block">
                  Configuration & Mode
                </label>
                
                {/* Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gothic-rose/60">Size:</span>
                  {(["sm", "md", "lg"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setBarSize(sz)}
                      className={`px-3 py-1 rounded text-xs uppercase font-semibold border transition-colors ${
                        barSize === sz
                          ? "bg-gothic-gold/20 border-gothic-gold/50 text-gothic-gold"
                          : "bg-[#11141C] border-gothic-silver/10 text-gothic-rose/50 hover:text-gothic-silver"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Indeterminate Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gothic-rose/60">Indeterminate Animation:</span>
                  <button
                    type="button"
                    onClick={() => setIsIndeterminate(!isIndeterminate)}
                    className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                      isIndeterminate
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                        : "bg-[#11141C] border-gothic-silver/10 text-gothic-rose/50"
                    }`}
                  >
                    {isIndeterminate ? "ACTIVE" : "OFF"}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Slider & Simulation Actions */}
            <div className="p-4 bg-[#181D28] border border-gothic-silver/15 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gothic-rose/60">
                  Manual Progress Slider
                </label>
                <span className="text-xs font-bold text-gothic-silver">{progress}%</span>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#D4B26A] cursor-pointer bg-[#0D1017] rounded-lg h-2"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gothic-silver/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                      isSimulating
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                    }`}
                  >
                    {isSimulating ? <Pause size={13} /> : <Play size={13} />}
                    {isSimulating ? "Pause Loading" : "Simulate Loading"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProgress(0);
                      setIsSimulating(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#11141C] hover:bg-gothic-silver/10 border border-gothic-silver/20 rounded text-xs text-gothic-silver transition-colors"
                  >
                    <RefreshCw size={13} /> Restart
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOverlayDemo(true)}
                  className="px-3 py-1.5 bg-gothic-gold/10 hover:bg-gothic-gold/20 border border-gothic-gold/30 text-gothic-gold text-xs font-semibold rounded transition-colors"
                >
                  Test Fullscreen Overlay Mode
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gothic-silver/15 bg-[#181D28] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-gothic-silver/10 hover:bg-gothic-silver/20 border border-gothic-silver/30 text-gothic-silver text-xs font-semibold rounded transition-colors"
            >
              Close Showcase
            </button>
          </div>
        </motion.div>

        {/* Fullscreen Overlay Test Modal */}
        {showOverlayDemo && (
          <CustomLoadingOverlay
            isOpen={showOverlayDemo}
            progress={progress}
            title="Full Overlay Mode Test"
            statusText="Simulating full-screen overlay experience..."
            subText="Demonstrating execution pipeline steps"
            variant={selectedVariant}
            steps={sampleSteps}
            onCancel={() => setShowOverlayDemo(false)}
          />
        )}
      </div>
    </AnimatePresence>
  );
};
