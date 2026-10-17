/**
 * URL scheme checks shared by the components that put caller- or user-supplied
 * URLs into `href`, `src`, iframe or download attributes.
 *
 * Angular's own sanitizer already refuses `javascript:` in a bound `[href]` or
 * `[src]`, but a URL that reaches the DOM through `bypassSecurityTrust*`, a
 * hand-built HTML string or a programmatic `a.click()` never meets it. These
 * helpers are the check those paths apply instead — allow-lists, not
 * deny-lists, so an unknown scheme is refused rather than let through.
 */

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/** The URL's scheme, lower-cased, or null for a relative URL / fragment / query. */
export function urlScheme(url: string): string | null {
  return SCHEME.exec(url.trim())?.[1]?.toLowerCase() ?? null;
}

/** For `<a href>`: http(s), mailto, tel, or relative. */
export function isSafeLinkUrl(url: string): boolean {
  const scheme = urlScheme(url);
  return scheme === null || scheme === 'http' || scheme === 'https' || scheme === 'mailto' || scheme === 'tel';
}

/** For `<img src>`: everything a link may be, plus blob: and data: images. */
export function isSafeImageUrl(url: string): boolean {
  if (isSafeLinkUrl(url)) return true;
  const scheme = urlScheme(url);
  if (scheme === 'blob') return true;
  return scheme === 'data' && /^data:image\/(png|jpe?g|gif|webp|svg\+xml|avif|bmp);/i.test(url.trim());
}

/**
 * For iframes and programmatic downloads: http(s), blob:, data: PDFs, or
 * relative. Stricter than a link — an iframe navigates a whole browsing
 * context, and a download link is clicked without the user seeing it.
 */
export function isSafeResourceUrl(url: string): boolean {
  const scheme = urlScheme(url);
  if (scheme === null || scheme === 'http' || scheme === 'https' || scheme === 'blob') return true;
  return scheme === 'data' && /^data:application\/pdf[;,]/i.test(url.trim());
}
