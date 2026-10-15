import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { HeaderComponent } from './header.component';

/**
 * lc-header as the frame of the app shell ("Weite", kit 3.3): the account
 * button as the member's initials avatar (AS-2, LK-7), a menu that wraps long
 * names and fits a phone (AS-2), a one-line subtitle with the full text
 * available (AS-3) and the transparent variant (LK-8).
 */
describe('HeaderComponent — app shell (AS-2, AS-3, LK-8)', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let el: HTMLElement;
  const scss = readFileSync(resolve(__dirname, 'header.component.scss'), 'utf-8');

  const longName = 'Johanna-Friederike Apfelbaum-Kieselbacher-Morgentau';
  const longEmail = 'johanna.apfelbaum-kieselbacher@example.org';

  function set(inputs: Record<string, unknown>): void {
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  /** The SCSS rule body for an exact selector. */
  function rule(selector: string): string {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return scss.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`))?.[1] ?? '';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([]), provideHttpClient(withXhr())],
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    el = fixture.nativeElement;
  });

  describe('account button (AS-2)', () => {
    it('keeps the icon trigger by default', () => {
      set({ userName: longName });
      const trigger = el.querySelector('.lc-header__profile-trigger');
      expect(trigger?.classList).not.toContain('lc-header__profile-trigger--avatar');
      expect(trigger?.querySelector('lc-icon')).toBeTruthy();
    });

    it('shows the initials avatar in the member colour with userMenuTrigger="avatar"', () => {
      set({
        userName: longName,
        userMenuTrigger: 'avatar',
        userAvatarColor: 'member-2',
        userMenuAriaLabel: `Menü für ${longName}`,
      });
      const trigger = el.querySelector<HTMLButtonElement>('button.lc-header__profile-trigger--avatar');
      expect(trigger).toBeTruthy();
      expect(trigger?.getAttribute('aria-label')).toBe(`Menü für ${longName}`);
      expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');
      const avatar = trigger?.querySelector('.lc-avatar');
      expect(avatar?.textContent?.trim()).toBe('JA');
      expect(avatar?.classList).toContain('lc-avatar--member-2');
      // The button names itself; the avatar inside is decoration.
      expect(avatar?.getAttribute('aria-hidden')).toBe('true');
      expect(avatar?.getAttribute('role')).toBeNull();
    });

    it('uses userAvatarSrc as the photo', () => {
      set({ userName: 'Tom Ek', userMenuTrigger: 'avatar', userAvatarSrc: '/photos/tom.jpg' });
      expect(el.querySelector('.lc-header__profile-trigger--avatar img')?.getAttribute('src')).toBe('/photos/tom.jpg');
    });

    it('opens the menu from the avatar trigger', () => {
      set({ userName: 'Tom Ek', userMenuTrigger: 'avatar' });
      el.querySelector<HTMLButtonElement>('.lc-header__profile-trigger--avatar')?.click();
      fixture.detectChanges();
      expect(el.querySelector('[role="menu"]')).toBeTruthy();
    });

    it('gives the avatar trigger 48 px and the icon trigger at least 44 px in every density', () => {
      expect(rule('.lc-header__profile-trigger')).toMatch(/min-height: var\(--size-min-touch-height, 2\.75rem\)/);
      const avatarRule = rule('.lc-header__profile-trigger--avatar');
      expect(avatarRule).toMatch(/width: 3rem/);
      expect(avatarRule).toMatch(/height: 3rem/);
    });
  });

  describe('member menu (AS-2)', () => {
    beforeEach(() => {
      set({ userName: longName, userEmail: longEmail, userAvatarColor: 'member-1' });
      fixture.componentInstance.toggleDropdown();
      fixture.detectChanges();
    });

    it('shows name and email in full', () => {
      expect(el.querySelector('.lc-header__menu-user-name')?.textContent?.trim()).toBe(longName);
      expect(el.querySelector('.lc-header__menu-user-email')?.textContent?.trim()).toBe(longEmail);
    });

    it('colours the menu header avatar', () => {
      expect(el.querySelector('.lc-header__menu-header .lc-avatar')?.classList).toContain('lc-avatar--member-1');
    });

    it('caps the menu at min(18rem, 100vw − 2rem)', () => {
      const panel = el.querySelector<HTMLElement>('.lc-menu__dropdown');
      expect(panel?.getAttribute('style')).toContain('max-width: min(18rem, calc(100vw - 2rem))');
    });

    it('wraps name and email instead of cutting them', () => {
      const name = rule('.lc-header__menu-user-name');
      const email = rule('.lc-header__menu-user-email');
      expect(name).not.toMatch(/white-space: nowrap|text-overflow/);
      expect(email).not.toMatch(/white-space: nowrap|text-overflow/);
      expect(name).toMatch(/overflow-wrap: break-word/);
      expect(email).toMatch(/overflow-wrap: anywhere/);
    });
  });

  describe('subtitle (AS-3)', () => {
    it('carries the full text as its title', () => {
      set({ title: 'Product', subtitle: 'Familie Apfelbaum-Kieselbacher-Morgentau und Freunde' });
      const subtitle = el.querySelector('.lc-header__subtitle');
      expect(subtitle?.textContent?.trim()).toBe('Familie Apfelbaum-Kieselbacher-Morgentau und Freunde');
      expect(subtitle?.getAttribute('title')).toBe('Familie Apfelbaum-Kieselbacher-Morgentau und Freunde');
    });

    it('stays on one line with an ellipsis and shows the text as typed', () => {
      const subtitle = rule('.lc-header__subtitle');
      expect(subtitle).toMatch(/white-space: nowrap/);
      expect(subtitle).toMatch(/text-overflow: ellipsis/);
      expect(subtitle).toMatch(/overflow: hidden/);
      expect(subtitle).toMatch(/text-transform: var\(--lc-header-subtitle-transform, none\)/);
      expect(subtitle).not.toMatch(/uppercase/);
    });

    it('lets the brand shrink so the ellipsis can kick in', () => {
      expect(rule('.lc-header__brand')).toMatch(/min-width: 0/);
      expect(rule('.lc-header__title-group')).toMatch(/min-width: 0/);
    });
  });

  describe('transparent variant (LK-8)', () => {
    it('is off by default', () => {
      set({ title: 'Product' });
      expect(el.querySelector('header')?.classList).not.toContain('lc-header--transparent');
    });

    it('drops background and border', () => {
      set({ title: 'Product', variant: 'transparent', sticky: false });
      const header = el.querySelector('header');
      expect(header?.classList).toContain('lc-header--transparent');
      expect(header?.classList).toContain('lc-header--static');
      const transparent = rule('.lc-header.lc-header--transparent');
      expect(transparent).toMatch(/--lc-header-bg: transparent/);
      expect(transparent).toMatch(/--lc-header-border: transparent/);
      expect(transparent).toMatch(/border-bottom-width: 0/);
    });

    it('overrides the literal theme backgrounds (comes after them)', () => {
      expect(scss.indexOf('.lc-header.lc-header--transparent')).toBeGreaterThan(scss.indexOf('.lc-header--light {'));
    });
  });
});
