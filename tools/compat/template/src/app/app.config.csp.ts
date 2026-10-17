import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { LC_LOGO_BASE_PATH } from '@lifecorner/angular-ui-kit';
import { routes } from './app.routes';

/**
 * app.config.ts as life-os has it (ADR-0034), for the `csp` configuration
 * only: tools/compat/check-trusted-types.mjs serves that build under
 * `script-src 'self'`. Angular 22's default incremental hydration writes an
 * inline event-dispatch script, which the CSP would block, so it is off here.
 * (angular.json turns off the critical-CSS inline script: `inlineCritical`.)
 * Built for Angular 22 only; Angular 21 has no `withNoIncrementalHydration`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withNoIncrementalHydration()),
    { provide: LC_LOGO_BASE_PATH, useValue: '/compat-logo' },
  ],
};
