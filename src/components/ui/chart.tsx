import React, { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

export interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  height?: number | string;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  action,
  children,
  height = 240,
  className = ''
}: ChartContainerProps) {
  return (
    <div className={`p-5 rounded-xl bg-gothic-ink/90 border border-gothic-silver/20 shadow-xl space-y-3 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between border-b border-gothic-silver/10 pb-3">
          <div>
            {title && <h4 className="font-display text-sm font-bold text-gothic-silver">{title}</h4>}
            {subtitle && <p className="font-mono text-[11px] text-gothic-rose/50 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="p-3 rounded-xl bg-gothic-void/95 border border-gothic-silver/30 shadow-2xl backdrop-blur-md space-y-1.5 font-mono text-xs">
      {label && <p className="font-bold text-gothic-silver border-b border-gothic-silver/20 pb-1">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-gothic-rose/80">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-bold text-gothic-silver">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
