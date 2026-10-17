import { ICON_FALLBACK_SVG } from './icon-placeholder';
import { buildSvg } from './icon-svg-builder';

/**
 * The `lc-icon` Trusted Types policy (3.5, gap AS-14).
 *
 * Bundled icons are the kit's own SVG strings. In a browser with
 * `window.trustedTypes` they are parsed through exactly one policy, named
 * `lc-icon`, whose `createHTML` returns its input only when it is identical
 * to one of those strings and throws for anything else. The policy is created
 * on the first icon render, never at import time and never on the server, and
 * at most once per page: when the page's CSP refuses it, the kit says so once
 * and never asks again. Not exported from the entry.
 *
 * Since 3.6 (AS-17) the kit's strings are no longer all in the bundle. "The
 * kit's own strings" are those it was handed as glyphs — registered
 * `ICON_*` constants and the lazily loaded set — plus the placeholder, and
 * each of them must also pass the allow-list builder that fetched icons go
 * through. A registered string that fails it is never parsed.
 *
 * @internal
 */
export const ICON_POLICY_NAME = 'lc-icon';

/** The few Trusted Types shapes this module needs, declared locally (no dependency, no global types). */
export interface IconTrustedHtml {
  toString(): string;
}
export interface IconPolicyRules {
  createHTML(input: string): string;
}
interface IconPolicy {
  createHTML(input: string): IconTrustedHtml;
}
interface TrustedTypePolicyFactoryLike {
  createPolicy(name: string, rules: IconPolicyRules): IconPolicy;
}

/** What a page has: a policy, no Trusted Types at all, or a CSP that refused the policy. */
export type IconPolicyState = { kind: 'ready'; policy: IconPolicy } | { kind: 'none' } | { kind: 'refused' };

const NONE: IconPolicyState = { kind: 'none' };
const REFUSED: IconPolicyState = { kind: 'refused' };

export const ICON_POLICY_REFUSED_WARNING =
  '[lc-icon] Icons render a placeholder: the Trusted Types policy "lc-icon" could not be created. ' +
  'Add lc-icon to the trusted-types directive of the Content Security Policy.';

/** One state per page (keyed by its window). */
let states = new WeakMap<object, IconPolicyState>();
/** The strings the kit was handed as glyphs (registered or loaded), and the placeholder. */
let offered = new Set<string>([ICON_FALLBACK_SVG]);
/** The allow-list builder's verdict per offered string, checked once. */
let verdicts = new Map<string, boolean>();

/** Hands glyph markup to the policy: a registered constant or a string of the loaded kit set. */
export function offerIconSvgs(svgs: Iterable<string>): void {
  for (const svg of svgs) offered.add(svg);
}

/** Every SVG string the kit was handed so far: registered glyphs, the loaded set and the placeholder. */
export function bundledIconSvgs(): ReadonlySet<string> {
  return offered;
}

/**
 * Whether `svg` may be parsed: it was handed to the kit as a glyph and the
 * allow-list builder accepts it (same rules as a fetched icon).
 */
export function isAdmittedIconSvg(doc: Document, svg: string): boolean {
  if (typeof svg !== 'string' || !offered.has(svg)) return false;
  let ok = verdicts.get(svg);
  if (ok === undefined) {
    ok = buildSvg(doc, svg).svg !== undefined;
    verdicts.set(svg, ok);
  }
  return ok;
}

/** The policy's rules: `createHTML` only, and only for the kit's own strings. */
export function iconPolicyRules(doc?: Document): IconPolicyRules {
  return {
    createHTML(input: string): string {
      const owner = doc ?? (typeof document === 'undefined' ? undefined : document);
      if (owner && isAdmittedIconSvg(owner, input)) return input;
      throw new TypeError('lc-icon: not a bundled icon');
    },
  };
}

/**
 * The page's policy state, creating the policy on the first call in a
 * browser that has Trusted Types. Feature-detected through the window, so
 * it is safe without Trusted Types, in jsdom and in Angular 21 apps.
 */
export function iconPolicy(win: Window | null): IconPolicyState {
  if (!win) return NONE;
  const known = states.get(win);
  if (known) return known;
  const factory = (win as unknown as { trustedTypes?: TrustedTypePolicyFactoryLike }).trustedTypes;
  let state: IconPolicyState = NONE;
  if (factory && typeof factory.createPolicy === 'function') {
    try {
      state = { kind: 'ready', policy: factory.createPolicy(ICON_POLICY_NAME, iconPolicyRules(win.document)) };
    } catch {
      state = REFUSED;
      console.warn(ICON_POLICY_REFUSED_WARNING);
    }
  }
  states.set(win, state);
  return state;
}

/**
 * Forgets the policy state of every page. Unit tests only (a real page must
 * never create the policy twice).
 * @internal
 */
export function resetIconPolicy(): void {
  states = new WeakMap();
  offered = new Set([ICON_FALLBACK_SVG]);
  verdicts = new Map();
}
