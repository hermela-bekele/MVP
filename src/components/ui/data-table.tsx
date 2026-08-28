'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { EmptyState } from './empty-state';
import { Select } from './select';

/* ───────────── Types ───────────── */

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  /** When provided, renders a "N per page" selector and lets the viewer change page size. */
  pageSizeOptions?: number[];
  /** Noun appended to the "Showing X to Y of Z" count, e.g. "employees". */
  entityLabel?: string;
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onExport?: () => void;
  className?: string;
}

type SortDir = 'asc' | 'desc' | null;

/* ───────────── Helpers ───────────── */

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
}

/* ───────────── Sort icon ───────────── */

const SortIcon: React.FC<{ dir: SortDir }> = ({ dir }) => (
  <span className="inline-flex ml-1 text-muted-foreground/60">
    {dir === 'asc' && (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    )}
    {dir === 'desc' && (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    )}
    {dir === null && (
      <svg className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )}
  </span>
);

/* ───────────── Skeleton rows ───────────── */

const SkeletonRows: React.FC<{ cols: number; rows?: number }> = ({ cols, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <tr key={rIdx} className="border-b border-border/30">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <td key={cIdx} className="px-4 py-3">
            <div className="h-4 rounded bg-muted shimmer" style={{ width: `${60 + Math.random() * 30}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/* ───────────── Component ───────────── */

export function DataTable<T extends object>({
  columns,
  data,
  searchable = false,
  searchKeys,
  pageSize = 10,
  pageSizeOptions,
  entityLabel = '',
  loading = false,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no records to display.',
  emptyAction,
  onExport,
  className = '',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const effectivePageSize = pageSizeOptions ? pageSizeState : pageSize;

  /* ── Search ── */
  const keys = searchKeys ?? columns.map((c) => c.key);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      keys.some((k) => {
        const val = getNestedValue(row, k);
        return val != null && String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, search, keys]);

  /* ── Sort ── */
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getNestedValue(a, sortKey);
      const bv = getNestedValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / effectivePageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === 'asc') setSortDir('desc');
        else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
        else setSortDir('asc');
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setPage(1);
    },
    [sortKey, sortDir],
  );

  /* ── Page numbers helper ── */
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  /* ── Render cell value ── */
  const renderCell = (row: T, col: DataTableColumn<T>, index: number) => {
    if (col.render) return col.render(row, index);
    const val = getNestedValue(row, col.key);
    return val != null ? String(val) : '—';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Toolbar */}
      {(searchable || onExport) && (
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {searchable && (
            <div className="relative max-w-xs w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…"
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              />
            </div>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Export
            </button>
          )}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`group px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.sortable !== false ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable !== false && <SortIcon dir={sortKey === col.key ? sortDir : null} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={columns.length} rows={effectivePageSize} />}

            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="py-12"
                  />
                </td>
              </tr>
            )}

            {!loading &&
              paged.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-border/30 last:border-b-0 transition-colors duration-100 hover:bg-muted/30"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-foreground/90">
                      {renderCell(row, col, (currentPage - 1) * effectivePageSize + rIdx)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{col.header}</span>
                  <div className="h-4 w-20 rounded bg-muted shimmer" />
                </div>
              ))}
            </div>
          ))}

        {!loading && paged.length === 0 && (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )}

        {!loading &&
          paged.map((row, rIdx) => (
            <div
              key={rIdx}
              className="rounded-lg border border-border bg-card p-4 space-y-2 transition-shadow duration-200 hover:shadow-sm"
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{col.header}</span>
                  <span className="text-sm text-foreground text-right">
                    {renderCell(row, col, (currentPage - 1) * pageSize + rIdx)}
                  </span>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Pagination */}
      {!loading && sorted.length > 0 && (sorted.length > effectivePageSize || !!pageSizeOptions) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * effectivePageSize + 1} to {Math.min(currentPage * effectivePageSize, sorted.length)} of{' '}
            {sorted.length}
            {entityLabel ? ` ${entityLabel}` : ''}
          </span>

          <div className="flex flex-wrap items-center gap-3">
          {pageSizeOptions && (
            <div className="w-32">
              <Select
                size="sm"
                options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n} per page` }))}
                value={String(pageSizeState)}
                onChange={(e) => {
                  setPageSizeState(Number(e.target.value));
                  setPage(1);
                }}
              />
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Previous page"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-1">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    p === currentPage
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Next page"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
