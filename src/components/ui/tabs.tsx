import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion } from 'motion/react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className = '' }: TabsProps) {
  const [selectedTab, setSelectedTab] = useState(defaultValue || '');
  const activeValue = value !== undefined ? value : selectedTab;

  const handleValueChange = (val: string) => {
    if (value === undefined) {
      setSelectedTab(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1.5 p-1 bg-gothic-ink/80 border border-gothic-silver/20 rounded-xl overflow-x-auto max-w-full no-scrollbar ${className}`}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  badge?: string | number;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function TabsTrigger({ value, children, badge, icon, disabled = false, className = '' }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => !disabled && context.onValueChange(value)}
      className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium transition-colors rounded-lg select-none whitespace-nowrap outline-none ${
        disabled
          ? 'opacity-40 cursor-not-allowed text-gothic-rose/40'
          : isSelected
          ? 'text-gothic-silver font-bold'
          : 'text-gothic-rose/70 hover:text-gothic-silver hover:bg-gothic-silver/5'
      } ${className}`}
    >
      {isSelected && (
        <motion.div
          layoutId="active-tab-indicator"
          className="absolute inset-0 bg-gothic-silver/15 border border-gothic-silver/30 rounded-lg shadow-sm"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {children}
        {badge !== undefined && (
          <span
            className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full font-mono ${
              isSelected
                ? 'bg-gothic-silver text-gothic-void'
                : 'bg-gothic-silver/10 text-gothic-silver/80'
            }`}
          >
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      role="tabpanel"
      className={`mt-4 outline-none ${className}`}
    >
      {children}
    </motion.div>
  );
}
