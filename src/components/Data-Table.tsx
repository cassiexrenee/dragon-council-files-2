import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Pagination } from './ui/Pagination';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T | string;
  searchPlaceholder?: string;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search records...",
  pageSizeOptions = [10, 25, 50],
  initialPageSize = 10,
  emptyMessage = "No records found.",
  onRowClick
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Filter rows based on search input
  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || !searchKey) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      const val = row[searchKey as string];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(term);
    });
  }, [data, searchTerm, searchKey]);

  // Sort rows if sorting is active
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [filteredData, sortField, sortAsc]);

  // Paginate sorted data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-gothic-velvet border border-gothic-silver/20 rounded-xl overflow-hidden shadow-2xl space-y-4 p-4">
      {searchKey && (
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gothic-rose/50" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-silver pl-9 pr-3 py-2 rounded-lg outline-none focus:border-gothic-silver font-mono transition-all"
          />
        </div>
      )}

      <div className="overflow-x-auto border border-gothic-silver/20 rounded-lg bg-gothic-void">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gothic-silver/20 bg-gothic-velvet text-[10px] font-mono font-bold uppercase text-gothic-rose/50 tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.key as string, col.sortable)}
                  className={`py-3 px-4 ${col.sortable ? 'cursor-pointer hover:text-gothic-silver' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gothic-silver/10 text-xs font-mono">
            {paginatedData.map((row, rIdx) => (
              <tr
                key={row.id || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gothic-ink/60' : 'hover:bg-gothic-ink/30'}`}
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="py-3 px-4 text-gothic-rose/90">
                    {col.render ? col.render(row) : row[col.key as string]}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gothic-rose/50">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalItems={sortedData.length}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}