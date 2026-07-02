import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ICON_NAMES, ICON_ALIASES, isValidIconName } from './icon-catalog';
import { INLINE_ICON_SVGS } from './icon-inline-svgs';

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
      for (const name of ['x-mark', 'magnifying-glass', 'light-bulb', 'play-circle']) {
        expect(ICON_NAMES).toContain(name);
      }
    });

    it('excludes names that are not real Tabler icons', () => {
      for (const name of ['beaker', 'table-cells', 'cpu-chip', 'code-bracket', 'question-mark-circle']) {
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
});
