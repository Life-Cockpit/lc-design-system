import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { LC_LOGO_BASE_PATH } from '@lifecorner/angular-ui-kit';
import { routes } from './app.routes';

/**
 * Angular's defaults, as an existing consumer has them (Angular 22: incremental
 * hydration). The `csp` configuration swaps in app.config.csp.ts.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(),
    // A root singleton provided through the PRIMARY entry; lc-logo from the
    // `/logo` entry must see it (AC-16).
    { provide: LC_LOGO_BASE_PATH, useValue: '/compat-logo' },
  ],
};
