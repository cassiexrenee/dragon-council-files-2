import React, { useState, useMemo, ReactNode } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  Check,
  ChevronDown,
  X
} from 'lucide-react';
import { Pagination } from './pagination';
import { Skeleton, TableSkeleton } from './shimmer';

export interface Column<T> {
  id: string;
  header: string | ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchColumnKey?: keyof T | ((row: T) => string);
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  pageSize?: number;
  emptyState?: ReactNode;
  className?: string;
  title?: ReactNode;
  actions?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Search table records...',
  searchColumnKey,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  pageSize: initialPageSize = 10,
  emptyState,
  className = '',
  title,
  actions
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((c) => c.id));
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [density, setDensity] = useState<'compact' | 'normal' | 'relaxed'>('normal');

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();

    return data.filter((row) => {
      if (typeof searchColumnKey === 'function') {
        return searchColumnKey(row).toLowerCase().includes(term);
      }
      if (searchColumnKey) {
        const val = row[searchColumnKey];
        return String(val ?? '').toLowerCase().includes(term);
      }
      // Search all keys
      return Object.values(row as any).some((val) =>
        String(val ?? '').toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchColumnKey]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    const col = columns.find((c) => c.id === sortColumn);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal: any = col.accessorKey ? a[col.accessorKey] : (a as any)[col.id];
      let bVal: any = col.accessorKey ? b[col.accessorKey] : (b as any)[col.id];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Paginated data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection state
  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.includes(keyExtractor(row)));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      const pageKeys = new Set(paginatedData.map(keyExtractor));
      onSelectionChange(selectedIds.filter((id) => !pageKeys.has(id)));
    } else {
      const newSelected = new Set([...selectedIds, ...paginatedData.map(keyExtractor)]);
      onSelectionChange(Array.from(newSelected));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortColumn(null);
    } else {
      setSortColumn(colId);
      setSortDirection('asc');
    }
  };

  const activeColumns = columns.filter((c) => visibleColumns.includes(c.id));

  const densityPadding = {
    compact: 'py-1.5 px-3',
    normal: 'py-2.5 px-4',
    relaxed: 'py-3.5 px-5'
  }[density];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header bar: Search, Column Toggle, Custom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title && <div className="text-sm font-bold font-display text-gothic-silver">{title}</div>}

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {searchable && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gothic-rose/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="bg-gothic-ink border border-gothic-silver/20 rounded-xl pl-9 pr-8 py-1.5 text-xs font-mono text-gothic-silver placeholder:text-gothic-rose/40 outline-none focus:border-gothic-silver transition-colors w-60"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gothic-rose/50 hover:text-gothic-silver"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Density Selector */}
          <div className="flex items-center p-0.5 bg-gothic-ink border border-gothic-silver/20 rounded-lg text-[10px] font-mono">
            {(['compact', 'normal', 'relaxed'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                className={`px-2 py-1 rounded-md capitalize font-bold transition-colors ${
                  density === d ? 'bg-gothic-silver/20 text-gothic-silver' : 'text-gothic-rose/50 hover:text-gothic-silver'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Columns Visibility Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gothic-ink border border-gothic-silver/20 text-xs font-mono text-gothic-silver hover:border-gothic-silver/40 transition-colors"
            >
              <SlidersHorizontal size={14} />
              <span>Columns</span>
              <ChevronDown size={12} />
            </button>

            {showColumnToggle && (
              <div className="absolute right-0 z-50 mt-2 w-48 p-2 rounded-xl bg-gothic-void border border-gothic-silver/30 shadow-2xl backdrop-blur-md space-y-1">
                <div className="text-[10px] font-mono font-bold text-gothic-rose/50 uppercase px-2 py-1 border-b border-gothic-silver/10">
                  Toggle Columns
                </div>
                {columns.map((col) => {
                  const isVisible = visibleColumns.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        if (isVisible && visibleColumns.length > 1) {
                          setVisibleColumns(visibleColumns.filter((id) => id !== col.id));
                        } else if (!isVisible) {
                          setVisibleColumns([...visibleColumns, col.id]);
                        }
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono text-gothic-silver hover:bg-gothic-silver/10 transition-colors"
                    >
                      <span>{typeof col.header === 'string' ? col.header : col.id}</span>
                      {isVisible && <Check size={14} className="text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-gothic-silver/20 bg-gothic-ink/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="bg-gothic-void/90 border-b border-gothic-silver/20 text-gothic-rose/70 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                {selectable && (
                  <th className={`${densityPadding} w-10 text-center`}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-gothic-silver/30 bg-gothic-ink text-gothic-silver focus:ring-0"
                    />
                  </th>
                )}
                {activeColumns.map((col) => (
                  <th
                    key={col.id}
                    style={{ width: col.width }}
                    className={`${densityPadding} ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.id)}
                        className="inline-flex items-center gap-1 hover:text-gothic-silver transition-colors"
                      >
                        <span>{col.header}</span>
                        {sortColumn === col.id ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={12} className="text-gothic-silver" />
                          ) : (
                            <ArrowDown size={12} className="text-gothic-silver" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gothic-silver/10 text-gothic-silver">
              {isLoading ? (
                <tr>
                  <td colSpan={activeColumns.length + (selectable ? 1 : 0)} className="p-6">
                    <TableSkeleton rows={5} cols={activeColumns.length} />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + (selectable ? 1 : 0)} className="p-8 text-center">
                    {emptyState || (
                      <div className="space-y-1 text-gothic-rose/50 font-mono">
                        <p className="text-xs font-bold">No records found matching query</p>
                        <p className="text-[10px]">Try adjusting search filter or telemetry parameters.</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const key = keyExtractor(row);
                  const isSelected = selectedIds.includes(key);

                  return (
                    <tr
                      key={key}
                      className={`transition-colors hover:bg-gothic-silver/5 ${
                        isSelected ? 'bg-gothic-silver/10' : ''
                      }`}
                    >
                      {selectable && (
                        <td className={`${densityPadding} text-center`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(key)}
                            className="rounded border-gothic-silver/30 bg-gothic-ink text-gothic-silver focus:ring-0"
                          />
                        </td>
                      )}
                      {activeColumns.map((col) => {
                        const val = col.cell
                          ? col.cell(row, index)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? '')
                          : String((row as any)[col.id] ?? '');

                        return (
                          <td
                            key={col.id}
                            className={`${densityPadding} ${
                              col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && sortedData.length > 0 && (
          <div className="px-4 bg-gothic-void/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalItems={sortedData.length}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
