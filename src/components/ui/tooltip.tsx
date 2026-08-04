import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  shortcut?: string;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 200,
  shortcut,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    setTimer(timeout);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setIsVisible(false);
  };

  const sideStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            role="tooltip"
            className={`absolute z-50 pointer-events-none px-2.5 py-1.5 rounded-lg bg-gothic-void border border-gothic-silver/30 text-gothic-silver text-[11px] font-mono shadow-xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap ${sideStyles[side]} ${className}`}
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1 py-0.5 text-[9px] font-mono font-bold bg-gothic-silver/15 border border-gothic-silver/20 rounded text-gothic-rose/70">
                {shortcut}
              </kbd>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
