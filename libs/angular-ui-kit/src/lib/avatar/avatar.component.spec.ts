import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AVATAR_MEMBER_COLORS, AvatarComponent } from './avatar.component';

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;
  let avatarElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    avatarElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Structure', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render with lc-avatar class', () => {
      const avatar = avatarElement.querySelector('.lc-avatar');
      expect(avatar).toBeTruthy();
    });
  });

  describe('Image Display', () => {
    it('should show image when src is provided', () => {
      fixture.componentRef.setInput('src', 'https://example.com/avatar.jpg');
      fixture.componentRef.setInput('alt', 'User Avatar');
      fixture.detectChanges();

      const img = avatarElement.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/avatar.jpg');
      expect(img?.getAttribute('alt')).toBe('User Avatar');
    });

    it('should not show image when src is not provided', () => {
      const img = avatarElement.querySelector('img');
      expect(img).toBeNull();
    });

    it('should handle image load error and show initials', () => {
      fixture.componentRef.setInput('src', 'https://example.com/invalid.jpg');
      fixture.componentRef.setInput('name', 'John Doe');
      fixture.detectChanges();

      const img = avatarElement.querySelector('img') as HTMLImageElement;
      expect(img).toBeTruthy();

      // Simulate image error
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      const initials = avatarElement.querySelector('.lc-avatar__initials');
      expect(initials).toBeTruthy();
    });

    it('should retry the image when src changes after an error', () => {
      fixture.componentRef.setInput('src', 'https://example.com/invalid.jpg');
      fixture.componentRef.setInput('name', 'John Doe');
      fixture.detectChanges();

      (avatarElement.querySelector('img') as HTMLImageElement).dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(avatarElement.querySelector('img')).toBeNull();

      fixture.componentRef.setInput('src', 'https://example.com/valid.jpg');
      fixture.detectChanges();

      const img = avatarElement.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/valid.jpg');
      expect(avatarElement.querySelector('.lc-avatar__initials')).toBeNull();
    });
  });

  describe('Initials Fallback', () => {
    it('should display initials when no src is provided', () => {
      fixture.componentRef.setInput('name', 'John Doe');
      fixture.detectChanges();

      const initials = avatarElement.querySelector('.lc-avatar__initials');
      expect(initials).toBeTruthy();
      expect(initials?.textContent?.trim()).toBe('JD');
    });

    it('should generate initials from first and last name', () => {
      fixture.componentRef.setInput('name', 'Jane Smith');
      fixture.detectChanges();

      expect(component.initials()).toBe('JS');
    });

    it('should generate initial from single name', () => {
      fixture.componentRef.setInput('name', 'Madonna');
      fixture.detectChanges();

      expect(component.initials()).toBe('M');
    });

    it('should handle names with multiple words', () => {
      fixture.componentRef.setInput('name', 'John Michael Doe');
      fixture.detectChanges();

      expect(component.initials()).toBe('JD');
    });

    it('should handle empty name', () => {
      fixture.componentRef.setInput('name', '');
      fixture.detectChanges();

      expect(component.initials()).toBe('?');
    });

    it('should handle undefined name', () => {
      expect(component.initials()).toBe('?');
    });
  });

  describe('Size Variants', () => {
    it('should have md size by default', () => {
      expect(component.size()).toBe('md');
      const avatar = avatarElement.querySelector('.lc-avatar--md');
      expect(avatar).toBeTruthy();
    });

    it('should apply xs size', () => {
      fixture.componentRef.setInput('size', 'xs');
      fixture.detectChanges();

      const avatar = avatarElement.querySelector('.lc-avatar--xs');
      expect(avatar).toBeTruthy();
    });

    it('should apply sm size', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();

      const avatar = avatarElement.querySelector('.lc-avatar--sm');
      expect(avatar).toBeTruthy();
    });

    it('should apply md size', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();

      const avatar = avatarElement.querySelector('.lc-avatar--md');
      expect(avatar).toBeTruthy();
    });

    it('should apply lg size', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      const avatar = avatarElement.querySelector('.lc-avatar--lg');
      expect(avatar).toBeTruthy();
    });

    it('should apply xl size', () => {
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();

      const avatar = avatarElement.querySelector('.lc-avatar--xl');
      expect(avatar).toBeTruthy();
    });
  });

  describe('Status Indicator', () => {
    it('should not show status indicator by default', () => {
      const status = avatarElement.querySelector('.lc-avatar__status');
      expect(status).toBeNull();
    });

    it('should show online status', () => {
      fixture.componentRef.setInput('status', 'online');
      fixture.detectChanges();

      const status = avatarElement.querySelector('.lc-avatar__status--online');
      expect(status).toBeTruthy();
    });

    it('should show offline status', () => {
      fixture.componentRef.setInput('status', 'offline');
      fixture.detectChanges();

      const status = avatarElement.querySelector('.lc-avatar__status--offline');
      expect(status).toBeTruthy();
    });

    it('should show away status', () => {
      fixture.componentRef.setInput('status', 'away');
      fixture.detectChanges();

      const status = avatarElement.querySelector('.lc-avatar__status--away');
      expect(status).toBeTruthy();
    });

    it('should show busy status', () => {
      fixture.componentRef.setInput('status', 'busy');
      fixture.detectChanges();

      const status = avatarElement.querySelector('.lc-avatar__status--busy');
      expect(status).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have img role for initials when no image', () => {
      fixture.componentRef.setInput('name', 'John Doe');
      fixture.detectChanges();

      const avatar = avatarElement.querySelector('.lc-avatar');
      expect(avatar?.getAttribute('role')).toBe('img');
    });

    it('should have aria-label with name when using initials', () => {
      fixture.componentRef.setInput('name', 'John Doe');
      fixture.detectChanges();

      const avatar = avatarElement.querySelector('.lc-avatar');
      expect(avatar?.getAttribute('aria-label')).toBe('John Doe');
    });

    it('should have aria-label when using image', () => {
      fixture.componentRef.setInput('src', 'https://example.com/avatar.jpg');
      fixture.componentRef.setInput('alt', 'User Avatar');
      fixture.detectChanges();

      const avatar = avatarElement.querySelector('.lc-avatar');
      expect(avatar?.getAttribute('aria-label')).toBe('User Avatar');
    });
  });

  describe('CSS Classes Computed', () => {
    it('should combine size and status classes correctly', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.componentRef.setInput('status', 'online');
      fixture.detectChanges();

      const classes = component.avatarClasses();
      expect(classes).toContain('lc-avatar');
      expect(classes).toContain('lc-avatar--lg');
      expect(classes).toContain('lc-avatar--with-status');
    });

    it('should include with-status class when status is provided', () => {
      fixture.componentRef.setInput('status', 'away');
      fixture.detectChanges();

      const classes = component.avatarClasses();
      expect(classes).toContain('lc-avatar--with-status');
    });

    it('should not include with-status class when no status', () => {
      const classes = component.avatarClasses();
      expect(classes).not.toContain('lc-avatar--with-status');
    });
  });

  describe('Member colours and ring (LK-7)', () => {
    const scss = readFileSync(resolve(__dirname, 'avatar.component.scss'), 'utf-8');

    it('keeps the neutral avatar by default', () => {
      const avatar = avatarElement.querySelector('.lc-avatar');
      expect(avatar?.className).not.toContain('lc-avatar--member');
      expect(avatar?.className).not.toContain('lc-avatar--ring');
    });

    it.each(AVATAR_MEMBER_COLORS)('applies the %s colour', (color) => {
      fixture.componentRef.setInput('name', 'Tom Ek');
      fixture.componentRef.setInput('color', color);
      fixture.detectChanges();
      const avatar = avatarElement.querySelector('.lc-avatar');
      expect(avatar?.classList).toContain('lc-avatar--member');
      expect(avatar?.classList).toContain(`lc-avatar--${color}`);
      // Colour is never the only cue: the initials stay.
      expect(avatar?.textContent?.trim()).toBe('TE');
    });

    it('lists the six member colours in order', () => {
      expect(AVATAR_MEMBER_COLORS).toEqual(['member-1', 'member-2', 'member-3', 'member-4', 'member-5', 'member-6']);
    });

    it('draws the ring on request', () => {
      fixture.componentRef.setInput('ring', true);
      fixture.detectChanges();
      expect(avatarElement.querySelector('.lc-avatar')?.classList).toContain('lc-avatar--ring');
      expect(scss).toMatch(/\.lc-avatar--ring \{[^}]*box-shadow: 0 0 0 var\(--lc-avatar-ring-width, 3px\) var\(--lc-avatar-ring-color, var\(--color-background\)\)/s);
    });

    it('reads every member colour from its token, white initials at least 4.5:1 on the fallback', () => {
      const map = scss.match(/\$lc-avatar-member-colors: \(([^)]*)\)/s)?.[1] ?? '';
      const hexes = [...map.matchAll(/(\d): (#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]] as const);
      expect(hexes.map(([i]) => i)).toEqual(['1', '2', '3', '4', '5', '6']);
      for (const [, hex] of hexes) {
        expect(contrast(hex, '#ffffff')).toBeGreaterThanOrEqual(4.5);
      }
      expect(scss).toMatch(/background-color: var\(--color-member-#\{\$index\}, #\{\$hex\}\)/);
      expect(scss).toMatch(/color: var\(--color-on-member, #ffffff\)/);
    });
  });
});
