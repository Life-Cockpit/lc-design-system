import { Routes } from '@angular/router';
import { HomePage } from './home';
import { TtShell } from './tt/tt-shell';
import { TtToday } from './tt/tt-today';
import { TtHousehold } from './tt/tt-household';
import { TtIcons } from './tt/tt-icons';
import { TtFetched } from './tt/tt-fetched';
import { TtCode } from './tt/tt-code';

export const routes: Routes = [
  { path: '', component: HomePage },
  {
    path: 'tt',
    component: TtShell,
    children: [
      { path: '', component: TtToday },
      { path: 'household', component: TtHousehold },
      { path: 'icons', component: TtIcons },
      { path: 'fetched', component: TtFetched },
      { path: 'code', component: TtCode },
    ],
  },
];
