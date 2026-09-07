'use client';

import React, { useMemo } from 'react';
import { Select } from './select';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** When provided together with `pageSize`, renders a "Showing X to Y of Z" summary. */
  totalItems?: number;
  pageSize?: number;
  /** Noun appended to the summary, e.g. "employees". */
  entityLabel?: string;
  /** When provided with `onPageSizeChange`, renders a "N per page" selector. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

/**
 * Shared numbered pager used across all list/table views in the app.
 * Renders nothing when there is only one page and no page-size selector.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  entityLabel = '',
  pageSizeOptions,
  onPageSizeChange,
  className = '',
}: PaginationProps) {
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

  if (totalPages <= 1 && !pageSizeOptions) return null;

  const showSummary = totalItems != null && pageSize != null;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 text-xs text-muted-foreground ${showSummary ? 'justify-between' : 'justify-center'} ${className}`}
    >
      {showSummary && (
        <span>
          Showing {(currentPage - 1) * pageSize! + 1} to {Math.min(currentPage * pageSize!, totalItems!)} of{' '}
          {totalItems}
          {entityLabel ? ` ${entityLabel}` : ''}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {pageSizeOptions && onPageSizeChange && (
          <div className="w-32">
            <Select
              size="sm"
              options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n} per page` }))}
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            />
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Previous page"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {pageNumbers.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
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
            onClick={() => onPageChange(currentPage + 1)}
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
  );
}
