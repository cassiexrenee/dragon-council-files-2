import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

export function ChartContainer({ children, height = 300, className = '' }: ChartContainerProps) {
  return (
    <div className={`w-full bg-gothic-ink/40 border border-gothic-silver/20 rounded-xl p-4 shadow-inner ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as any}
      </ResponsiveContainer>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
}

export function ChartTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-gothic-velvet border border-gothic-silver/30 p-3 rounded-lg shadow-2xl font-mono text-xs space-y-1">
      {label && <p className="font-bold text-gothic-silver border-b border-gothic-silver/20 pb-1 mb-1">{label}</p>}
      {payload.map((item, idx) => {
        const [val, name] = formatter ? formatter(item.value, item.name) : [item.value, item.name];
        return (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-gothic-rose/70">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              {name}:
            </span>
            <span className="font-bold text-gothic-silver">{typeof val === 'number' ? val.toLocaleString() : val}</span>
          </div>
        );
      })}
    </div>
  );
}