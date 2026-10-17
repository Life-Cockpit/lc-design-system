import { bootstrapApplication } from '@angular/platform-browser';
import { Shell } from './app/shell';
import { appConfig } from './app/app.config';

bootstrapApplication(Shell, appConfig).catch((err) => console.error(err));
