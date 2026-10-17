import { Routes } from '@angular/router';
import { Shell } from './shell';

/** An eager shell (the F1 set) and a lazy route that takes other kit parts with it (request 001, AC-17). */
export const routes: Routes = [
  { path: '', component: Shell },
  { path: 'reports', loadComponent: () => import('./reports').then((m) => m.Reports) },
];
