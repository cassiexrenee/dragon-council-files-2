import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 text-xs font-mono text-gothic-rose/70 border-t border-gothic-silver/20">
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-gothic-silver">{startItem}</strong> to <strong className="text-gothic-silver">{endItem}</strong> of <strong className="text-gothic-silver">{totalItems}</strong> entries
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-gothic-ink border border-gothic-silver/20 text-gothic-silver rounded px-2 py-1 outline-none ml-2"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded bg-gothic-ink border border-gothic-silver/20 disabled:opacity-40 hover:border-gothic-silver transition-colors cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded bg-gothic-ink border border-gothic-silver/20 disabled:opacity-40 hover:border-gothic-silver transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="px-3 py-1 bg-gothic-ink border border-gothic-silver/20 text-gothic-silver rounded font-bold">
          {currentPage} / {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded bg-gothic-ink border border-gothic-silver/20 disabled:opacity-40 hover:border-gothic-silver transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded bg-gothic-ink border border-gothic-silver/20 disabled:opacity-40 hover:border-gothic-silver transition-colors cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}