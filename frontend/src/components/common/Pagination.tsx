import React from 'react';
import { AppIcon } from './Icon';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
  disabled = false,
}) => {
  if (totalCount <= 0 && totalPages <= 1) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Compute page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Number of pages before and after current page

    for (let i = 1; i <= safeTotalPages; i++) {
      if (
        i === 1 ||
        i === safeTotalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-surface-card border border-surface-border rounded-btn text-xs text-text-muted ${className}`}
    >
      {/* Left side: Record range info and page size selector */}
      <div className="flex items-center gap-3">
        <span>
          Hiển thị{' '}
          <strong className="text-text-main font-semibold">
            {startItem.toLocaleString('vi-VN')} - {endItem.toLocaleString('vi-VN')}
          </strong>{' '}
          trên tổng số{' '}
          <strong className="text-brand-secondary font-semibold">
            {totalCount.toLocaleString('vi-VN')}
          </strong>{' '}
          kết quả
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-surface-border pl-3">
            <span className="text-text-subtle">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="bg-surface-elevated text-text-main border border-surface-border rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-primary"
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

      {/* Right side: Navigation buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={disabled || currentPage <= 1}
          className="p-1.5 rounded hover:bg-surface-elevated text-text-muted hover:text-text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang đầu"
        >
          <AppIcon name="chevronLeft" size={14} className="stroke-[2.5]" />
          <span className="sr-only">Trang đầu</span>
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-surface-elevated/60 hover:bg-surface-elevated text-text-muted hover:text-text-main border border-surface-border/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang trước"
        >
          <AppIcon name="chevronLeft" size={13} />
          <span className="hidden md:inline">Trước</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-text-subtle select-none">
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={disabled}
                className={`min-w-[28px] h-7 px-2 rounded font-medium transition-all ${
                  isActive
                    ? 'bg-brand-primary text-white font-bold shadow-sm'
                    : 'bg-surface-elevated/40 hover:bg-surface-elevated text-text-muted hover:text-text-main border border-surface-border/50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= safeTotalPages}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-surface-elevated/60 hover:bg-surface-elevated text-text-muted hover:text-text-main border border-surface-border/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang sau"
        >
          <span className="hidden md:inline">Sau</span>
          <AppIcon name="chevronRight" size={13} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={disabled || currentPage >= safeTotalPages}
          className="p-1.5 rounded hover:bg-surface-elevated text-text-muted hover:text-text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Trang cuối"
        >
          <AppIcon name="chevronRight" size={14} className="stroke-[2.5]" />
          <span className="sr-only">Trang cuối</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
