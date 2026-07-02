/**
 * Alias map for non-Tabler icon names.
 *
 * `lc-icon` serves the **Tabler** icon set, but components across the ecosystem
 * frequently reference **Heroicon** (and a few Material Design) names, which use
 * different identifiers. Each entry here maps such an alias to its Tabler
 * equivalent so HTTP loading resolves correctly.
 *
 * This map is part of the public API so consumers can see exactly which
 * non-Tabler names are supported (and lint against them). Every key is also
 * included in {@link ICON_NAMES} as a valid `lc-icon` name.
 *
 * @see ICON_NAMES
 * @see isValidIconName
 */
export const ICON_ALIASES: Readonly<Record<string, string>> = {
  // ── Material Design aliases ──
  account_balance: 'building-bank',
  analytics: 'chart-line',
  notifications_active: 'bell-ringing',
  today: 'calendar',
  create: 'pencil',
  done: 'check',
  error: 'circle-x',
  run: 'play',
  copy: 'copy',

  // ── Heroicon → Tabler name map ──
  // Components reference Heroicon names, but the served icon set is Tabler,
  // which uses different names. Translate them here so HTTP loading resolves.
  'magnifying-glass': 'search',
  'cog-6-tooth': 'settings',
  'cog-8-tooth': 'settings',
  cog: 'settings',
  'x-mark': 'x',
  'x-circle': 'circle-x',
  'check-circle': 'circle-check',
  'information-circle': 'info-circle',
  'exclamation-circle': 'alert-circle',
  'exclamation-triangle': 'alert-triangle',
  'arrow-trending-up': 'trending-up',
  'arrow-trending-down': 'trending-down',
  'trending-up': 'trending-up',
  'trending-down': 'trending-down',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-down-tray': 'download',
  'arrow-up-tray': 'upload',
  'arrow-top-right-on-square': 'external-link',
  'arrows-pointing-out': 'arrows-maximize',
  'arrows-pointing-in': 'arrows-minimize',
  document: 'file',
  'document-text': 'file-text',
  'document-duplicate': 'copy',
  'clipboard-document': 'clipboard',
  'clipboard-document-check': 'clipboard-check',
  folder: 'folder',
  'folder-open': 'folder-open',
  envelope: 'mail',
  bell: 'bell',
  'bell-alert': 'bell-ringing',
  trash: 'trash',
  users: 'users',
  'user-group': 'users',
  'user-circle': 'user-circle',
  'credit-card': 'credit-card',
  'currency-dollar': 'currency-dollar',
  'globe-alt': 'world',
  'map-pin': 'map-pin',
  phone: 'phone',
  heart: 'heart',
  inbox: 'inbox',
  sparkles: 'sparkles',
  'shield-check': 'shield-check',
  truck: 'truck',
  'cloud-arrow-up': 'cloud-upload',
  'cloud-arrow-down': 'cloud-download',
  'eye-slash': 'eye-off',
  'lock-closed': 'lock',
  'lock-open': 'lock-open',
  locked: 'lock',
  identification: 'id',
  'chart-bar': 'chart-bar',
  'chart-bar-square': 'chart-bar',
  'chevron-up': 'chevron-up',
  'chevron-down': 'chevron-down',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'bars-3': 'menu-2',
  'bars-3-bottom-left': 'menu-2',
  'bars-3-bottom-right': 'menu-2',
  'ellipsis-horizontal': 'dots',
  'ellipsis-vertical': 'dots-vertical',
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  share: 'share',
  percent: 'percentage',
  'plus-circle': 'circle-plus',
  'minus-circle': 'circle-minus',
};
