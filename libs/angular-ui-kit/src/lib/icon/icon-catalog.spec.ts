import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ICON_ALIASES, isInlineIconName } from './icon-catalog';
import { ICON_NAMES, isValidIconName } from '../icon-names/icon-names';
// 3.6 (AS-17): the maps moved to the lazy internal entry.
import { INLINE_ICON_SVGS, INLINE_TABLER_NAMES, INLINE_TABLER_SVGS } from '@lifecorner/angular-ui-kit/internal/icon-set';

describe('icon catalog', () => {
  describe('ICON_NAMES', () => {
    it('is a non-empty, sorted, de-duplicated list', () => {
      expect(ICON_NAMES.length).toBeGreaterThan(1000);
      const unique = new Set(ICON_NAMES);
      expect(unique.size).toBe(ICON_NAMES.length);
      const sorted = [...ICON_NAMES].sort();
      expect(ICON_NAMES).toEqual(sorted);
    });

    it('includes served Tabler names', () => {
      for (const name of ['flask', 'cpu', 'anchor', 'settings', 'search']) {
        expect(ICON_NAMES).toContain(name);
      }
    });

    it('includes documented aliases and inlined icons', () => {
      for (const name of [
        'x-mark',
        'magnifying-glass',
        'light-bulb',
        'play-circle',
        'cpu-chip',
        'clipboard-document-list',
        'archive-box',
      ]) {
        expect(ICON_NAMES).toContain(name);
      }
    });

    it('excludes Heroicon names that have no documented alias', () => {
      for (const name of ['beaker', 'table-cells', 'code-bracket', 'question-mark-circle']) {
        expect(ICON_NAMES).not.toContain(name);
      }
    });
  });

  describe('isValidIconName', () => {
    it('accepts Tabler names, aliases and inlined icons', () => {
      expect(isValidIconName('flask')).toBe(true);
      expect(isValidIconName('x-mark')).toBe(true);
      expect(isValidIconName('light-bulb')).toBe(true);
    });

    it('rejects unknown names', () => {
      expect(isValidIconName('beaker')).toBe(false);
      expect(isValidIconName('')).toBe(false);
      expect(isValidIconName('definitely-not-an-icon')).toBe(false);
    });
  });

  describe('drift guards', () => {
    it('every alias key is a valid icon name', () => {
      const missing = Object.keys(ICON_ALIASES).filter((k) => !isValidIconName(k));
      expect(missing).toEqual([]);
    });

    it('every inlined icon key is a valid icon name', () => {
      const missing = Object.keys(INLINE_ICON_SVGS).filter((k) => !isValidIconName(k));
      expect(missing).toEqual([]);
    });

    it('shipped icon-names.json matches ICON_NAMES (regenerate if this fails)', () => {
      const json = JSON.parse(
        readFileSync(resolve(__dirname, '../../assets/icon-names.json'), 'utf-8')
      ) as string[];
      expect(json).toEqual([...ICON_NAMES]);
    });
  });

  describe('isInlineIconName (3.3, G-7)', () => {
    it('is true for hand-picked inline icons by their alias names', () => {
      for (const name of ['x-mark', 'check-circle', 'information-circle', 'bars-3', 'globe-alt']) {
        expect(isInlineIconName(name)).toBe(true);
      }
    });

    it('is true for the inlined Tabler set and aliases that resolve to it', () => {
      for (const name of ['mail', 'users', 'settings', 'logout', 'key', 'envelope', 'x-circle', 'document-text']) {
        expect(isInlineIconName(name)).toBe(true);
      }
    });

    it('is false for fetched icons and variants without inline markup', () => {
      expect(isInlineIconName('anchor')).toBe(false);
      expect(isInlineIconName('robot', 'solid')).toBe(false);
      expect(isInlineIconName('definitely-not-an-icon')).toBe(false);
    });

    it('covers every icon the F1 concepts and the website name (website G-7, shell AS-6)', () => {
      const needed = [
        // website
        'mail', 'file-text', 'arrow-right', 'globe-alt', 'bars-3', 'x-mark', 'check-circle', 'document-duplicate', 'information-circle',
        // shell
        'users', 'settings', 'logout', 'dots', 'wifi-off', 'sun', 'home', 'clock', 'arrow-path', 'light-bulb', 'chevron-right', 'chevron-left', 'user',
        // sign-in, account settings, household
        'key', 'login', 'password', 'shield-check', 'robot', 'plug-connected', 'device-mobile', 'device-desktop', 'device-laptop',
        'copy', 'share', 'link', 'trash', 'plus', 'check', 'eye', 'user-plus', 'building-library',
        // the kit's own defaults
        'x-circle', 'exclamation-triangle', 'external-link',
      ];
      expect(needed.filter((name) => !isInlineIconName(name))).toEqual([]);
    });
  });

  describe('inlined Tabler set', () => {
    it('has outline markup for every listed name, all valid icon names', () => {
      expect(Object.keys(INLINE_TABLER_SVGS)).toEqual([...INLINE_TABLER_NAMES]);
      for (const name of INLINE_TABLER_NAMES) {
        expect(isValidIconName(name)).toBe(true);
        expect(INLINE_TABLER_SVGS[name].outline).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24"/);
      }
    });

    it('ships compact, class- and size-free markup (CSS sizes it)', () => {
      for (const variants of Object.values(INLINE_TABLER_SVGS)) {
        for (const svg of Object.values(variants)) {
          expect(svg).not.toMatch(/ class=| width=| height=|M0 0h24v24H0z|\n/);
        }
      }
    });

    it('matches the Tabler artwork it was generated from (regenerate if this fails)', () => {
      const file = readFileSync(
        resolve(__dirname, '../../../../../node_modules/@tabler/icons/icons/outline/mail.svg'),
        'utf-8',
      );
      for (const path of file.match(/<path d="[^"]+"/g) ?? []) {
        expect(INLINE_TABLER_SVGS['mail'].outline).toContain(path);
      }
    });
  });
});

