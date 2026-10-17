import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonLinkComponent } from '@lifecorner/angular-ui-kit/button';
import { IconComponent, provideLcIcons } from '@lifecorner/angular-ui-kit/icon';
import { ICON_HOME_SOLID } from '@lifecorner/angular-ui-kit/icons';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';
import { SidenavPlaceholderComponent } from '@lifecorner/angular-ui-kit/sidenav-placeholder';

/**
 * 3.6 (request 002), rendered on the server: a registered glyph (AS-17), the
 * inert side-navigation placeholder (AS-18) and an inline link in running
 * text (AS-19). Secondary entries only.
 */
@Component({
  selector: 'lc-compat-36',
  imports: [ButtonLinkComponent, IconComponent, SidenavPlaceholderComponent],
  providers: [provideLcIcons([ICON_HOME_SOLID])],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-icon id="compat-registered" name="home" variant="solid" ariaLabel="Start" />
    <div style="height: 320px">
      <lc-sidenav-placeholder id="compat-sidenav-placeholder" [isOpen]="true" width="240px" [items]="nav" activeRoute="/household" />
    </div>
    <p>Mit der Anmeldung stimmst du der <a lcButton variant="link" [inline]="true" href="/de/datenschutz">Datenschutzerklärung</a> zu.</p>
  `,
})
export class Probe36 {
  protected readonly nav: NavigationItem[] = [
    { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
    { id: 'household', icon: 'home', label: 'Haushalt', route: '/household', displayOrder: 2 },
  ];
}
