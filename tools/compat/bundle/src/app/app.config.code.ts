import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

/** 3.6.1 (AC-12): lc-code-block only on a lazy route (it builds against 3.6.0 too). */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter([{ path: '', loadComponent: () => import('./code-page').then((m) => m.CodePage) }]),
    provideHttpClient(withFetch()),
  ],
};
