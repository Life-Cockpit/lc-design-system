import type { BottomNavItem } from '@lifecorner/angular-ui-kit/bottom-nav';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';

/** The names of the 25 glyphs the F1 pages render (registered in app.config.icons.ts). */
export const F1_ICON_NAMES = [
  'home', 'sun', 'moon', 'users', 'user-plus', 'settings', 'logout', 'mail', 'key', 'password', 'shield-check',
  'device-mobile', 'device-desktop', 'device-laptop', 'copy', 'share', 'link', 'trash', 'calendar', 'check', 'plus',
  'pencil', 'clock', 'arrow-right', 'arrow-left',
];

export const F1_NAV: NavigationItem[] = [
  { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
  { id: 'household', icon: 'home', label: 'Haushalt', route: '/household', displayOrder: 2 },
  { id: 'settings', icon: 'settings', label: 'Einstellungen', route: '/settings', displayOrder: 3 },
];

export const F1_BOTTOM_NAV: BottomNavItem[] = [
  { id: 'today', label: 'Heute', icon: 'sun', route: '/' },
  { id: 'household', label: 'Haushalt', icon: 'home', route: '/household' },
  { id: 'settings', label: 'Einstellungen', icon: 'settings', route: '/settings' },
];
