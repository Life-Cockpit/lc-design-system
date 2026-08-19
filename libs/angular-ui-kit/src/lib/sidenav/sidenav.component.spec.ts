import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidenavComponent } from './sidenav.component';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { NavigationItem } from '../models/navigation-item.interface';

// JSDOM does not implement matchMedia. The mock keeps its `change` listeners so
// a test can flip the viewport below the mobile breakpoint.
let mediaListeners: Array<(e: MediaQueryListEvent) => void> = [];
let mediaMatches = false;
function emitViewportChange(matches: boolean): void {
  mediaMatches = matches;
  mediaListeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
}
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: mediaMatches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn((_type: string, listener: (e: MediaQueryListEvent) => void) => {
      mediaListeners.push(listener);
    }),
    removeEventListener: jest.fn((_type: string, listener: (e: MediaQueryListEvent) => void) => {
      mediaListeners = mediaListeners.filter((l) => l !== listener);
    }),
    dispatchEvent: jest.fn(),
  })),
});

// jsdom has no layout, so the CDK's InteractivityChecker (offsetWidth /
// getClientRects based) deems every element invisible and the focus trap
// would never move focus. Treat elements as visible/focusable the way a
// browser would.
const jsdomInteractivityChecker: Partial<InteractivityChecker> = {
  isDisabled: (element: HTMLElement) => element.hasAttribute('disabled'),
  isVisible: () => true,
  isFocusable: (element: HTMLElement) => !element.hasAttribute('disabled'),
  isTabbable: (element: HTMLElement) => !element.hasAttribute('disabled') && element.tabIndex >= 0,
};

describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;

  beforeEach(async () => {
    mediaListeners = [];
    mediaMatches = false;
    await TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [
        provideRouter([]),
        { provide: InteractivityChecker, useValue: jsdomInteractivityChecker },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Structure', () => {
    it('should render aside element when open', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const aside = fixture.debugElement.query(By.css('aside'));
      expect(aside).toBeTruthy();
    });

    it('should not render when closed', () => {
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();

      const aside = fixture.debugElement.query(By.css('aside'));
      expect(aside).toBeFalsy();
    });

    it('should render overlay when open', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.lc-sidenav__overlay'));
      expect(overlay).toBeTruthy();
    });

    it('should have lc-sidenav CSS class', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const sidenav = fixture.debugElement.query(By.css('.lc-sidenav'));
      expect(sidenav).toBeTruthy();
    });
  });

  describe('Position Variants', () => {
    it('should apply left position class', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('position', 'left');
      fixture.detectChanges();

      const sidenav = fixture.debugElement.query(By.css('.lc-sidenav--left'));
      expect(sidenav).toBeTruthy();
    });

    it('should apply right position class', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('position', 'right');
      fixture.detectChanges();

      const sidenav = fixture.debugElement.query(By.css('.lc-sidenav--right'));
      expect(sidenav).toBeTruthy();
    });
  });

  describe('Open/Close State', () => {
    it('should emit close event when overlay is clicked', () => {
      const closeSpy = jest.spyOn(component.closed, 'emit');
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.lc-sidenav__overlay'));
      overlay.nativeElement.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should emit close event when close button is clicked', () => {
      const closeSpy = jest.spyOn(component.closed, 'emit');
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const closeButton = fixture.debugElement.query(By.css('.lc-sidenav__close'));
      closeButton.nativeElement.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should call handleClose method when overlay clicked', () => {
      const handleCloseSpy = jest.spyOn(component, 'handleClose');
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.lc-sidenav__overlay'));
      overlay.nativeElement.click();

      expect(handleCloseSpy).toHaveBeenCalled();
    });
  });

  describe('Width Configuration', () => {
    it('should use default width when not specified', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      expect(component.width()).toBe('320px');
    });

    it('should use custom width when specified', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('width', '400px');
      fixture.detectChanges();

      const _sidenav = fixture.debugElement.query(By.css('.lc-sidenav'));
      expect(component.width()).toBe('400px');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should expose the drawer panel as a modal dialog', () => {
      const aside = fixture.debugElement.query(By.css('aside'));
      expect(aside.nativeElement.getAttribute('role')).toBe('dialog');
      expect(aside.nativeElement.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label', () => {
      const aside = fixture.debugElement.query(By.css('aside'));
      expect(aside.nativeElement.getAttribute('aria-label')).toBe('Side navigation');
    });

    it('should use custom aria-label when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'Custom navigation');
      fixture.detectChanges();

      const aside = fixture.debugElement.query(By.css('aside'));
      expect(aside.nativeElement.getAttribute('aria-label')).toBe('Custom navigation');
    });

    it('should make the inner <nav> the (only) navigation landmark, labelled with ariaLabel', () => {
      fixture.componentRef.setInput('items', [
        { id: 'home', icon: 'home', label: 'Home', route: '/', displayOrder: 1 },
      ]);
      fixture.componentRef.setInput('ariaLabel', 'Main menu');
      fixture.detectChanges();

      const aside: HTMLElement = fixture.nativeElement.querySelector('aside');
      const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
      expect(aside.getAttribute('role')).not.toBe('navigation');
      expect(nav.getAttribute('aria-label')).toBe('Main menu');
      expect(fixture.nativeElement.querySelectorAll('[role="navigation"], nav').length).toBe(1);
    });

    it('docked: aside is a plain complementary region (no dialog role, no duplicate label)', () => {
      fixture.componentRef.setInput('mode', 'docked');
      fixture.componentRef.setInput('items', [
        { id: 'home', icon: 'home', label: 'Home', route: '/', displayOrder: 1 },
      ]);
      fixture.detectChanges();

      const aside: HTMLElement = fixture.nativeElement.querySelector('aside');
      expect(aside.hasAttribute('role')).toBe(false);
      expect(aside.hasAttribute('aria-modal')).toBe(false);
      expect(aside.hasAttribute('aria-label')).toBe(false);
      expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Side navigation');
    });

    it('should have close button with aria-label', () => {
      const closeButton = fixture.debugElement.query(By.css('.lc-sidenav__close'));
      expect(closeButton.nativeElement.getAttribute('aria-label')).toContain('Close');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', () => {
      const closeSpy = jest.spyOn(component.closed, 'emit');
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeydown(event);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not close on other keys', () => {
      const closeSpy = jest.spyOn(component.closed, 'emit');
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.handleKeydown(event);

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should not close a docked sidenav on Escape', () => {
      const closeSpy = jest.spyOn(component.closed, 'emit');
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('mode', 'docked');
      fixture.detectChanges();

      component.handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should close a docked sidenav that became a drawer on mobile (effective mode)', () => {
      const closeSpy = jest.spyOn(component.closed, 'emit');
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('mode', 'docked');
      fixture.detectChanges();

      emitViewportChange(true);
      fixture.detectChanges();
      expect(component.effectiveMode()).toBe('drawer');

      component.handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Drawer focus management', () => {
    let opener: HTMLButtonElement;

    beforeEach(() => {
      opener = document.createElement('button');
      opener.textContent = 'open';
      document.body.appendChild(opener);
      opener.focus();
    });

    afterEach(() => {
      opener.remove();
    });

    it('moves focus to the close button when the drawer opens and traps it', () => {
      expect(document.activeElement).toBe(opener);
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const aside: HTMLElement = fixture.nativeElement.querySelector('aside');
      const closeButton: HTMLElement = fixture.nativeElement.querySelector('.lc-sidenav__close');
      expect(document.activeElement).toBe(closeButton);
      // CDK focus trap anchors are attached around the panel
      expect(aside.previousElementSibling?.classList.contains('cdk-focus-trap-anchor')).toBe(true);
      expect(aside.nextElementSibling?.classList.contains('cdk-focus-trap-anchor')).toBe(true);
    });

    it('restores focus to the opener when the drawer closes', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
      expect(document.activeElement).not.toBe(opener);

      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();
      expect(document.activeElement).toBe(opener);
    });

    it('does not steal focus in docked mode', () => {
      fixture.componentRef.setInput('mode', 'docked');
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      expect(document.activeElement).toBe(opener);
    });
  });

  describe('Content Projection', () => {
    it('should project content into sidenav drawer', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const content = fixture.debugElement.query(By.css('.lc-sidenav__content'));
      expect(content).toBeTruthy();
    });
  });

  describe('Input Bindings', () => {
    it('should update isOpen via Input', () => {
      fixture.componentRef.setInput('isOpen', true);
      expect(component.isOpen()).toBe(true);
    });

    it('should update position via Input', () => {
      fixture.componentRef.setInput('position', 'right');
      expect(component.position()).toBe('right');
    });

    it('should update width via Input', () => {
      fixture.componentRef.setInput('width', '500px');
      expect(component.width()).toBe('500px');
    });

    it('should update ariaLabel via Input', () => {
      fixture.componentRef.setInput('ariaLabel', 'Menu navigation');
      expect(component.ariaLabel()).toBe('Menu navigation');
    });

    it('should update hasOverlay via Input', () => {
      fixture.componentRef.setInput('hasOverlay', false);
      expect(component.hasOverlay()).toBe(false);
    });
  });

  describe('Overlay Behavior', () => {
    it('should render overlay when hasOverlay is true', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('hasOverlay', true);
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.lc-sidenav__overlay'));
      expect(overlay).toBeTruthy();
    });

    it('should not render overlay when hasOverlay is false', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('hasOverlay', false);
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.lc-sidenav__overlay'));
      expect(overlay).toBeFalsy();
    });
  });

  describe('Computed Classes', () => {
    it('should compute correct CSS classes for left position', () => {
      fixture.componentRef.setInput('position', 'left');
      const classes = component.sidenavClasses();

      expect(classes).toContain('lc-sidenav');
      expect(classes).toContain('lc-sidenav--left');
    });

    it('should compute correct CSS classes for right position', () => {
      fixture.componentRef.setInput('position', 'right');
      const classes = component.sidenavClasses();

      expect(classes).toContain('lc-sidenav');
      expect(classes).toContain('lc-sidenav--right');
    });
  });

  describe('Item Actions', () => {
    it('should emit itemAction when handleItemAction is called', () => {
      const actionSpy = jest.spyOn(component.itemAction, 'emit');
      const item = { id: '1', icon: 'folder', label: 'Test', route: '/test', displayOrder: 1, action: { icon: 'plus' } };
      const event = new MouseEvent('click');
      jest.spyOn(event, 'stopPropagation');

      component.handleItemAction(event, item);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(actionSpy).toHaveBeenCalledWith(item);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close toggles', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const aside = fixture.debugElement.query(By.css('aside'));
      expect(aside).toBeTruthy();
    });

    it('should handle close event when already closed', () => {
      const closeSpy = jest.spyOn(component.closed, 'emit');
      fixture.componentRef.setInput('isOpen', false);
      component.handleClose();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('NavigationItem[] Extension', () => {
    const mockNavItems = [
      {
        id: 'home',
        icon: 'home',
        label: 'Home',
        route: '/',
        displayOrder: 1,
      },
      {
        id: 'trading',
        icon: 'chart-bar',
        label: 'Trading',
        route: '/trading',
        requiredRole: 'Trader',
        displayOrder: 2,
      },
    ];

    it('should accept NavigationItem[] input', () => {
      fixture.componentRef.setInput('items', mockNavItems);
      expect(component.items()).toEqual(mockNavItems);
    });

    it('should render navigation items when provided', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('items', mockNavItems);
      fixture.detectChanges();

      const navLinks = fixture.debugElement.queryAll(By.css('.lc-sidenav__nav-item'));
      expect(navLinks.length).toBe(2);
    });

    it('should display item labels', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('items', mockNavItems);
      fixture.detectChanges();

      const labels = fixture.nativeElement.querySelectorAll('.lc-sidenav__nav-label');
      expect(labels[0].textContent.trim()).toBe('Home');
      expect(labels[1].textContent.trim()).toBe('Trading');
    });

    it('should render item icons', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('items', mockNavItems);
      fixture.detectChanges();

      const icons = fixture.nativeElement.querySelectorAll('.lc-sidenav__nav-icon');
      expect(icons.length).toBe(2);
    });

    it('should identify active route via isItemActive', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('items', mockNavItems);
      fixture.componentRef.setInput('activeRoute', '/');
      fixture.detectChanges();

      expect(component.isItemActive(mockNavItems[0])).toBe(true);
      expect(component.isItemActive(mockNavItems[1])).toBe(false);
    });

    it('should update active state when activeRoute changes', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('items', mockNavItems);
      fixture.componentRef.setInput('activeRoute', '/');
      fixture.detectChanges();

      expect(component.isItemActive(mockNavItems[0])).toBe(true);

      fixture.componentRef.setInput('activeRoute', '/trading');
      fixture.detectChanges();

      expect(component.isItemActive(mockNavItems[1])).toBe(true);
      expect(component.isItemActive(mockNavItems[0])).toBe(false);
    });

    it('should emit item click events', () => {
      const clickSpy = jest.spyOn(component.itemClicked, 'emit');
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('items', mockNavItems);
      fixture.detectChanges();

      const firstLink = fixture.nativeElement.querySelector('.lc-sidenav__nav-item');
      firstLink.click();

      expect(clickSpy).toHaveBeenCalledWith(mockNavItems[0]);
    });

    it('should sort items by displayOrder', () => {
      const unsortedItems = [
        { ...mockNavItems[1], displayOrder: 1 },
        { ...mockNavItems[0], displayOrder: 2 },
      ];
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('items', unsortedItems);
      fixture.detectChanges();

      const labels = fixture.nativeElement.querySelectorAll('.lc-sidenav__nav-label');
      expect(labels[0].textContent.trim()).toBe('Trading');
      expect(labels[1].textContent.trim()).toBe('Home');
    });
  });

  describe('Group expansion', () => {
    const group: NavigationItem = {
      id: 'reports',
      icon: 'chart-bar',
      label: 'Reports',
      route: '',
      displayOrder: 1,
      children: [
        { id: 'r1', icon: 'document', label: 'Monthly', route: '/reports/monthly', displayOrder: 1 },
        { id: 'r2', icon: 'document', label: 'Yearly', route: '/reports/yearly', displayOrder: 2 },
      ],
    };
    const section: NavigationItem = {
      id: 'sec',
      icon: '',
      label: 'Section',
      route: '',
      displayOrder: 2,
      isSection: true,
      children: [
        {
          id: 'sub',
          icon: 'folder',
          label: 'Sub group',
          route: '',
          displayOrder: 1,
          children: [{ id: 's1', icon: 'file', label: 'Leaf', route: '/section/leaf', displayOrder: 1 }],
        },
      ],
    };

    function parentButton(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('.lc-sidenav__nav-item--parent');
    }

    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('items', [group, section]);
    });

    it('opens the group that contains the active route', () => {
      fixture.componentRef.setInput('activeRoute', '/reports/monthly');
      fixture.detectChanges();

      expect(component.isExpanded(group)).toBe(true);
      expect(component.expandedItems().has('reports')).toBe(true);
      expect(parentButton().getAttribute('aria-expanded')).toBe('true');
      expect(fixture.nativeElement.querySelector('.lc-sidenav__nav-children')).toBeTruthy();
    });

    it('opens a section sub-group that contains the active route', () => {
      fixture.componentRef.setInput('activeRoute', '/section/leaf');
      fixture.detectChanges();

      expect(component.expandedItems().has('sub')).toBe(true);
      expect(component.expandedItems().has('reports')).toBe(false);
    });

    it('lets the user collapse a group with the active child, and the set stays in sync', () => {
      fixture.componentRef.setInput('activeRoute', '/reports/monthly');
      fixture.detectChanges();
      expect(component.isExpanded(group)).toBe(true);

      component.toggleExpanded(group);
      fixture.detectChanges();
      expect(component.isExpanded(group)).toBe(false);
      expect(component.expandedItems().has('reports')).toBe(false);
      expect(parentButton().getAttribute('aria-expanded')).toBe('false');
      expect(fixture.nativeElement.querySelector('.lc-sidenav__nav-children')).toBeNull();

      component.toggleExpanded(group);
      fixture.detectChanges();
      expect(component.isExpanded(group)).toBe(true);
      expect(parentButton().getAttribute('aria-expanded')).toBe('true');
    });

    it('re-opens the group when the route changes to another of its children', () => {
      fixture.componentRef.setInput('activeRoute', '/reports/monthly');
      fixture.detectChanges();
      component.toggleExpanded(group);
      fixture.detectChanges();
      expect(component.isExpanded(group)).toBe(false);

      fixture.componentRef.setInput('activeRoute', '/reports/yearly');
      fixture.detectChanges();
      expect(component.isExpanded(group)).toBe(true);
    });

    it('keeps a manually opened group open across a route change elsewhere', () => {
      fixture.detectChanges();
      component.toggleExpanded(group);
      fixture.detectChanges();
      expect(component.isExpanded(group)).toBe(true);

      fixture.componentRef.setInput('activeRoute', '/section/leaf');
      fixture.detectChanges();
      expect(component.isExpanded(group)).toBe(true);
      expect(component.expandedItems().has('sub')).toBe(true);
    });

    it('un-collapses the rail and opens the clicked group', () => {
      fixture.componentRef.setInput('mode', 'docked');
      component.collapsed.set(true);
      fixture.detectChanges();

      component.toggleExpanded(group);
      fixture.detectChanges();
      expect(component.collapsed()).toBe(false);
      expect(component.isExpanded(group)).toBe(true);
    });
  });

  describe('Collapsed rail tooltip (stylesheet contract)', () => {
    // jsdom does not apply component styles; the tooltip rule is checked
    // against the source. The bubble floats over the content area, which
    // follows the root theme, so it must use the semantic surface/ink tokens —
    // `--color-neutral-900` + `#fff` inverted to white-on-white in dark.
    const scss = readFileSync(resolve(__dirname, 'sidenav.component.scss'), 'utf-8');
    const start = scss.indexOf('content: attr(title);');
    const ruleStart = scss.lastIndexOf('&:hover::after', start);
    const rule = scss.slice(ruleStart, scss.indexOf('}', start));

    it('is shown on keyboard focus as well as on hover', () => {
      expect(rule).toContain('&:focus-visible::after');
    });

    it('uses non-inverting surface and ink tokens', () => {
      expect(rule).toContain('var(--color-surface-raised)');
      expect(rule).toContain('var(--color-text-primary)');
      expect(rule).not.toMatch(/--color-neutral-/);
      expect(rule).not.toMatch(/color:\s*#fff\b/);
    });
  });
});
