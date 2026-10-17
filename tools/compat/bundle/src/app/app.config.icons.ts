import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideLcIcons } from '@lifecorner/angular-ui-kit/icon';
import { F1_ICONS } from './f1-icons';

/** 3.6 (AS-17): the app registers the 25 glyphs it renders and never loads the kit's set. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter([]),
    provideHttpClient(withFetch()),
    provideLcIcons(F1_ICONS, { unregistered: 'placeholder' }),
  ],
};
