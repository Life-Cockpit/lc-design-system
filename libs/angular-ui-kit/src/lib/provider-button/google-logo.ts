/**
 * Google's standard "G" for the Sign in with Google button.
 *
 * Source: the pre-approved Sign in with Google assets, Android + Web, SVG
 * "Theme=Light, Show text=No, Shape=Square" from
 * https://developers.google.com/static/identity/images/signin-assets.zip
 * (branding guidelines https://developers.google.com/identity/branding-guidelines,
 * last updated 2026-07-07, checked 2026-10-15). Only the "G" was kept — the
 * button outline and fill were removed — and rendered unchanged at 4× (80 × 80 px
 * for the 20 × 20 px the guidelines draw it at) with a transparent background.
 *
 * Google's rules: the "G" keeps its size and colours (no monochrome or
 * self-made version), sits on the light, dark or neutral button fill, and is
 * never shown without the button boundary and a text (or, icon-only, the
 * button boundary and an accessible name).
 *
 * Inlined as a data URI so the button makes no request to Google before the
 * person taps it (apps need `img-src data:` in their CSP).
 */
export const GOOGLE_G_LOGO_DATA_URI =
  'data:image/png;base64,' +
  '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' +
  '/3+zk3ZeOHg15AAAAABJRU5ErkJggg==';
