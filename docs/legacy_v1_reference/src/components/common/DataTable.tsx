import React, { useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { clsx } from 'clsx';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedRowId?: string;
  getRowId?: (item: T) => string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  selectedRowId,
  getRowId,
  searchPlaceholder = 'Filter records...',
  emptyMessage = 'No records found.'
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    return Object.values(item).some((val) =>
      String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex flex-col gap-3 w-full">
      {searchPlaceholder && (
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-textMuted pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-bgDeep border border-borderColor rounded-input text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent"
          />
        </div>
      )}

      <div className="overflow-x-auto border border-borderColor rounded-card bg-surface max-h-[500px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-bgDeep sticky top-0 z-10 border-b border-borderColor text-textSecondary font-semibold">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="px-4 py-3 select-none"
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1.5 hover:text-textPrimary cursor-pointer focus:outline-none"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3 h-3 text-textMuted" />
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borderColor/60 text-textSecondary">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-textMuted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, idx) => {
                const rowId = getRowId ? getRowId(item) : String(idx);
                const isSelected = selectedRowId === rowId;
                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={clsx(
                      'transition-colors duration-150',
                      onRowClick && 'cursor-pointer',
                      isSelected
                        ? 'bg-accentTint text-textPrimary font-medium border-l-2 border-l-accent'
                        : 'hover:bg-surfaceElevated'
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render ? col.render(item) : String(item[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
