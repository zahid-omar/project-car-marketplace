'use client';

import { useState, useEffect, useRef } from 'react';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

interface AdvancedPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  loading?: boolean;
  showItemsPerPage?: boolean;
  showJumpToPage?: boolean;
  showResultSummary?: boolean;
  itemsPerPageOptions?: number[];
  maxVisiblePages?: number;
  className?: string;
}

export default function AdvancedPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  loading = false,
  showItemsPerPage = true,
  showJumpToPage = true,
  showResultSummary = true,
  itemsPerPageOptions = [12, 24, 48, 96],
  maxVisiblePages = 7,
  className = ''
}: AdvancedPaginationProps) {
  const [jumpToPageValue, setJumpToPageValue] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);
  const [previousPage, setPreviousPage] = useState(currentPage);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce page changes to screen readers
  useEffect(() => {
    if (currentPage !== previousPage && announcementRef.current) {
      const startItem = (currentPage - 1) * itemsPerPage + 1;
      const endItem = Math.min(currentPage * itemsPerPage, totalItems);
      const announcement = `Page ${currentPage} of ${totalPages}. Showing items ${startItem} to ${endItem} of ${totalItems} total results.`;
      
      announcementRef.current.textContent = announcement;
      setPreviousPage(currentPage);
      
      // Clear announcement after brief delay
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, [currentPage, previousPage, totalPages, itemsPerPage, totalItems]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;
      
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      let handled = false;
      switch (e.key) {
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + Left = First page
            if (currentPage > 1) {
              onPageChange(1);
              handled = true;
            }
          } else if (currentPage > 1) {
            // Left = Previous page
            onPageChange(currentPage - 1);
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + Right = Last page
            if (currentPage < totalPages) {
              onPageChange(totalPages);
              handled = true;
            }
          } else if (currentPage < totalPages) {
            // Right = Next page
            onPageChange(currentPage + 1);
            handled = true;
          }
          break;
        case 'Home':
          if (currentPage > 1) {
            onPageChange(1);
            handled = true;
          }
          break;
        case 'End':
          if (currentPage < totalPages) {
            onPageChange(totalPages);
            handled = true;
          }
          break;
        case 'g':
        case 'G':
          if (showJumpToPage) {
            setShowJumpInput(true);
            handled = true;
          }
          break;
      }

      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange, loading, showJumpToPage]);

  // Generate page numbers to display
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }
    
    // Add visible page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPageValue);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    }
    setJumpToPageValue('');
    setShowJumpInput(false);
  };

  const handleJumpInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    } else if (e.key === 'Escape') {
      setJumpToPageValue('');
      setShowJumpInput(false);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const visiblePages = getVisiblePages();

  // Generate comprehensive description for screen readers
  const getPaginationDescription = () => {
    return `Pagination navigation. Currently on page ${currentPage} of ${totalPages}. Showing ${startItem} to ${endItem} of ${totalItems} total results.`;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className={`bg-md-sys-surface border-t border-md-sys-outline-variant ${className}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Result Summary */}
          {showResultSummary && (
            <div className="flex-1 flex justify-between sm:justify-start">
              <div 
                className="text-md-body-medium text-md-sys-on-surface-variant"
                role="status"
                aria-label={`Showing ${startItem} to ${endItem} of ${totalItems} results`}
              >
                Showing <span className="font-medium text-md-sys-on-surface">{startItem.toLocaleString()}</span> to{' '}
                <span className="font-medium text-md-sys-on-surface">{endItem.toLocaleString()}</span> of{' '}
                <span className="font-medium text-md-sys-on-surface">{totalItems.toLocaleString()}</span> results
              </div>
            </div>
          )}

          {/* Items Per Page */}
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="items-per-page" className="text-md-body-medium text-md-sys-on-surface-variant">
                Show:
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                className="border border-md-sys-outline rounded-md text-md-body-medium px-2 py-1 bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:border-md-sys-primary transition-colors duration-md-short2"
                disabled={loading}
                aria-label={`Items per page. Currently showing ${itemsPerPage} items per page`}
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="text-md-body-medium text-md-sys-on-surface-variant" aria-hidden="true">per page</span>
            </div>
          )}

          {/* Main Pagination Controls */}
          <nav 
            role="navigation" 
            aria-label="Pagination Navigation"
            aria-describedby="pagination-description"
          >
            {/* Hidden description for screen readers */}
            <div id="pagination-description" className="sr-only">
              {getPaginationDescription()}
            </div>

            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1 || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-md-sys-outline bg-md-sys-surface text-md-body-medium font-medium text-md-sys-on-surface-variant hover:bg-md-sys-surface-container-high hover:text-md-sys-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
                aria-label="Go to first page"
                title="First page (Home)"
              >
                <MaterialYouIcon name="chevron-left" size="sm" aria-hidden={true} />
                <MaterialYouIcon name="chevron-left" size="sm" aria-hidden={true} className="-ml-1" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="relative inline-flex items-center px-2 py-2 border border-md-sys-outline bg-md-sys-surface text-md-body-medium font-medium text-md-sys-on-surface-variant hover:bg-md-sys-surface-container-high hover:text-md-sys-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
                aria-label="Go to previous page"
                title="Previous page (←)"
              >
                <MaterialYouIcon name="chevron-left" size="sm" aria-hidden={true} />
              </button>

              {/* Page Numbers */}
              <div className="hidden sm:flex" role="group" aria-label="Page numbers">
                {visiblePages.map((page, index) => (
                  page === '...' ? (
                    <span
                      key={index}
                      className="relative inline-flex items-center px-4 py-2 border border-md-sys-outline bg-md-sys-surface text-md-body-medium font-medium text-md-sys-on-surface-variant"
                      aria-hidden="true"
                      role="presentation"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => onPageChange(page as number)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 border text-md-body-medium font-medium transition-all duration-md-short2 ease-md-standard focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 ${
                        page === currentPage
                          ? 'z-10 bg-md-sys-primary border-md-sys-primary text-md-sys-on-primary'
                          : 'bg-md-sys-surface border-md-sys-outline text-md-sys-on-surface-variant hover:bg-md-sys-surface-container-high hover:text-md-sys-on-surface'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      aria-label={page === currentPage ? `Current page, page ${page}` : `Go to page ${page}`}
                      aria-current={page === currentPage ? 'page' : undefined}
                      title={`Page ${page}`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              {/* Mobile Current Page Display */}
              <div 
                className="sm:hidden flex items-center px-4 py-2 border border-md-sys-outline bg-md-sys-surface text-md-body-medium font-medium text-md-sys-on-surface-variant"
                role="status"
                aria-label={`Page ${currentPage} of ${totalPages}`}
              >
                {currentPage} / {totalPages}
              </div>

              {/* Next Page */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="relative inline-flex items-center px-2 py-2 border border-md-sys-outline bg-md-sys-surface text-md-body-medium font-medium text-md-sys-on-surface-variant hover:bg-md-sys-surface-container-high hover:text-md-sys-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
                aria-label="Go to next page"
                title="Next page (→)"
              >
                <MaterialYouIcon name="chevron-right" size="sm" aria-hidden={true} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-md-sys-outline bg-md-sys-surface text-md-body-medium font-medium text-md-sys-on-surface-variant hover:bg-md-sys-surface-container-high hover:text-md-sys-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
                aria-label="Go to last page"
                title="Last page (End)"
              >
                <MaterialYouIcon name="chevron-right" size="sm" aria-hidden={true} />
                <MaterialYouIcon name="chevron-right" size="sm" aria-hidden={true} className="-ml-1" />
              </button>
            </div>
          </nav>

          {/* Jump to Page */}
          {showJumpToPage && (
            <div className="flex items-center gap-2">
              {showJumpInput ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="jump-to-page" className="text-md-body-medium text-md-sys-on-surface-variant">
                    Go to:
                  </label>
                  <input
                    id="jump-to-page"
                    type="number"
                    min="1"
                    max={totalPages}
                    value={jumpToPageValue}
                    onChange={(e) => setJumpToPageValue(e.target.value)}
                    onKeyDown={handleJumpInputKeyDown}
                    onBlur={() => {
                      if (!jumpToPageValue) {
                        setShowJumpInput(false);
                      }
                    }}
                    className="w-16 border border-md-sys-outline rounded-md text-md-body-medium px-2 py-1 bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:border-md-sys-primary transition-colors duration-md-short2"
                    aria-label={`Jump to page. Enter a page number between 1 and ${totalPages}`}
                    aria-describedby="jump-to-page-help"
                    autoFocus
                    disabled={loading}
                  />
                  <div id="jump-to-page-help" className="sr-only">
                    Enter a page number between 1 and {totalPages}, then press Enter or click Go
                  </div>
                  <button
                    onClick={handleJumpToPage}
                    disabled={loading}
                    className="px-2 py-1 bg-md-sys-primary text-md-sys-on-primary rounded-md text-md-body-medium hover:bg-md-sys-primary/90 transition-colors duration-md-short2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2"
                    aria-label="Go to entered page number"
                  >
                    Go
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowJumpInput(true)}
                  disabled={loading}
                  className="text-md-body-medium text-md-sys-primary hover:text-md-sys-primary/80 font-medium transition-colors duration-md-short2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 rounded-md px-1"
                  aria-label="Show jump to page input"
                  title="Jump to page (g)"
                >
                  Jump to page
                </button>
              )}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="hidden lg:block px-4 py-2 bg-md-sys-surface-container-low border-t border-md-sys-outline-variant">
          <div className="text-md-body-small text-md-sys-on-surface-variant text-center" role="note" aria-label="Keyboard shortcuts for pagination">
            Keyboard shortcuts: ← → (prev/next) • Ctrl+← → (first/last) • Home/End • G (jump to page)
          </div>
        </div>
      </div>
    </>
  );
} 