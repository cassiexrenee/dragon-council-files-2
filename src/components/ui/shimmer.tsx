import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gothic-silver/10 rounded ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-2 border-b border-gothic-silver/10">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton key={cIdx} className={`h-4 ${cIdx === 0 ? 'w-1/3' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}