import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreadcrumbsComponent, BreadcrumbItem } from './breadcrumbs.component';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('BreadcrumbsComponent', () => {
  let component: BreadcrumbsComponent;
  let fixture: ComponentFixture<BreadcrumbsComponent>;

  const mockItems: BreadcrumbItem[] = [
    { label: 'Home', url: '/' },
    { label: 'Products', url: '/products' },
    { label: 'Electronics', url: '/products/electronics' },
    { label: 'Laptops' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbsComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Structure', () => {
    it('should render nav element with aria-label', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeTruthy();
      expect(nav.nativeElement.getAttribute('aria-label')).toBe('Breadcrumbs');
    });

    it('should render ol element with lc-breadcrumbs CSS class', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const ol = fixture.debugElement.query(By.css('ol'));
      expect(ol).toBeTruthy();
      expect(ol.nativeElement.classList.contains('lc-breadcrumbs')).toBe(true);
    });

    it('should not render when items are empty', () => {
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeFalsy();
    });
  });

  describe('Breadcrumb Items', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
    });

    it('should render all breadcrumb items', () => {
      const listItems = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__item'));
      expect(listItems.length).toBe(4);
    });

    it('should render links for items with url', () => {
      const links = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__link'));
      expect(links.length).toBe(3); // First 3 items have URLs
    });

    it('should render current page without link', () => {
      const currentPage = fixture.debugElement.query(By.css('.lc-breadcrumbs__current'));
      expect(currentPage).toBeTruthy();
      expect(currentPage.nativeElement.textContent.trim()).toBe('Laptops');
    });

    it('should apply aria-current to last item', () => {
      const listItems = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__item'));
      const lastItem = listItems[listItems.length - 1];
      const currentPage = lastItem?.query(By.css('.lc-breadcrumbs__current'));
      expect(currentPage?.nativeElement.getAttribute('aria-current')).toBe('page');
    });

    it('should display correct labels', () => {
      const links = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__link'));
      expect(links[0]?.nativeElement.textContent.trim()).toBe('Home');
      expect(links[1]?.nativeElement.textContent.trim()).toBe('Products');
      expect(links[2]?.nativeElement.textContent.trim()).toBe('Electronics');
    });

    it('should have correct href attributes', () => {
      const links = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__link'));
      expect(links[0]?.nativeElement.getAttribute('href')).toBe('/');
      expect(links[1]?.nativeElement.getAttribute('href')).toBe('/products');
      expect(links[2]?.nativeElement.getAttribute('href')).toBe('/products/electronics');
    });
  });

  describe('Item Click (items without url)', () => {
    const stateItems = [
      { label: 'Root', id: 'root' },
      { label: 'Level A', id: 'a' },
      { label: 'Level B', id: 'b' },
    ];

    beforeEach(() => {
      fixture.componentRef.setInput('items', stateItems);
      fixture.detectChanges();
    });

    it('should render items without url as buttons', () => {
      const buttons = fixture.debugElement.queryAll(
        By.css('button.lc-breadcrumbs__link--button'),
      );
      // last item stays non-interactive
      expect(buttons.length).toBe(2);
      expect(buttons[0]?.nativeElement.getAttribute('type')).toBe('button');
    });

    it('should emit itemClick with the item on click', () => {
      const clickSpy = jest.fn();
      component.itemClick.subscribe(clickSpy);

      const buttons = fixture.debugElement.queryAll(
        By.css('button.lc-breadcrumbs__link--button'),
      );
      (buttons[1]?.nativeElement as HTMLElement).click();

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledWith(stateItems[1]);
    });

    it('should keep the last item non-interactive with aria-current', () => {
      const listItems = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__item'));
      const lastItem = listItems[listItems.length - 1];
      expect(lastItem?.query(By.css('button'))).toBeFalsy();
      const current = lastItem?.query(By.css('.lc-breadcrumbs__current'));
      expect(current?.nativeElement.getAttribute('aria-current')).toBe('page');
    });

    it('should keep rendering items with url as links', () => {
      fixture.componentRef.setInput('items', [
        { label: 'Home', url: '/' },
        { label: 'State only', id: 's' },
        { label: 'Current' },
      ]);
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('a.lc-breadcrumbs__link'));
      const button = fixture.debugElement.query(
        By.css('button.lc-breadcrumbs__link--button'),
      );
      expect(link?.nativeElement.textContent.trim()).toBe('Home');
      expect(button?.nativeElement.textContent.trim()).toBe('State only');
    });
  });

  describe('Separators', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
    });

    it('should render separators between items', () => {
      const separators = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__separator'));
      // 4 items = 3 separators
      expect(separators.length).toBe(3);
    });

    it('should default to / separator', () => {
      const separators = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__separator'));
      expect(separators[0]?.nativeElement.textContent.trim()).toBe('/');
    });

    it('should use custom separator when provided', () => {
      fixture.componentRef.setInput('separator', '>');
      fixture.detectChanges();
      const separators = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__separator'));
      expect(separators[0]?.nativeElement.textContent.trim()).toBe('>');
    });

    it('should have aria-hidden on separators', () => {
      const separators = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__separator'));
      expect(separators[0]?.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Max Items', () => {
    it('should show all items when maxItems is 0', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.componentRef.setInput('maxItems', 0);
      fixture.detectChanges();
      const listItems = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__item'));
      expect(listItems.length).toBe(4);
    });

    it('should collapse middle items when exceeding maxItems', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.componentRef.setInput('maxItems', 3);
      fixture.detectChanges();
      const listItems = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__item'));
      // First + ellipsis + last = 3
      expect(listItems.length).toBe(3);
    });

    it('should show ellipsis when items are collapsed', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.componentRef.setInput('maxItems', 3);
      fixture.detectChanges();
      const ellipsis = fixture.debugElement.query(By.css('.lc-breadcrumbs__ellipsis'));
      expect(ellipsis).toBeTruthy();
      expect(ellipsis.nativeElement.textContent.trim()).toBe('...');
    });

    it('should keep first and last items visible when collapsed', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.componentRef.setInput('maxItems', 3);
      fixture.detectChanges();
      const links = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__link'));
      const currentPage = fixture.debugElement.query(By.css('.lc-breadcrumbs__current'));
      expect(links[0]?.nativeElement.textContent.trim()).toBe('Home');
      expect(currentPage.nativeElement.textContent.trim()).toBe('Laptops');
    });
  });

  describe('Size Variants', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockItems);
    });

    it('should default to md size', () => {
      expect(component.size()).toBe('md');
    });

    it('should apply sm size class', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      const ol = fixture.debugElement.query(By.css('ol'));
      expect(ol.nativeElement.classList.contains('lc-breadcrumbs--sm')).toBe(true);
    });

    it('should apply md size class', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      const ol = fixture.debugElement.query(By.css('ol'));
      expect(ol.nativeElement.classList.contains('lc-breadcrumbs--md')).toBe(true);
    });

    it('should apply lg size class', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      const ol = fixture.debugElement.query(By.css('ol'));
      expect(ol.nativeElement.classList.contains('lc-breadcrumbs--lg')).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should compute breadcrumbClasses with size', () => {
      fixture.componentRef.setInput('size', 'sm');
      const classes = component.breadcrumbClasses();
      expect(classes).toContain('lc-breadcrumbs');
      expect(classes).toContain('lc-breadcrumbs--sm');
    });

    it('should compute visibleItems when maxItems is 0', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.componentRef.setInput('maxItems', 0);
      const visible = component.visibleItems();
      expect(visible.length).toBe(4);
      expect(visible).toEqual(mockItems);
    });

    it('should compute visibleItems with ellipsis when exceeding maxItems', () => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.componentRef.setInput('maxItems', 3);
      const visible = component.visibleItems();
      expect(visible.length).toBe(3);
      expect(visible[0]?.label).toBe('Home');
      expect(visible[1]?.label).toBe('...');
      expect(visible[2]?.label).toBe('Laptops');
    });
  });

  describe('Input Setters', () => {
    it('should accept items input', () => {
      const testItems: BreadcrumbItem[] = [{ label: 'A', url: '/a' }, { label: 'B' }];
      fixture.componentRef.setInput('items', testItems);
      fixture.detectChanges();
      expect(component.items()).toEqual(testItems);
    });

    it('should accept separator input', () => {
      fixture.componentRef.setInput('separator', '>');
      expect(component.separator()).toBe('>');
    });

    it('should accept maxItems input', () => {
      fixture.componentRef.setInput('maxItems', 5);
      expect(component.maxItems()).toBe(5);
    });

    it('should accept size input', () => {
      fixture.componentRef.setInput('size', 'lg');
      expect(component.size()).toBe('lg');
    });

    it('should accept ariaLabel input', () => {
      fixture.componentRef.setInput('ariaLabel', 'Custom Navigation');
      expect(component.ariaLabel()).toBe('Custom Navigation');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
    });

    it('should have role on links', () => {
      const links = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__link'));
      links.forEach((link) => {
        expect(link.nativeElement.hasAttribute('href')).toBe(true);
      });
    });

    it('should have proper list structure', () => {
      const nav = fixture.debugElement.query(By.css('nav'));
      const ol = nav.query(By.css('ol'));
      const lis = ol.queryAll(By.css('li'));
      expect(lis.length).toBe(4);
    });

    it('should allow custom aria-label', () => {
      fixture.componentRef.setInput('ariaLabel', 'Site Navigation');
      fixture.detectChanges();
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav.nativeElement.getAttribute('aria-label')).toBe('Site Navigation');
    });
  });

  describe('Content Projection', () => {
    @Component({
      standalone: true,
      imports: [BreadcrumbsComponent],
      template: `
        <lc-breadcrumbs [items]="items">
          <div class="custom-content">Custom Content</div>
        </lc-breadcrumbs>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestHostComponent {
      items: BreadcrumbItem[] = [{ label: 'Home', url: '/' }, { label: 'About' }];
    }

    it('should support content projection', () => {
      const hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();
      const customContent = hostFixture.debugElement.query(By.css('.custom-content'));
      expect(customContent).toBeTruthy();
    });
  });

  describe('Stylesheet', () => {
    const scss = readFileSync(join(__dirname, 'breadcrumbs.component.scss'), 'utf8');

    it('should only reference existing transition / spacing tokens', () => {
      expect(scss).not.toMatch(/--transition-(fast|normal|slow)/);
      // the token is `--spacing-0-5`; the escaped Tailwind spelling doesn't exist
      expect(scss).not.toContain('--spacing-0\\.5');
      expect(scss).toContain('var(--spacing-0-5)');
      expect(scss).toContain('var(--animation-duration-base)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item', () => {
      fixture.componentRef.setInput('items', [{ label: 'Home' }]);
      fixture.detectChanges();
      const listItems = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__item'));
      expect(listItems.length).toBe(1);
      const separators = fixture.debugElement.queryAll(By.css('.lc-breadcrumbs__separator'));
      expect(separators.length).toBe(0);
    });

    it('should handle items with special characters', () => {
      fixture.componentRef.setInput('items', [
        { label: 'Home & Garden', url: '/home-garden' },
        { label: 'Tools <&> Equipment' },
      ]);
      fixture.detectChanges();
      const link = fixture.debugElement.query(By.css('.lc-breadcrumbs__link'));
      const currentPage = fixture.debugElement.query(By.css('.lc-breadcrumbs__current'));
      expect(link.nativeElement.textContent).toContain('Home & Garden');
      expect(currentPage.nativeElement.textContent).toContain('Tools <&> Equipment');
    });

    it('should handle very long labels gracefully', () => {
      const longLabel = 'A'.repeat(100);
      fixture.componentRef.setInput('items', [{ label: longLabel, url: '/' }, { label: 'Short' }]);
      fixture.detectChanges();
      const link = fixture.debugElement.query(By.css('.lc-breadcrumbs__link'));
      expect(link.nativeElement.textContent.trim()).toBe(longLabel);
    });
  });
});
