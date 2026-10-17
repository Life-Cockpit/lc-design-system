import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import * as platformBrowser from '@angular/platform-browser';
import { provideClientHydration } from '@angular/platform-browser';
import { LC_LOGO_BASE_PATH } from '@lifecorner/angular-ui-kit';
import { routes } from './app.routes';

type HydrationFeature = Parameters<typeof provideClientHydration>[number];

/**
 * As life-os (ADR-0034): no inline script in the prerendered page, which
 * `script-src 'self'` would block. Angular 22 turns on incremental hydration
 * by default, and with it the inline event-replay script; Angular 21 has
 * neither the default nor `withNoIncrementalHydration`, hence the lookup.
 * (The critical-CSS inline script is off in angular.json: `inlineCritical`.)
 */
const withNoIncrementalHydration = (platformBrowser as unknown as Record<string, (() => HydrationFeature) | undefined>)[
  'withNoIncrementalHydration'
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(...(withNoIncrementalHydration ? [withNoIncrementalHydration()] : [])),
    // A root singleton provided through the PRIMARY entry; lc-logo from the
    // `/logo` entry must see it (AC-16).
    { provide: LC_LOGO_BASE_PATH, useValue: '/compat-logo' },
  ],
};
