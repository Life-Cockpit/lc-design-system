import { ChangeDetectionStrategy, Component, isSignal, reflectComponentType, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AppShellComponent } from './app-shell.component';
import { AppPageComponent } from './app-page.component';

@Component({
  imports: [AppShellComponent, AppPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-app-shell [horizon]="horizon()">
      <header shell-header class="t-header">Header</header>
      @if (withNav()) {
        <nav shell-nav class="t-nav" aria-label="Hauptnavigation">Nav</nav>
      }
      <lc-app-page [asideLabelledby]="asideLabelledby()" [asideAriaLabel]="asideAriaLabel()" [contentMaxWidth]="contentMaxWidth()">
        <h1>Heute</h1>
        <p class="t-content">Inhalt</p>
        <section page-aside class="t-aside"><h2 id="members">Mitglieder</h2></section>
      </lc-app-page>
      <footer shell-footer class="t-footer">Footer</footer>
      <nav shell-bottom-nav class="t-bar" aria-label="Leiste">Bar</nav>
    </lc-app-shell>
  `,
})
class ShellHostComponent {
  readonly horizon = signal(false);
  readonly withNav = signal(true);
  readonly asideLabelledby = signal('');
  readonly asideAriaLabel = signal('');
  readonly contentMaxWidth = signal('880px');
}

/** A page with `busy` bound (AS-12); `ShellHostComponent` above leaves it unset. */
@Component({
  imports: [AppPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-app-page mainId="shell-main" [busy]="busy()" asideAriaLabel="Mitglieder">
      <p class="t-content">Heute wird geladen …</p>
      <section page-aside>Mitglieder</section>
    </lc-app-page>
  `,
})
class BusyHostComponent {
  readonly busy = signal(false);
}

/** The element for `selector`; fails the test when it is missing. */
function q<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const node = root.querySelector<T & Element>(selector);
  if (!node) throw new Error(`${selector} not found`);
  return node;
}

/** Whether `b` comes after `a` in the document. */
const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe('AppShellComponent and AppPageComponent (AS-10, LK-6)', () => {
  const shellScss = readFileSync(resolve(__dirname, 'app-shell.component.scss'), 'utf-8');
  const pageScss = readFileSync(resolve(__dirname, 'app-page.component.scss'), 'utf-8');

  function render(setup?: (host: ShellHostComponent) => void) {
    const fixture = TestBed.createComponent(ShellHostComponent);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ShellHostComponent] }).compileComponents();
  });

  describe('lc-app-shell slots', () => {
    it('places every slot in its region, in reading order', () => {
      const { el } = render();
      const order = [
        '.lc-app-shell__header .t-header',
        '.lc-app-shell__nav .t-nav',
        '.lc-app-shell__body .t-content',
        '.lc-app-shell__footer .t-footer',
        '.lc-app-shell__bottom-nav .t-bar',
      ].map((selector) => q(el, selector));
      for (let i = 1; i < order.length; i++) {
        expect(follows(order[i - 1], order[i])).toBe(true);
      }
    });

    it('renders no horizon by default', () => {
      const { el } = render();
      expect(el.querySelector('.lc-horizon')).toBeNull();
      expect(el.querySelector('.lc-app-shell')?.classList).not.toContain('lc-app-shell--horizon');
    });

    it('closes the page with the horizon block when asked', () => {
      const { el } = render((host) => host.horizon.set(true));
      const horizon = q(el, '.lc-app-shell__horizon');
      expect(horizon.classList).toContain('lc-horizon');
      expect(el.querySelector('.lc-app-shell')?.classList).toContain('lc-app-shell--horizon');
      // After the page, before the footer: the footer rests on its land.
      expect(follows(q(el, '.lc-app-shell__body'), horizon)).toBe(true);
      expect(follows(horizon, q(el, '.lc-app-shell__footer'))).toBe(true);
    });

    it('leaves the nav region empty without a side navigation', () => {
      const { el } = render((host) => host.withNav.set(false));
      expect(el.querySelector('.lc-app-shell__nav')?.children).toHaveLength(0);
    });
  });

  describe('lc-app-shell layout (source contract)', () => {
    it('lets the document scroll: no overflow and no fixed height on the shell', () => {
      const shellRule = shellScss.match(/\n\.lc-app-shell \{([^}]*)\}/)?.[1] ?? '';
      expect(shellRule).not.toMatch(/overflow/);
      expect(shellRule).not.toMatch(/(^|\s)height:/);
      expect(shellRule).toMatch(/min-height: 100dvh/);
    });

    it('docks the side navigation from 1024 px in a 240 / 248 / 280 px column, sticky', () => {
      expect(shellScss).toMatch(/@media \(min-width: 1024px\) \{[^]*grid-template-columns: var\(--_nav-width\) minmax\(0, 1fr\)/);
      expect(shellScss).toMatch(/--_nav-width: var\(--lc-app-shell-nav-width, 240px\)/);
      expect(shellScss).toMatch(/@media \(min-width: 1440px\) \{[^}]*--lc-app-shell-nav-width, 248px/);
      expect(shellScss).toMatch(/@media \(min-width: 1920px\) \{[^}]*--lc-app-shell-nav-width, 280px/);
      expect(shellScss).toMatch(/\.lc-app-shell__nav \{[^}]*position: sticky;[^}]*top: 0;/s);
    });

    it('hides the bottom bar from 1024 px and keeps its height free below', () => {
      expect(shellScss).toMatch(/@media \(min-width: 1024px\) \{[^]*\.lc-app-shell__bottom-nav \{\s*display: none;/);
      expect(shellScss).toMatch(/calc\(112px \+ env\(safe-area-inset-bottom, 0px\)\)/);
      expect(shellScss).toMatch(/:has\(> \.lc-app-shell__bottom-nav:not\(:empty\)\) \{\s*padding-bottom: var\(--_clearance\)/);
    });

    it('paints the sky behind the whole frame', () => {
      expect(shellScss).toMatch(/background-color: var\(--lc-app-shell-bg, var\(--color-background\)\)/);
      expect(shellScss).toMatch(/background-image: var\(--lc-app-shell-bg-image, var\(--app-background-image, none\)\)/);
    });

    it('starts the right column\'s tint and hairline behind the header, from 1280 px', () => {
      // The "Weite" design draws the column from the top of the window; the
      // shell paints the header row's part when the page has a right column.
      const rule = /@media \(min-width: 1280px\) \{\s*\.lc-app-shell:has\(\.lc-app-page__aside\) > \.lc-app-shell__header \{([^}]*)\}/.exec(shellScss)?.[1] ?? '';
      expect(rule).toMatch(/--_aside-width: var\(--lc-app-page-aside-width, 360px\)/);
      expect(rule).toMatch(/linear-gradient\(var\(--_hairline\), var\(--_hairline\)\) right calc\(var\(--_aside-width\) - 1px\) top \/ 1px 100% no-repeat/);
      expect(rule).toMatch(/linear-gradient\(var\(--color-background-low\), var\(--color-background-low\)\) right top \/ var\(--_aside-width\) 100% no-repeat/);
      expect(shellScss).toMatch(/@media \(min-width: 1440px\) \{[^]*:has\(\.lc-app-page__aside\) > \.lc-app-shell__header \{\s*--_aside-width: var\(--lc-app-page-aside-width, 400px\)/);
      expect(shellScss).toMatch(/@media \(min-width: 1920px\) \{[^]*:has\(\.lc-app-page__aside\) > \.lc-app-shell__header \{\s*--_aside-width: var\(--lc-app-page-aside-width, 460px\)/);
    });

    it('respects the safe areas (header top and sides, page sides)', () => {
      expect(shellScss).toMatch(/\.lc-app-shell__header \{[^}]*padding-top: env\(safe-area-inset-top, 0px\);[^}]*padding-left: env\(safe-area-inset-left, 0px\);[^}]*padding-right: env\(safe-area-inset-right, 0px\);/s);
      expect(shellScss).toMatch(/\.lc-app-shell__body \{[^}]*padding-left: env\(safe-area-inset-left, 0px\);/s);
    });
  });

  describe('lc-app-page', () => {
    it('renders the page in <main id="main">', () => {
      const { el } = render();
      const main = el.querySelector('main');
      expect(main?.id).toBe('main');
      expect(main?.querySelector('h1')?.textContent).toBe('Heute');
    });

    it('renders no aside without an accessible name', () => {
      const { el } = render();
      expect(el.querySelector('aside')).toBeNull();
      expect(el.querySelector('.lc-app-page')?.classList).not.toContain('lc-app-page--aside');
    });

    it('renders the right column after <main>, labelled by its heading', () => {
      const { el } = render((host) => host.asideLabelledby.set('members'));
      const main = q(el, 'main');
      const aside = q(el, 'aside');
      expect(aside.getAttribute('aria-labelledby')).toBe('members');
      expect(aside.hasAttribute('aria-label')).toBe(false);
      expect(aside.querySelector('#members')).toBeTruthy();
      expect(main.contains(aside)).toBe(false);
      expect(follows(main, aside)).toBe(true);
      expect(el.querySelector('.lc-app-page')?.classList).toContain('lc-app-page--aside');
    });

    it('takes an aria-label when the column has no heading', () => {
      const { el } = render((host) => host.asideAriaLabel.set('Mitglieder'));
      const aside = q(el, 'aside');
      expect(aside.getAttribute('aria-label')).toBe('Mitglieder');
      expect(aside.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('caps the content at contentMaxWidth (880 px by default)', () => {
      const { el, fixture } = render();
      const page = q(el, '.lc-app-page');
      expect(page.style.getPropertyValue('--lc-app-page-content-max')).toBe('880px');
      fixture.componentInstance.contentMaxWidth.set('none');
      fixture.detectChanges();
      expect(page.style.getPropertyValue('--lc-app-page-content-max')).toBe('none');
      expect(pageScss).toMatch(/max-width: var\(--lc-app-page-content-max, 880px\)/);
    });

    it('shows the right column from 1280 px at 360 / 400 / 460 px, hidden below', () => {
      expect(pageScss).toMatch(/\n\.lc-app-page__aside \{\s*display: none;/);
      expect(pageScss).toMatch(/@media \(min-width: 1280px\) \{[^]*grid-template-columns: minmax\(0, 1fr\) var\(--_aside-width\)/);
      expect(pageScss).toMatch(/--_aside-width: var\(--lc-app-page-aside-width, 360px\)/);
      expect(pageScss).toMatch(/@media \(min-width: 1440px\) \{[^}]*--lc-app-page-aside-width, 400px/);
      expect(pageScss).toMatch(/@media \(min-width: 1920px\) \{[^}]*--lc-app-page-aside-width, 460px/);
    });

    it('draws the column with a fading tint and a fading hairline', () => {
      expect(pageScss).toMatch(/background: linear-gradient\(180deg, var\(--color-background-low\), transparent\)/);
      expect(pageScss).toMatch(/border-image: linear-gradient\(180deg, var\(--color-hairline, var\(--color-border\)\) 60%, transparent\) 1/);
    });

    it('steps the side padding 24 · 32 · 48 · 56 · 72 · 96 px', () => {
      const steps = [...pageScss.matchAll(/--_pad-x: var\(--lc-app-page-padding-x, (\d+)px\)/g)].map((m) => Number(m[1]));
      expect(steps).toEqual([24, 32, 48, 56, 72, 96]);
    });
  });

  describe('lc-app-page busy (AS-12)', () => {
    const appPageTs = readFileSync(resolve(__dirname, 'app-page.component.ts'), 'utf-8');

    function renderBusy(busy: boolean) {
      const fixture = TestBed.createComponent(BusyHostComponent);
      fixture.componentInstance.busy.set(busy);
      fixture.detectChanges();
      return { fixture, main: q(fixture.nativeElement as HTMLElement, 'main') };
    }

    it('AC-1: is an optional boolean signal input named busy, false by default, documented with @default false', () => {
      const inputs = reflectComponentType(AppPageComponent)?.inputs ?? [];
      expect(inputs).toContainEqual(expect.objectContaining({ propName: 'busy', templateName: 'busy' }));
      const page = TestBed.createComponent(AppPageComponent).componentInstance;
      expect(isSignal(page.busy)).toBe(true);
      expect(page.busy()).toBe(false);
      expect(appPageTs).toMatch(/No visual change\.\s*\* @default false\s*\*\/\s*readonly busy = input\(false\);/);
    });

    it('AC-2: sets aria-busy="true" on <main> while busy', () => {
      const { main } = renderBusy(true);
      expect(main.getAttribute('aria-busy')).toBe('true');
      expect(main.id).toBe('shell-main');
    });

    it('AC-2: renders no aria-busy attribute when unset or false (never "false")', () => {
      const unset = render();
      expect(q(unset.el, 'main').hasAttribute('aria-busy')).toBe(false);
      const { main } = renderBusy(false);
      expect(main.hasAttribute('aria-busy')).toBe(false);
    });

    it('AC-2: follows true → false → true and changes nothing else in the DOM', () => {
      const idle = renderBusy(false);
      const idleHtml = (idle.fixture.nativeElement as HTMLElement).innerHTML;
      const { fixture, main } = renderBusy(true);
      const host = fixture.nativeElement as HTMLElement;
      expect(host.innerHTML).toBe(idleHtml.replace('id="shell-main">', 'id="shell-main" aria-busy="true">'));

      fixture.componentInstance.busy.set(false);
      fixture.detectChanges();
      expect(main.hasAttribute('aria-busy')).toBe(false);
      expect(host.innerHTML).toBe(idleHtml);

      fixture.componentInstance.busy.set(true);
      fixture.detectChanges();
      expect(main.getAttribute('aria-busy')).toBe('true');
      expect(q(host, 'aside').getAttribute('aria-label')).toBe('Mitglieder');
      expect(main.className).toBe('lc-app-page__main');
    });
  });
});
