import { INLINE_ICON_SVGS } from './icon-inline-svgs';
import { INLINE_TABLER_SVGS } from './icon-inline-tabler.data';
import { ICON_FALLBACK_SVG } from './icon-placeholder';

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
let bundled: ReadonlySet<string> | undefined;

/** Every SVG string the kit ships: the hand-picked set, the inlined Tabler set and the placeholder. */
export function bundledIconSvgs(): ReadonlySet<string> {
  if (!bundled) {
    const svgs = new Set<string>([ICON_FALLBACK_SVG]);
    for (const set of [INLINE_ICON_SVGS, INLINE_TABLER_SVGS]) {
      for (const variants of Object.values(set)) {
        for (const svg of Object.values(variants)) if (svg) svgs.add(svg);
      }
    }
    bundled = svgs;
  }
  return bundled;
}

/** The policy's rules: `createHTML` only, and only for the kit's own strings. */
export function iconPolicyRules(): IconPolicyRules {
  return {
    createHTML(input: string): string {
      if (typeof input === 'string' && bundledIconSvgs().has(input)) return input;
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
      state = { kind: 'ready', policy: factory.createPolicy(ICON_POLICY_NAME, iconPolicyRules()) };
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
}
