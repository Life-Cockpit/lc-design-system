import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AlertComponent } from '@lifecorner/angular-ui-kit/alert';
import { AppPageComponent, AppShellComponent } from '@lifecorner/angular-ui-kit/app-shell';
import { BottomNavComponent, type BottomNavItem } from '@lifecorner/angular-ui-kit/bottom-nav';
import { ButtonComponent } from '@lifecorner/angular-ui-kit/button';
import { ContainerComponent } from '@lifecorner/angular-ui-kit/container';
import { FooterComponent } from '@lifecorner/angular-ui-kit/footer';
import { HeaderComponent } from '@lifecorner/angular-ui-kit/header';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';
import { NextStepCardComponent } from '@lifecorner/angular-ui-kit/next-step-card';
import { PageHeaderComponent } from '@lifecorner/angular-ui-kit/page-header';
import { SidenavComponent } from '@lifecorner/angular-ui-kit/sidenav';
import { SkeletonComponent } from '@lifecorner/angular-ui-kit/skeleton';
import { ToastOutletComponent } from '@lifecorner/angular-ui-kit/toast';

/** The F1 shell set (AC-17), imported from secondary entries only; the eager route. */
@Component({
  selector: 'lc-entries-shell',
  imports: [
    AlertComponent, AppPageComponent, AppShellComponent, BottomNavComponent, ButtonComponent, ContainerComponent,
    FooterComponent, HeaderComponent, IconComponent, NextStepCardComponent, PageHeaderComponent, SidenavComponent,
    SkeletonComponent, ToastOutletComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-app-shell>
      <lc-header shell-header variant="transparent" title="Produkt" titleTag="span" userMenuTrigger="avatar" userName="Johanna Apfelbaum" />
      <lc-sidenav shell-nav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0" variant="transparent"
                  ariaLabel="Hauptnavigation" [items]="nav" activeRoute="/" />
      <lc-app-page>
        <lc-container>
          <lc-page-header title="Guten Abend" />
          <lc-alert variant="info" title="Hinweis">Text</lc-alert>
          <lc-next-step-card cardTitle="Nächster Schritt" message="Weiter" primaryLabel="Los" />
          <lc-skeleton />
          <lc-button variant="primary">Speichern</lc-button>
          <lc-icon name="sun" ariaLabel="Heute" />
        </lc-container>
      </lc-app-page>
      <lc-footer shell-footer copyright="© 2026" />
      <lc-bottom-nav shell-bottom-nav [items]="bottomNav" activeRoute="/" ariaLabel="Hauptnavigation unten" />
    </lc-app-shell>
    <lc-toast-outlet />
  `,
})
export class Shell {
  protected readonly nav: NavigationItem[] = [
    { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
    { id: 'reports', icon: 'chart-bar', label: 'Berichte', route: '/reports', displayOrder: 2 },
  ];
  protected readonly bottomNav: BottomNavItem[] = [
    { id: 'today', label: 'Heute', icon: 'sun', route: '/' },
    { id: 'reports', label: 'Berichte', icon: 'chart-bar', route: '/reports' },
  ];
}
