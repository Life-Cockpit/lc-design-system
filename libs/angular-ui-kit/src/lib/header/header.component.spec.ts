import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HeaderComponent } from './header.component';
import { ThemeService } from '../theme/theme.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Inputs', () => {
    it('should accept logo input', () => {
      fixture.componentRef.setInput('logo', '/assets/logo.svg');
      expect(component.logo()).toBe('/assets/logo.svg');
    });

    it('should accept userEmail input', () => {
      fixture.componentRef.setInput('userEmail', 'test@example.com');
      expect(component.userEmail()).toBe('test@example.com');
    });

    it('should accept showHamburger input', () => {
      fixture.componentRef.setInput('showHamburger', true);
      expect(component.showHamburger()).toBe(true);
    });
  });

  describe('Outputs', () => {
    it('should emit hamburgerClick event', (done) => {
      component.hamburgerClick.subscribe(() => {
        expect(true).toBe(true);
        done();
      });
      component.onHamburgerClick();
    });

    it('should emit logoutClick event', (done) => {
      component.logoutClick.subscribe(() => {
        expect(true).toBe(true);
        done();
      });
      component.onLogoutClick();
    });
  });

  describe('Theme toggle button', () => {
    let themeService: ThemeService;

    beforeEach(() => {
      themeService = TestBed.inject(ThemeService);
      themeService.setTheme('dark');
    });

    it('toggles the theme itself and emits by default (autoToggleTheme = true)', () => {
      const emitted = jest.fn();
      component.themeToggleClick.subscribe(emitted);

      component.onThemeButtonClick();

      expect(themeService.isDark()).toBe(false);
      expect(emitted).toHaveBeenCalledTimes(1);
    });

    it('only emits when autoToggleTheme is false (the app owns the switch)', () => {
      fixture.componentRef.setInput('autoToggleTheme', false);
      const emitted = jest.fn();
      component.themeToggleClick.subscribe(emitted);

      component.onThemeButtonClick();

      expect(themeService.isDark()).toBe(true);
      expect(emitted).toHaveBeenCalledTimes(1);
    });

    it('does not undo the switch when the app toggles in the handler with autoToggleTheme = false', () => {
      fixture.componentRef.setInput('autoToggleTheme', false);
      component.themeToggleClick.subscribe(() => themeService.toggleTheme());

      component.onThemeButtonClick();

      expect(themeService.isDark()).toBe(false);
    });

    it('clicking the rendered button goes through onThemeButtonClick', () => {
      fixture.componentRef.setInput('showThemeButton', true);
      fixture.detectChanges();
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('.lc-header__theme-toggle button');
      expect(button).toBeTruthy();

      button.click();
      expect(themeService.isDark()).toBe(false);
    });
  });

  describe('Hamburger ARIA state', () => {
    function hamburgerButton(): HTMLButtonElement | null {
      return fixture.nativeElement.querySelector('.lc-header__hamburger button');
    }

    beforeEach(() => {
      fixture.componentRef.setInput('showHamburger', true);
      fixture.detectChanges();
    });

    it('omits aria-expanded / aria-controls while the sidenav state is unknown', () => {
      const button = hamburgerButton();
      expect(button).toBeTruthy();
      expect(button?.hasAttribute('aria-expanded')).toBe(false);
      expect(button?.hasAttribute('aria-controls')).toBe(false);
    });

    it('reflects sidenavOpen as aria-expanded on the native button and follows changes', () => {
      fixture.componentRef.setInput('sidenavOpen', false);
      fixture.detectChanges();
      expect(hamburgerButton()?.getAttribute('aria-expanded')).toBe('false');

      fixture.componentRef.setInput('sidenavOpen', true);
      fixture.detectChanges();
      expect(hamburgerButton()?.getAttribute('aria-expanded')).toBe('true');
    });

    it('reflects sidenavId as aria-controls', () => {
      fixture.componentRef.setInput('sidenavId', 'app-sidenav');
      fixture.detectChanges();
      expect(hamburgerButton()?.getAttribute('aria-controls')).toBe('app-sidenav');

      fixture.componentRef.setInput('sidenavId', '');
      fixture.detectChanges();
      expect(hamburgerButton()?.hasAttribute('aria-controls')).toBe(false);
    });

    it('applies the state when the hamburger appears after the inputs were set', () => {
      fixture.componentRef.setInput('showHamburger', false);
      fixture.componentRef.setInput('sidenavOpen', true);
      fixture.componentRef.setInput('sidenavId', 'app-sidenav');
      fixture.detectChanges();
      expect(hamburgerButton()).toBeNull();

      fixture.componentRef.setInput('showHamburger', true);
      fixture.detectChanges();
      expect(hamburgerButton()?.getAttribute('aria-expanded')).toBe('true');
      expect(hamburgerButton()?.getAttribute('aria-controls')).toBe('app-sidenav');
    });
  });

  describe('Dropdown interactions', () => {
    it('should toggle dropdown open state', () => {
      expect(component.isDropdownOpen()).toBe(false);
      component.toggleDropdown();
      expect(component.isDropdownOpen()).toBe(true);
      component.toggleDropdown();
      expect(component.isDropdownOpen()).toBe(false);
    });

    it('should close dropdown', () => {
      component.toggleDropdown();
      expect(component.isDropdownOpen()).toBe(true);
      component.closeDropdown();
      expect(component.isDropdownOpen()).toBe(false);
    });
  });

  describe('Rendering', () => {
    it('should render brand area with logo component', () => {
      fixture.componentRef.setInput('logo', '/assets/logo.svg');
      fixture.detectChanges();
      const brand = fixture.nativeElement.querySelector('.lc-header__logo');
      expect(brand).toBeTruthy();
    });

    it('should render hamburger icon when showHamburger is true', () => {
      fixture.componentRef.setInput('showHamburger', true);
      fixture.detectChanges();
      const hamburger = fixture.nativeElement.querySelector('.lc-header__hamburger');
      expect(hamburger).toBeTruthy();
    });

    it('should not render hamburger icon when showHamburger is false', () => {
      fixture.componentRef.setInput('showHamburger', false);
      fixture.detectChanges();
      const hamburger = fixture.nativeElement.querySelector('.lc-header__hamburger');
      expect(hamburger).toBeFalsy();
    });

    it('should render context info when contextName is set', () => {
      fixture.componentRef.setInput('contextName', 'Acme Corp');
      fixture.detectChanges();
      const contextInfo = fixture.nativeElement.querySelector('.lc-header__context-info');
      expect(contextInfo).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.lc-header__context-name')?.textContent).toContain('Acme Corp');
    });

    it('should render context label when contextLabel is set', () => {
      fixture.componentRef.setInput('contextName', 'Acme Corp');
      fixture.componentRef.setInput('contextLabel', 'Tenant');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.lc-header__context-label')?.textContent).toContain('Tenant');
    });

    it('should not render context info when contextName is empty', () => {
      fixture.componentRef.setInput('contextName', '');
      fixture.detectChanges();
      const contextInfo = fixture.nativeElement.querySelector('.lc-header__context-info');
      expect(contextInfo).toBeFalsy();
    });

    it('should render user email in menu header when dropdown is open', () => {
      fixture.componentRef.setInput('userEmail', 'test@example.com');
      component.toggleDropdown();
      fixture.detectChanges();
      const email = fixture.nativeElement.querySelector('.lc-header__menu-user-email');
      expect(email?.textContent).toContain('test@example.com');
    });

    it('should render menu items when dropdown is open', () => {
      component.toggleDropdown();
      fixture.detectChanges();
      const menuItems = component.menuItems();
      expect(menuItems.length).toBeGreaterThan(0);
      expect(menuItems.some(item => item.id === 'logout')).toBe(true);
    });

    it('should include Profile menu item by default', () => {
      const items = component.menuItems();
      expect(items.some(item => item.id === 'profile')).toBe(true);
    });
  });
});
