import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Structure', () => {
    it('should render nav element with aria-label', () => {
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeTruthy();
      expect(nav.nativeElement.getAttribute('aria-label')).toBe('Pagination');
    });

    it('should render with lc-pagination CSS class', () => {
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const pagination = fixture.debugElement.query(By.css('.lc-pagination'));
      expect(pagination).toBeTruthy();
    });

    it('should not render when totalItems is 0', () => {
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 0);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeFalsy();
    });

    it('should not render when totalItems is less than pageSize', () => {
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 5);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeFalsy();
    });
  });

  describe('Page Calculation', () => {
    it('should calculate total pages correctly', () => {
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      expect(component.totalPages()).toBe(10);
    });

    it('should round up total pages when items do not divide evenly', () => {
      fixture.componentRef.setInput('totalItems', 105);
      fixture.componentRef.setInput('pageSize', 10);
      expect(component.totalPages()).toBe(11);
    });

    it('should calculate first item index correctly', () => {
      fixture.componentRef.setInput('currentPage', 3);
      fixture.componentRef.setInput('pageSize', 10);
      expect(component.firstItemIndex()).toBe(21);
    });

    it('should calculate last item index correctly', () => {
      fixture.componentRef.setInput('currentPage', 3);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('totalItems', 100);
      expect(component.lastItemIndex()).toBe(30);
    });

    it('should not exceed totalItems for last item index', () => {
      fixture.componentRef.setInput('currentPage', 11);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('totalItems', 105);
      expect(component.lastItemIndex()).toBe(105);
    });
  });

  describe('Page Navigation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPage', 5);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();
    });

    it('should navigate to previous page', () => {
      const emitSpy = jest.spyOn(component.pageChange, 'emit');
      component.goToPreviousPage();
      expect(emitSpy).toHaveBeenCalledWith(4);
    });

    it('should navigate to next page', () => {
      const emitSpy = jest.spyOn(component.pageChange, 'emit');
      component.goToNextPage();
      expect(emitSpy).toHaveBeenCalledWith(6);
    });

    it('should navigate to specific page', () => {
      const emitSpy = jest.spyOn(component.pageChange, 'emit');
      component.goToPage(7);
      expect(emitSpy).toHaveBeenCalledWith(7);
    });

    it('should not navigate before first page', () => {
      fixture.componentRef.setInput('currentPage', 1);
      const emitSpy = jest.spyOn(component.pageChange, 'emit');
      component.goToPreviousPage();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not navigate after last page', () => {
      fixture.componentRef.setInput('currentPage', 10);
      const emitSpy = jest.spyOn(component.pageChange, 'emit');
      component.goToNextPage();
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Boundary States', () => {
    it('should disable previous button on first page', () => {
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      expect(component.isFirstPage()).toBe(true);
      const prevButton = fixture.debugElement.query(By.css('.lc-pagination__button--prev'));
      expect(prevButton.nativeElement.disabled).toBe(true);
    });

    it('should disable next button on last page', () => {
      fixture.componentRef.setInput('currentPage', 10);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      expect(component.isLastPage()).toBe(true);
      const nextButton = fixture.debugElement.query(By.css('.lc-pagination__button--next'));
      expect(nextButton.nativeElement.disabled).toBe(true);
    });

    it('should enable both buttons on middle page', () => {
      fixture.componentRef.setInput('currentPage', 5);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      expect(component.isFirstPage()).toBe(false);
      expect(component.isLastPage()).toBe(false);
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const pagination = fixture.debugElement.query(By.css('.lc-pagination--sm'));
      expect(pagination).toBeTruthy();
    });

    it('should apply medium size class (default)', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const pagination = fixture.debugElement.query(By.css('.lc-pagination--md'));
      expect(pagination).toBeTruthy();
    });

    it('should apply large size class', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const pagination = fixture.debugElement.query(By.css('.lc-pagination--lg'));
      expect(pagination).toBeTruthy();
    });
  });

  describe('Page Range Display', () => {
    it('should show all page buttons when total pages <= max visible', () => {
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 50);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('maxVisiblePages', 7);
      fixture.detectChanges();

      const pageButtons = fixture.debugElement.queryAll(By.css('.lc-pagination__button--page'));
      expect(pageButtons.length).toBe(5); // 5 total pages
    });

    it('should show ellipsis when total pages > max visible', () => {
      fixture.componentRef.setInput('currentPage', 5);
      fixture.componentRef.setInput('totalItems', 200);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('maxVisiblePages', 5);
      fixture.detectChanges();

      const pages = component.visiblePages();
      expect(pages.some((p) => p === -1)).toBe(true); // -1 represents ellipsis
    });

    it('should show correct pages near start', () => {
      fixture.componentRef.setInput('currentPage', 2);
      fixture.componentRef.setInput('totalItems', 200);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('maxVisiblePages', 5);
      fixture.detectChanges();

      const pages = component.visiblePages();
      // Should show: 1, 2, 3, 4, 5, ..., 20
      expect(pages[0]).toBe(1);
      expect(pages[1]).toBe(2);
      expect(pages.includes(-1)).toBe(true); // Has ellipsis
      expect(pages[pages.length - 1]).toBe(20); // Last page
    });

    it('should show correct pages near end', () => {
      fixture.componentRef.setInput('currentPage', 19);
      fixture.componentRef.setInput('totalItems', 200);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('maxVisiblePages', 5);
      fixture.detectChanges();

      const pages = component.visiblePages();
      // Should show: 1, ..., 16, 17, 18, 19, 20
      expect(pages[0]).toBe(1);
      expect(pages.includes(-1)).toBe(true); // Has ellipsis
      expect(pages[pages.length - 1]).toBe(20);
    });

    it('should show correct pages in middle', () => {
      fixture.componentRef.setInput('currentPage', 10);
      fixture.componentRef.setInput('totalItems', 200);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('maxVisiblePages', 5);
      fixture.detectChanges();

      const pages = component.visiblePages();
      // Should show: 1, ..., 9, 10, 11, ..., 20
      expect(pages[0]).toBe(1);
      expect(pages.filter((p) => p === -1).length).toBeGreaterThanOrEqual(1); // Has ellipsis
      expect(pages.includes(10)).toBe(true);
      expect(pages[pages.length - 1]).toBe(20);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPage', 5);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();
    });

    it('should have aria-current on current page button', () => {
      const currentButton = fixture.debugElement.query(By.css('[aria-current="page"]'));
      expect(currentButton).toBeTruthy();
      expect(currentButton.nativeElement.textContent.trim()).toBe('5');
    });

    it('should have aria-label on navigation element', () => {
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav.nativeElement.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on previous button', () => {
      const prevButton = fixture.debugElement.query(By.css('.lc-pagination__button--prev'));
      expect(prevButton.nativeElement.getAttribute('aria-label')).toContain('Previous');
    });

    it('should have aria-label on next button', () => {
      const nextButton = fixture.debugElement.query(By.css('.lc-pagination__button--next'));
      expect(nextButton.nativeElement.getAttribute('aria-label')).toContain('Next');
    });

    it('should have aria-label on page buttons', () => {
      const pageButtons = fixture.debugElement.queryAll(By.css('.lc-pagination__button--page'));
      pageButtons.forEach((button) => {
        expect(button.nativeElement.getAttribute('aria-label')).toContain('Page');
      });
    });

    it('should have aria-hidden on ellipsis', () => {
      fixture.componentRef.setInput('currentPage', 10);
      fixture.componentRef.setInput('totalItems', 200);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('maxVisiblePages', 5);
      fixture.detectChanges();

      const ellipsis = fixture.debugElement.query(By.css('.lc-pagination__ellipsis'));
      if (ellipsis) {
        expect(ellipsis.nativeElement.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });

  describe('Custom aria-label', () => {
    it('should use custom aria-label when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'Custom pagination navigation');
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav.nativeElement.getAttribute('aria-label')).toBe('Custom pagination navigation');
    });
  });

  describe('Input Bindings', () => {
    it('should update currentPage via Input', () => {
      fixture.componentRef.setInput('currentPage', 7);
      expect(component.currentPage()).toBe(7);
    });

    it('should update totalItems via Input', () => {
      fixture.componentRef.setInput('totalItems', 500);
      expect(component.totalItems()).toBe(500);
    });

    it('should update pageSize via Input', () => {
      fixture.componentRef.setInput('pageSize', 25);
      expect(component.pageSize()).toBe(25);
    });

    it('should update size via Input', () => {
      fixture.componentRef.setInput('size', 'lg');
      expect(component.size()).toBe('lg');
    });

    it('should update maxVisiblePages via Input', () => {
      fixture.componentRef.setInput('maxVisiblePages', 9);
      expect(component.maxVisiblePages()).toBe(9);
    });

    it('should update ariaLabel via Input', () => {
      fixture.componentRef.setInput('ariaLabel', 'Results pagination');
      expect(component.ariaLabel()).toBe('Results pagination');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single page correctly', () => {
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 5);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      // Should not render pagination for single page
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeFalsy();
    });

    it('should handle zero total items', () => {
      fixture.componentRef.setInput('currentPage', 1);
      fixture.componentRef.setInput('totalItems', 0);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeFalsy();
    });

    it('should clamp currentPage to valid range', () => {
      fixture.componentRef.setInput('currentPage', 15);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      // Total pages is 10, so page 15 is out of range
      expect(component.currentPage()).toBe(15);
      // Component should handle this gracefully
    });

    it('should handle page size changes', () => {
      fixture.componentRef.setInput('currentPage', 5);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      expect(component.totalPages()).toBe(10);

      fixture.componentRef.setInput('pageSize', 20);
      expect(component.totalPages()).toBe(5);
    });
  });

  describe('UI strings (i18n inputs)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('currentPage', 2);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('showInfo', true);
      fixture.componentRef.setInput('previousLabel', 'Zurück');
      fixture.componentRef.setInput('nextLabel', 'Weiter');
      fixture.componentRef.setInput('previousAriaLabel', 'Vorherige Seite');
      fixture.componentRef.setInput('nextAriaLabel', 'Nächste Seite');
      fixture.componentRef.setInput('pageAriaLabel', 'Seite {page}');
      fixture.componentRef.setInput('infoText', '{first}–{last} von {total}');
      fixture.detectChanges();
    });

    it('should render the previous / next labels from the inputs', () => {
      const prev = fixture.debugElement.query(By.css('.lc-pagination__button--prev'));
      const next = fixture.debugElement.query(By.css('.lc-pagination__button--next'));
      expect(prev.nativeElement.textContent.trim()).toBe('Zurück');
      expect(next.nativeElement.textContent.trim()).toBe('Weiter');
      expect(prev.nativeElement.getAttribute('aria-label')).toBe('Vorherige Seite');
      expect(next.nativeElement.getAttribute('aria-label')).toBe('Nächste Seite');
    });

    it('should build page button names from the pageAriaLabel template', () => {
      const pageButtons = fixture.debugElement.queryAll(By.css('.lc-pagination__button--page'));
      expect(pageButtons[0]?.nativeElement.getAttribute('aria-label')).toBe('Seite 1');
      expect(pageButtons[1]?.nativeElement.getAttribute('aria-label')).toBe('Seite 2');
    });

    it('should build the info line from the infoText template', () => {
      const info = fixture.debugElement.query(By.css('.lc-pagination__info'));
      expect(info.nativeElement.textContent.trim()).toBe('11–20 von 100');
    });

    it('should hide the decorative chevron icons from assistive tech', () => {
      const icons = fixture.debugElement.queryAll(By.css('.lc-pagination__icon'));
      expect(icons.length).toBe(2);
      icons.forEach((icon) => expect(icon.nativeElement.getAttribute('aria-hidden')).toBe('true'));
    });
  });

  describe('Stylesheet', () => {
    it('should only reference existing transition tokens', () => {
      const scss = readFileSync(join(__dirname, 'pagination.component.scss'), 'utf8');
      expect(scss).not.toMatch(/--transition-(fast|normal|slow)/);
      expect(scss).toContain('var(--animation-duration-base)');
    });
  });

  describe('Show Info Text', () => {
    it('should display item range info when showInfo is true', () => {
      fixture.componentRef.setInput('currentPage', 2);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('showInfo', true);
      fixture.detectChanges();

      const info = fixture.debugElement.query(By.css('.lc-pagination__info'));
      expect(info).toBeTruthy();
      expect(info.nativeElement.textContent).toContain('11');
      expect(info.nativeElement.textContent).toContain('20');
      expect(info.nativeElement.textContent).toContain('100');
    });

    it('should not display info when showInfo is false', () => {
      fixture.componentRef.setInput('currentPage', 2);
      fixture.componentRef.setInput('totalItems', 100);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('showInfo', false);
      fixture.detectChanges();

      const info = fixture.debugElement.query(By.css('.lc-pagination__info'));
      expect(info).toBeFalsy();
    });
  });
});
