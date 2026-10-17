import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AlertComponent } from '@lifecorner/angular-ui-kit/alert';
import { AppPageComponent, AppShellComponent } from '@lifecorner/angular-ui-kit/app-shell';
import { BottomNavComponent, type BottomNavItem } from '@lifecorner/angular-ui-kit/bottom-nav';
import { ButtonComponent } from '@lifecorner/angular-ui-kit/button';
import { HeaderComponent } from '@lifecorner/angular-ui-kit/header';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';
import { NextStepCardComponent } from '@lifecorner/angular-ui-kit/next-step-card';
import { SidenavComponent } from '@lifecorner/angular-ui-kit/sidenav';
import { F1_ICON_NAMES, F1_NAV, F1_BOTTOM_NAV } from './f1-page';

/**
 * The F1 shell (request 002, AC-1 and AC-8): header, docked side navigation,
 * page, bottom bar, and the 25 glyphs the F1 pages render. The side
 * navigation is eager here; shell.defer.ts defers it.
 */
@Component({
  selector: 'lc-bundle-root',
  imports: [
    AlertComponent, AppPageComponent, AppShellComponent, BottomNavComponent, ButtonComponent, HeaderComponent,
    IconComponent, NextStepCardComponent, SidenavComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-app-shell>
      <lc-header shell-header variant="transparent" title="Produkt" titleTag="span" userMenuTrigger="avatar" userName="Johanna Apfelbaum" />
      <lc-sidenav shell-nav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0" variant="transparent"
                  ariaLabel="Hauptnavigation" [items]="nav" activeRoute="/" />
      <lc-app-page>
        <lc-alert variant="info" title="Hinweis" [dismissible]="true">Text</lc-alert>
        <lc-next-step-card cardTitle="Nächster Schritt" message="Weiter" primaryLabel="Los" />
        <lc-button variant="primary">Speichern</lc-button>
        @for (name of icons; track name) {
          <lc-icon [name]="name" [ariaLabel]="name" />
        }
      </lc-app-page>
      <lc-bottom-nav shell-bottom-nav [items]="bottomNav" activeRoute="/" ariaLabel="Hauptnavigation unten" />
    </lc-app-shell>
  `,
})
export class Shell {
  protected readonly icons = F1_ICON_NAMES;
  protected readonly nav: NavigationItem[] = F1_NAV;
  protected readonly bottomNav: BottomNavItem[] = F1_BOTTOM_NAV;
}
