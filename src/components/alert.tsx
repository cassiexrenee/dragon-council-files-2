import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300',
          icon: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/20 border-amber-500/30 text-amber-300',
          icon: <AlertTriangle size={16} className="text-amber-400 shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-red-950/20 border-red-500/30 text-red-300',
          icon: <AlertCircle size={16} className="text-red-400 shrink-0" />
        };
      default:
        return {
          bg: 'bg-gothic-ink border-gothic-silver/20 text-gothic-silver',
          icon: <Info size={16} className="text-[#89A6B8] shrink-0" />
        };
    }
  };

  const style = getStyles();

  return (
    <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 font-mono text-xs shadow-md ${style.bg}`}>
      <div className="flex items-start gap-2.5">
        {style.icon}
        <div className="space-y-0.5">
          {title && <h5 className="font-bold uppercase tracking-wider">{title}</h5>}
          <div className="opacity-90">{children}</div>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 cursor-pointer p-0.5">
          ✕
        </button>
      )}
    </div>
  );
}