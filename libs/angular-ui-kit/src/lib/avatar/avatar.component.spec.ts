import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

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
});
