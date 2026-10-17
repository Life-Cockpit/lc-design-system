/**
 * Visible placeholder rendered when an icon cannot be resolved (unknown name,
 * failed asset load, a dropped response, or a Trusted Types policy the page
 * refused). Deliberately distinct from any real icon — a dashed frame with a
 * "?" — so missing icons are immediately obvious instead of showing an empty
 * space or an ambiguous glyph.
 *
 * @internal
 */
export const ICON_FALLBACK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
  '<rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke-dasharray="2.5 2.5" />' +
  '<text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" font-family="system-ui, -apple-system, sans-serif" fill="currentColor" stroke="none">?</text>' +
  '</svg>';
