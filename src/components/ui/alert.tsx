import React, { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
  action?: ReactNode;
}

const variantStyles: Record<AlertVariant, { container: string; iconClass: string; defaultIcon: ReactNode }> = {
  default: {
    container: 'bg-gothic-ink/90 border-gothic-silver/30 text-gothic-silver',
    iconClass: 'text-gothic-silver',
    defaultIcon: <Info size={18} />
  },
  info: {
    container: 'bg-[#7FA8C9]/10 border-[#7FA8C9]/40 text-[#A2C4DE]',
    iconClass: 'text-[#7FA8C9]',
    defaultIcon: <Info size={18} />
  },
  success: {
    container: 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300',
    iconClass: 'text-emerald-400',
    defaultIcon: <CheckCircle2 size={18} />
  },
  warning: {
    container: 'bg-amber-950/30 border-amber-500/30 text-amber-300',
    iconClass: 'text-amber-400',
    defaultIcon: <AlertTriangle size={18} />
  },
  destructive: {
    container: 'bg-red-950/30 border-red-500/30 text-red-300',
    iconClass: 'text-red-400',
    defaultIcon: <XCircle size={18} />
  }
};

export function Alert({
  variant = 'default',
  title,
  children,
  icon,
  onClose,
  className = '',
  action
}: AlertProps) {
  const style = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`relative w-full p-4 rounded-xl border flex items-start gap-3 shadow-md backdrop-blur-sm transition-all ${style.container} ${className}`}
    >
      <div className={`mt-0.5 shrink-0 ${style.iconClass}`}>
        {icon !== undefined ? icon : style.defaultIcon}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        {title && <h5 className="font-mono text-xs font-bold tracking-wide uppercase">{title}</h5>}
        <div className="text-xs leading-relaxed font-body opacity-90">{children}</div>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close alert"
          className="shrink-0 p-1 -mr-1 -mt-1 rounded-lg text-gothic-rose/50 hover:text-gothic-silver hover:bg-white/5 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function AlertTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h5 className={`font-mono text-xs font-bold tracking-wide uppercase ${className}`}>{children}</h5>;
}

export function AlertDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-xs leading-relaxed font-body opacity-90 ${className}`}>{children}</div>;
}
