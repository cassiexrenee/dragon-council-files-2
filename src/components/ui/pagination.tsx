import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = ''
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < safeTotalPages - 2) pages.push('ellipsis');
      pages.push(safeTotalPages);
    }
    return pages;
  };

  const startItem = pageSize && totalItems ? (safeCurrentPage - 1) * pageSize + 1 : undefined;
  const endItem = pageSize && totalItems ? Math.min(safeCurrentPage * pageSize, totalItems) : undefined;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 py-3 text-xs font-mono text-gothic-rose/70 border-t border-gothic-silver/20 ${className}`}>
      {/* Item Range / Status */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="text-gothic-silver">{startItem}</strong>-
            <strong className="text-gothic-silver">{endItem}</strong> of{' '}
            <strong className="text-gothic-silver">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="text-gothic-silver">{safeCurrentPage}</strong> of{' '}
            <strong className="text-gothic-silver">{safeTotalPages}</strong>
          </span>
        )}

        {pageSize !== undefined && onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-gothic-silver/20 pl-3">
            <span className="text-[10px] uppercase font-bold text-gothic-rose/50">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-gothic-ink border border-gothic-silver/20 rounded px-2 py-1 text-xs text-gothic-silver outline-none focus:border-gothic-silver"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          aria-label="First page"
          className="p-1.5 rounded-lg border border-gothic-silver/20 bg-gothic-ink/60 text-gothic-silver hover:bg-gothic-silver/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          aria-label="Previous page"
          className="p-1.5 rounded-lg border border-gothic-silver/20 bg-gothic-ink/60 text-gothic-silver hover:bg-gothic-silver/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gothic-rose/40">
              <MoreHorizontal size={14} />
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`min-w-[28px] h-[28px] px-2 rounded-lg border text-xs font-mono font-bold transition-colors ${
                safeCurrentPage === page
                  ? 'bg-gothic-silver text-gothic-void border-gothic-silver shadow-sm'
                  : 'bg-gothic-ink/60 text-gothic-silver border-gothic-silver/20 hover:bg-gothic-silver/10'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
          aria-label="Next page"
          className="p-1.5 rounded-lg border border-gothic-silver/20 bg-gothic-ink/60 text-gothic-silver hover:bg-gothic-silver/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage === safeTotalPages}
          aria-label="Last page"
          className="p-1.5 rounded-lg border border-gothic-silver/20 bg-gothic-ink/60 text-gothic-silver hover:bg-gothic-silver/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
