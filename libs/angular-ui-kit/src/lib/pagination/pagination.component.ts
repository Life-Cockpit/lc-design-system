import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type PaginationSize = 'sm' | 'md' | 'lg';

/**
 * Pagination component for navigating through pages of content.
 *
 * Features:
 * - Configurable page size
 * - Previous/Next navigation
 * - Direct page number access
 * - Ellipsis for large page ranges
 * - Size variants (sm, md, lg)
 * - Accessible with ARIA attributes
 * - Optional item count display
 * - All UI strings overridable via inputs (i18n)
 *
 * @example
 * ```html
 * <lc-pagination
 *   [currentPage]="currentPage"
 *   [totalItems]="totalItems"
 *   [pageSize]="10"
 *   (pageChange)="onPageChange($event)"
 * ></lc-pagination>
 * ```
 */
@Component({
  selector: 'lc-pagination',
  standalone: true,
  imports: [NgClass],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly currentPage = input(1);
  readonly totalItems = input(0);
  readonly pageSize = input(10);
  readonly size = input<PaginationSize>('md');
  readonly maxVisiblePages = input(7);
  readonly ariaLabel = input('Pagination');
  readonly showInfo = input(false);

  // ── UI strings (override for i18n) ──────────────────────────────────────
  /** Visible text of the previous button */
  readonly previousLabel = input('Previous');
  /** Visible text of the next button */
  readonly nextLabel = input('Next');
  /** Accessible name of the previous button (the visible text is hidden on small screens) */
  readonly previousAriaLabel = input('Previous page');
  /** Accessible name of the next button */
  readonly nextAriaLabel = input('Next page');
  /** Accessible name of a page button; `{page}` is replaced with the page number */
  readonly pageAriaLabel = input('Page {page}');
  /**
   * Info line shown when `showInfo` is true; `{first}`, `{last}` and `{total}`
   * are replaced with the item range and total.
   */
  readonly infoText = input('Showing {first} to {last} of {total} items');

  readonly pageChange = output<number>();

  // Computed properties
  totalPages = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    return total > 0 ? Math.ceil(total / size) : 0;
  });

  firstItemIndex = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    return (page - 1) * size + 1;
  });

  lastItemIndex = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const total = this.totalItems();
    const lastIndex = page * size;
    return Math.min(lastIndex, total);
  });

  isFirstPage = computed(() => this.currentPage() === 1);

  isLastPage = computed(() => this.currentPage() === this.totalPages());

  paginationClasses = computed(() => {
    const classes = ['lc-pagination'];
    classes.push(`lc-pagination--${this.size()}`);
    return classes.join(' ');
  });

  /**
   * Calculate visible page numbers with ellipsis support
   * Returns an array where -1 represents an ellipsis
   */
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const maxVisible = this.maxVisiblePages();

    if (total <= maxVisible) {
      // Show all pages if total is less than max visible
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const sidePages = Math.floor((maxVisible - 3) / 2); // Reserve spots for first, last, and ellipsis

    // Always show first page
    pages.push(1);

    if (current <= sidePages + 2) {
      // Near the start: show 1, 2, 3, 4, 5, ..., last
      for (let i = 2; i <= maxVisible - 2; i++) {
        pages.push(i);
      }
      pages.push(-1); // Ellipsis
      pages.push(total);
    } else if (current >= total - sidePages - 1) {
      // Near the end: show 1, ..., n-4, n-3, n-2, n-1, n
      pages.push(-1); // Ellipsis
      for (let i = total - (maxVisible - 3); i <= total; i++) {
        pages.push(i);
      }
    } else {
      // In the middle: show 1, ..., current-1, current, current+1, ..., last
      pages.push(-1); // Left ellipsis
      for (let i = current - sidePages; i <= current + sidePages; i++) {
        if (i > 1 && i < total) {
          pages.push(i);
        }
      }
      pages.push(-1); // Right ellipsis
      pages.push(total);
    }

    return pages;
  });

  // Navigation methods
  goToPreviousPage(): void {
    if (!this.isFirstPage()) {
      const newPage = this.currentPage() - 1;
      this.pageChange.emit(newPage);
    }
  }

  goToNextPage(): void {
    if (!this.isLastPage()) {
      const newPage = this.currentPage() + 1;
      this.pageChange.emit(newPage);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  /** Resolved info line (`infoText` with placeholders filled in) */
  readonly infoLine = computed(() =>
    this.infoText()
      .replace('{first}', String(this.firstItemIndex()))
      .replace('{last}', String(this.lastItemIndex()))
      .replace('{total}', String(this.totalItems())),
  );

  /** Accessible name for the button of `page` */
  getPageAriaLabel(page: number): string {
    return this.pageAriaLabel().replace('{page}', String(page));
  }

  // Helper methods
  isCurrentPage(page: number): boolean {
    return page === this.currentPage();
  }

  isEllipsis(page: number): boolean {
    return page === -1;
  }

  shouldRender(): boolean {
    const total = this.totalPages();
    return total > 1;
  }
}
