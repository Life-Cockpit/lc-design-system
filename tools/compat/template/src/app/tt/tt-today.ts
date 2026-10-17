import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
// Root singletons from the PRIMARY entry (AC-16): the toast must show in the
// outlet from `/toast`, the theme must reach lc-header from `/header`.
import { ThemeService, ToastService } from '@lifecorner/angular-ui-kit';
import { AlertComponent } from '@lifecorner/angular-ui-kit/alert';
import { AvatarComponent } from '@lifecorner/angular-ui-kit/avatar';
import { AvatarGroupComponent } from '@lifecorner/angular-ui-kit/avatar-group';
import { BadgeComponent } from '@lifecorner/angular-ui-kit/badge';
import { ButtonComponent, ButtonLinkComponent } from '@lifecorner/angular-ui-kit/button';
import { CardComponent } from '@lifecorner/angular-ui-kit/card';
import { ConfirmService } from '@lifecorner/angular-ui-kit/confirm-dialog';
import { ContainerComponent } from '@lifecorner/angular-ui-kit/container';
import { DescriptionListComponent, type DescriptionListItem } from '@lifecorner/angular-ui-kit/description-list';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';
import { ListComponent, type ListItem } from '@lifecorner/angular-ui-kit/list';
import { LogoComponent } from '@lifecorner/angular-ui-kit/logo';
import { ModalComponent } from '@lifecorner/angular-ui-kit/modal';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';
import { NextStepCardComponent } from '@lifecorner/angular-ui-kit/next-step-card';
import { PageHeaderComponent } from '@lifecorner/angular-ui-kit/page-header';
import { SidenavComponent } from '@lifecorner/angular-ui-kit/sidenav';
import { SkeletonComponent } from '@lifecorner/angular-ui-kit/skeleton';

/** Today (`/tt`): the F1 display components, the overlays and the drawer navigation. */
@Component({
  selector: 'tt-today',
  imports: [
    AlertComponent, AvatarComponent, AvatarGroupComponent, BadgeComponent, ButtonComponent, ButtonLinkComponent,
    CardComponent, ContainerComponent, DescriptionListComponent, IconComponent, ListComponent, LogoComponent,
    ModalComponent, NextStepCardComponent, PageHeaderComponent, SidenavComponent, SkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-page-header size="display" overline="Donnerstag, 15. Oktober" title="Guten Abend, Johanna" />
    <lc-container>
      <lc-alert variant="info" title="Hinweis" id="tt-alert">Die Verbindung zu deiner Bank läuft am 30. Oktober ab.</lc-alert>
      <lc-next-step-card variant="soft" tone="primary" cardTitle="Lena möchte beitreten" message="per E-Mail"
                         primaryLabel="Ansehen" />
      <lc-card title="Haushalt" subtitle="2 Mitglieder">
        <lc-avatar-group [avatars]="[{ name: 'Johanna Apfelbaum' }, { name: 'Tom Ek' }]" />
        <lc-avatar name="Tom Ek" />
        <lc-badge variant="success">Neu</lc-badge>
      </lc-card>
      <lc-list [items]="listItems" />
      <lc-description-list [items]="dlItems" />
      <lc-skeleton width="200px" />
      <lc-logo id="tt-logo" />
      <!-- lc-icon renders a <div>: inside a <p> the HTML parser would close the
           paragraph early and the prerendered DOM would not hydrate (NG0502). -->
      <div><lc-icon name="shield-check" ariaLabel="Geschützt" /> <lc-icon name="clock" [decorative]="true" /></div>
      <lc-button id="tt-open-modal" variant="primary" (click)="modalOpen.set(true)">Dialog öffnen</lc-button>
      <lc-button id="tt-open-confirm" variant="outline" (click)="confirm()">Bestätigen</lc-button>
      <lc-button id="tt-show-toast" variant="ghost" (click)="toast()">Toast zeigen</lc-button>
      <lc-button id="tt-open-drawer" variant="ghost" (click)="drawerOpen.set(true)">Navigation öffnen</lc-button>
      <lc-button id="tt-theme-dark" variant="ghost" (click)="dark()">Dunkel</lc-button>
      <a lcButton variant="primary" href="/tt/household" id="tt-link-button">Zum Haushalt</a>
    </lc-container>
    <lc-modal title="Mitglied einladen" [open]="modalOpen()" (openChange)="modalOpen.set($event)">
      <p>Die Einladung gilt sieben Tage.</p>
    </lc-modal>
    <lc-sidenav id="tt-drawer" mode="drawer" [isOpen]="drawerOpen()" [mobileBreakpoint]="0" ariaLabel="Navigation (Schublade)"
                closeAriaLabel="Navigation schließen" [items]="drawerItems" activeRoute="/tt" (closed)="drawerOpen.set(false)" />
  `,
})
export class TtToday {
  private readonly toastService = inject(ToastService);
  private readonly themeService = inject(ThemeService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly modalOpen = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly listItems: ListItem[] = [{ id: '1', label: 'Strom', subtitle: 'läuft' }];
  protected readonly dlItems: DescriptionListItem[] = [{ term: 'Status', value: 'aktiv' }];
  protected readonly drawerItems: NavigationItem[] = [
    { id: 'today', icon: 'sun', label: 'Heute', route: '/tt', displayOrder: 1 },
    { id: 'household', icon: 'home', label: 'Haushalt', route: '/tt/household', displayOrder: 2 },
  ];

  protected confirm(): void {
    void this.confirmService.confirm({ title: 'Einladung zurückziehen?', message: 'Lena bekommt keinen Zugang.', confirmLabel: 'Zurückziehen', cancelLabel: 'Abbrechen' });
  }

  protected toast(): void {
    this.toastService.show({ message: 'Gespeichert', variant: 'success' });
  }

  protected dark(): void {
    this.themeService.setTheme('dark');
  }
}
