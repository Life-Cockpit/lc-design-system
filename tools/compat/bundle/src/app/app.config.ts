import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

/** An app that opts into nothing (it builds against 3.5.1 too): every glyph renders as in 3.5.1. */
export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(withFetch())],
};
