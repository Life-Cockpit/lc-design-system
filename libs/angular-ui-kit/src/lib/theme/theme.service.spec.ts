import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import type { ThemeMode } from './theme.types';

interface MediaQueryMock {
  matches: boolean;
  media: string;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  addListener: jest.Mock;
  removeListener: jest.Mock;
  onchange: null;
  dispatchEvent: jest.Mock;
  /** Fires the registered `change` listeners as if the OS setting flipped. */
  emitChange(matches: boolean): void;
}

let mediaQuery: MediaQueryMock;

function mockPrefersDark(matches: boolean): void {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  mediaQuery = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: jest.fn((_type: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.add(handler);
    }),
    removeEventListener: jest.fn((_type: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.delete(handler);
    }),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchEvent: jest.fn(),
    emitChange(next: boolean) {
      this.matches = next;
      listeners.forEach((handler) => handler({ matches: next } as MediaQueryListEvent));
    },
  };
  window.matchMedia = jest.fn().mockReturnValue(mediaQuery as unknown as MediaQueryList);
}

describe('ThemeService', () => {
  let service: ThemeService;

  /** Creates the service the way an app would: once, on first injection. */
  function createService(): ThemeService {
    TestBed.configureTestingModule({});
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
    mockPrefersDark(false);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('Initialization', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with dark theme by default (DS 2.0 is dark-first)', () => {
      expect(service.currentTheme().currentMode).toBe('dark');
      expect(service.isDark()).toBe(true);
    });

    it('should apply the dark class to the document root on init', () => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should not persist anything on init (only explicit choices are stored)', () => {
      expect(localStorage.getItem(ThemeService.STORAGE_KEY)).toBeNull();
    });
  });

  describe('Initialization: adopting a pre-set theme', () => {
    it('should keep a `light` class an app set on the root before bootstrap', () => {
      document.documentElement.classList.add('light');
      service = createService();

      expect(service.currentTheme().currentMode).toBe('light');
      expect(service.isDark()).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should keep a `dark` class an app set on the root before bootstrap', () => {
      document.documentElement.classList.add('dark');
      service = createService();

      expect(service.currentTheme().currentMode).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should restore the persisted mode when no root class is set', () => {
      localStorage.setItem(ThemeService.STORAGE_KEY, 'light');
      service = createService();

      expect(service.currentTheme().currentMode).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should let a pre-set root class win over the persisted mode', () => {
      localStorage.setItem(ThemeService.STORAGE_KEY, 'light');
      document.documentElement.classList.add('dark');
      service = createService();

      expect(service.currentTheme().currentMode).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should ignore an unknown persisted value and fall back to dark', () => {
      localStorage.setItem(ThemeService.STORAGE_KEY, 'sepia');
      service = createService();

      expect(service.currentTheme().currentMode).toBe('dark');
    });

    it('should survive an unavailable localStorage', () => {
      const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        service = createService();
        service.setTheme('light');
      }).not.toThrow();
      expect(service.currentTheme().currentMode).toBe('light');

      getItem.mockRestore();
      setItem.mockRestore();
    });
  });

  describe('Theme Switching', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should switch to light when setTheme("light") is called', () => {
      service.setTheme('light');
      expect(service.currentTheme().currentMode).toBe('light');
      expect(service.isDark()).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should switch back to dark when setTheme("dark") is called', () => {
      service.setTheme('light');
      service.setTheme('dark');
      expect(service.currentTheme().currentMode).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should toggle between dark and light', () => {
      // starts dark
      service.toggleTheme();
      expect(service.currentTheme().currentMode).toBe('light');
      service.toggleTheme();
      expect(service.currentTheme().currentMode).toBe('dark');
    });

    it('should keep isDark in sync with the active mode', () => {
      service.setTheme('light');
      expect(service.isDark()).toBe(false);
      service.setTheme('dark');
      expect(service.isDark()).toBe(true);
    });

    it('should persist the chosen mode under the stable storage key', () => {
      service.setTheme('light');
      expect(localStorage.getItem(ThemeService.STORAGE_KEY)).toBe('light');
      service.toggleTheme();
      expect(localStorage.getItem(ThemeService.STORAGE_KEY)).toBe('dark');
    });
  });

  describe('System Preference', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should adopt light when the OS prefers light', () => {
      mockPrefersDark(false);
      service.useSystemPreference();
      expect(service.currentTheme().currentMode).toBe('light');
      expect(service.currentTheme().prefersDark).toBe(false);
    });

    it('should adopt dark when the OS prefers dark', () => {
      mockPrefersDark(true);
      service.useSystemPreference();
      expect(service.currentTheme().currentMode).toBe('dark');
      expect(service.currentTheme().prefersDark).toBe(true);
    });

    it('should follow a later change of the OS preference', () => {
      mockPrefersDark(false);
      service.useSystemPreference();
      expect(service.currentTheme().currentMode).toBe('light');
      expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      mediaQuery.emitChange(true);
      expect(service.currentTheme().currentMode).toBe('dark');
      expect(service.currentTheme().prefersDark).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      mediaQuery.emitChange(false);
      expect(service.currentTheme().currentMode).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should stop following the OS once an explicit theme is set', () => {
      mockPrefersDark(false);
      service.useSystemPreference();
      service.setTheme('dark');
      expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      mediaQuery.emitChange(false);
      expect(service.currentTheme().currentMode).toBe('dark');
    });

    it('should not register the OS listener twice when called repeatedly', () => {
      mockPrefersDark(false);
      service.useSystemPreference();
      service.useSystemPreference();
      expect(mediaQuery.addEventListener).toHaveBeenCalledTimes(2);
      expect(mediaQuery.removeEventListener).toHaveBeenCalledTimes(1);
    });

    it('should remove the OS listener when the injector is destroyed', () => {
      mockPrefersDark(false);
      service.useSystemPreference();
      TestBed.resetTestingModule();
      expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('DOM Updates', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should set the mobile meta theme-color to the palette background of the mode', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);

      // Dark `--color-background` (DS2.0 deep teal-black), not the old #111827
      // which no dark surface uses.
      service.setTheme('dark');
      expect(meta.getAttribute('content')).toBe('#0a121b');

      service.setTheme('light');
      expect(meta.getAttribute('content')).toBe('#f3f4f6');

      meta.remove();
    });
  });

  describe('Reactivity', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should provide a readonly theme state signal', () => {
      expect(service.currentTheme).toBeDefined();
      expect(typeof service.currentTheme).toBe('function');
    });

    it('should maintain signal synchronization', () => {
      service.setTheme('light');
      expect(service.currentTheme().currentMode).toBe('light');
      expect(service.isDark()).toBe(false);
    });
  });

  describe('Type Safety', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should accept all valid theme modes', () => {
      const validModes: ThemeMode[] = ['light', 'dark'];
      validModes.forEach((mode) => {
        expect(() => service.setTheme(mode)).not.toThrow();
      });
    });

    it('should expose a correctly shaped theme state', () => {
      const themeState = service.currentTheme();
      expect(themeState).toHaveProperty('currentMode');
      expect(themeState).toHaveProperty('prefersDark');
      expect(typeof themeState.currentMode).toBe('string');
      expect(typeof themeState.prefersDark).toBe('boolean');
    });
  });
});
