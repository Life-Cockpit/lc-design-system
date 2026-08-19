import { Injectable, signal, computed, PLATFORM_ID, inject, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { ThemeMode, ThemeState } from './theme.types';

/**
 * Theme Service
 *
 * Design System 2.0 is dark-first: dark is the default theme. Light remains a
 * fully supported opt-in. Theme is applied via a `dark` / `light` class on the
 * document root (`:root.dark` / `:root.light`), matching the theme stylesheets.
 *
 * On construction the service adopts a theme that is already there instead of
 * overwriting it: a `dark` / `light` class an app put on `<html>` before
 * bootstrap (the usual no-flash inline script) wins, then the mode persisted
 * under {@link ThemeService.STORAGE_KEY} from a previous visit, then the
 * dark-first default. `setTheme` persists the choice; `useSystemPreference`
 * follows the OS setting live until the next explicit `setTheme`.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /** localStorage key under which the chosen mode is persisted. */
  public static readonly STORAGE_KEY = 'lc-theme';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly destroyRef = inject(DestroyRef);

  // Meta theme-color values for mobile browser chrome — the app background of
  // each palette (`--color-background`), so the chrome continues the page.
  private static readonly META_COLOR: Record<ThemeMode, string> = {
    dark: '#0a121b',
    light: '#f3f4f6',
  };

  // Reactive theme state using Angular signals. Dark by default (DS 2.0).
  private readonly themeState = signal<ThemeState>({
    currentMode: 'dark',
    prefersDark: true,
  });

  // Public readonly signals (declared after themeState due to initialization dependency)
  public readonly currentTheme = this.themeState.asReadonly();
  public readonly isDark = computed(() => this.themeState().currentMode === 'dark');

  /** OS color-scheme query while `useSystemPreference()` is following it. */
  private systemQuery: MediaQueryList | null = null;
  private readonly systemChangeHandler = (event: MediaQueryListEvent): void => {
    this.themeState.update((state) => ({ ...state, prefersDark: event.matches }));
    this.applyMode(event.matches ? 'dark' : 'light');
  };

  constructor() {
    const initial = this.readInitialMode();
    this.themeState.update((state) => ({ ...state, currentMode: initial }));
    // Applying is idempotent for a class that is already on the root (the
    // pre-bootstrap case) and additionally syncs the meta theme-color.
    this.applyTheme(initial);
    this.destroyRef.onDestroy(() => this.stopFollowingSystem());
  }

  /**
   * Set the active theme mode. Persists the choice and stops following the
   * OS preference (an explicit choice must not be overridden by the next OS
   * change).
   */
  public setTheme(mode: ThemeMode): void {
    this.stopFollowingSystem();
    this.applyMode(mode);
    this.persist(mode);
  }

  /**
   * Toggle between dark and light.
   */
  public toggleTheme(): void {
    this.setTheme(this.themeState().currentMode === 'dark' ? 'light' : 'dark');
  }

  /**
   * Adopt the OS-level color-scheme preference and keep following it: a later
   * change of the OS setting switches the theme too, until `setTheme` is called.
   */
  public useSystemPreference(): void {
    if (!this.isBrowser) {
      return;
    }
    this.stopFollowingSystem();
    const query = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
    const prefersDark = query?.matches ?? true;
    this.themeState.update((state) => ({ ...state, prefersDark }));
    this.applyMode(prefersDark ? 'dark' : 'light');
    if (query) {
      this.systemQuery = query;
      query.addEventListener('change', this.systemChangeHandler);
    }
  }

  private stopFollowingSystem(): void {
    this.systemQuery?.removeEventListener('change', this.systemChangeHandler);
    this.systemQuery = null;
  }

  /** Update state + DOM without touching persistence or the system listener. */
  private applyMode(mode: ThemeMode): void {
    this.themeState.update((state) => ({ ...state, currentMode: mode }));
    this.applyTheme(mode);
  }

  /**
   * Mode to start with: a class already on the root, then the persisted
   * choice, then the dark-first default.
   */
  private readInitialMode(): ThemeMode {
    if (!this.isBrowser) {
      return 'dark';
    }
    const root = document.documentElement.classList;
    if (root.contains('light')) return 'light';
    if (root.contains('dark')) return 'dark';
    const persisted = this.readPersisted();
    return persisted ?? 'dark';
  }

  private readPersisted(): ThemeMode | null {
    try {
      const value = localStorage.getItem(ThemeService.STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      // Storage unavailable (privacy mode, sandboxed iframe, SSR): no persistence.
      return null;
    }
  }

  private persist(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(ThemeService.STORAGE_KEY, mode);
    } catch {
      // Storage unavailable or full — the in-memory theme still works.
    }
  }

  /**
   * Apply the theme class + mobile meta color to the document.
   */
  private applyTheme(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.classList.toggle('light', mode === 'light');

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', ThemeService.META_COLOR[mode]);
    }
  }
}
