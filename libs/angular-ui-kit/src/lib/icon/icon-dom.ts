import { buildSvg } from './icon-svg-builder';
import { ICON_FALLBACK_SVG } from './icon-placeholder';
import { iconPolicy, resetIconPolicy } from './icon-trusted-types';

/**
 * How `lc-icon` turns markup into DOM (3.5, gap AS-14). Every `<svg>` is a
 * fresh element that the component appends to its container; there is no
 * HTML binding and no sanitizer bypass.
 *
 * | Source            | Server  | Browser without Trusted Types | Browser with the policy        | Policy refused |
 * |-------------------|---------|-------------------------------|--------------------------------|----------------|
 * | bundled constant  | builder | XML parse of the constant     | XML parse of `createHTML(…)`   | placeholder (builder) |
 * | fetched text      | —       | builder                       | builder                        | builder        |
 *
 * @internal
 */

/** The parsed bundled constants of each page, cloned per instance (the policy runs once per distinct icon). */
let parsed = new WeakMap<Document, Map<string, SVGElement>>();

/**
 * A bundled SVG constant as a fresh `<svg>` of `doc`, for the browser. `null`
 * when the page refused the `lc-icon` policy (the caller shows the
 * placeholder through the builder) or the constant would not parse.
 */
export function parseBundledSvg(doc: Document, markup: string): SVGElement | null {
  const state = iconPolicy(doc.defaultView);
  if (state.kind === 'refused') return null;
  let cache = parsed.get(doc);
  if (!cache) parsed.set(doc, (cache = new Map()));
  let template = cache.get(markup);
  if (!template) {
    if (typeof DOMParser === 'undefined') return buildSvg(doc, markup).svg ?? null;
    // With Trusted Types the parser only takes the policy's TrustedHTML; the
    // policy hands back nothing but the kit's own strings.
    const input = state.kind === 'ready' ? state.policy.createHTML(markup) : markup;
    const xml = new DOMParser().parseFromString(input as string, 'image/svg+xml');
    const root = xml.documentElement;
    if (root.nodeName !== 'svg' || xml.getElementsByTagName('parsererror').length > 0) return null;
    template = doc.importNode(root, true) as unknown as SVGElement;
    cache.set(markup, template);
  }
  return template.cloneNode(true) as SVGElement;
}

/** The placeholder as a fresh `<svg>`: parsed like a bundled icon in the browser, built everywhere else. */
export function placeholderSvg(doc: Document, browser: boolean): SVGElement {
  return (browser ? parseBundledSvg(doc, ICON_FALLBACK_SVG) : null) ?? (buildSvg(doc, ICON_FALLBACK_SVG).svg as SVGElement);
}

/** What the component applies to its `<svg>`; consumer values reach attributes and `style.color` only. */
export interface IconDecoration {
  size: string;
  color: string;
  decorative: boolean;
  label: string | undefined;
}

/** Sets size, colour and accessibility on the element in place (the order 3.4 used). */
export function decorateSvg(svg: SVGElement, decoration: IconDecoration): void {
  svg.setAttribute('width', decoration.size);
  svg.setAttribute('height', decoration.size);
  const style = (svg as Partial<ElementCSSInlineStyle>).style;
  if (style) style.color = decoration.color;
  if (decoration.decorative) {
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('role');
    svg.removeAttribute('aria-label');
  } else {
    svg.setAttribute('role', 'img');
    svg.removeAttribute('aria-hidden');
    if (decoration.label) svg.setAttribute('aria-label', decoration.label);
    else svg.removeAttribute('aria-label');
  }
}

/**
 * Forgets the parsed constants and the policy state. Unit tests only.
 * @internal
 */
export function resetIconRendering(): void {
  parsed = new WeakMap();
  resetIconPolicy();
}
