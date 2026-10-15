import { compile } from 'sass';
import { resolve } from 'path';

/**
 * Page-title scale and classes (3.3, LK-2 / LK-3), read from the compiled
 * CSS (jsdom applies no stylesheets).
 */
const css = '\n' + compile(resolve(__dirname, '_typography.scss')).css;

/** Custom properties declared on :root, at the base or inside a min-width query. */
function rootTokens(minWidth?: number): Record<string, string> {
  let block: string;
  if (minWidth === undefined) {
    const start = css.indexOf('\n:root {');
    block = css.slice(start, css.indexOf('}', start));
  } else {
    const start = css.indexOf(`@media (min-width: ${minWidth}px) {\n  :root {`);
    expect(start).toBeGreaterThan(-1);
    block = css.slice(start, css.indexOf('}', start));
  }
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) tokens[match[1]] = match[2].trim();
  return tokens;
}

function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
}

/** The value a token has at a viewport width: the last step at or below it. */
function at(width: number, name: string): string {
  let value = rootTokens()[name];
  for (const step of [1024, 1280, 1440, 1920]) {
    if (step <= width && rootTokens(step)[name] !== undefined) value = rootTokens(step)[name];
  }
  return value;
}

describe('Typography scale (LK-2)', () => {
  it('adds the 72 px step', () => {
    expect(rootTokens()['--font-size-7xl']).toBe('4.5rem');
    expect(rootTokens()['--font-size-6xl']).toBe('3.75rem');
  });

  it.each([
    [360, '2.5rem'],
    [1024, '3.25rem'],
    [1280, '3.5rem'],
    [1440, 'var(--font-size-6xl)'],
    [1920, 'var(--font-size-7xl)'],
  ])('display is %s px wide: %s', (width, value) => {
    expect(at(width, '--font-size-display')).toBe(value);
  });

  it.each([
    [360, '2rem'],
    [1024, '2.5rem'],
    [1280, '2.5rem'],
    [1440, '2.75rem'],
    [1920, '3rem'],
  ])('title at %s px: %s', (width, value) => {
    expect(at(width, '--font-size-title')).toBe(value);
  });

  it.each([
    [360, '1.875rem'],
    [1024, '2.125rem'],
    [1920, '2.125rem'],
  ])('auth title at %s px: %s', (width, value) => {
    expect(at(width, '--font-size-auth-title')).toBe(value);
  });

  it.each([
    [360, '0.8125rem'],
    [1024, '0.875rem'],
    [1280, '0.875rem'],
    [1440, '0.9375rem'],
    [1920, '1rem'],
  ])('overline at %s px: %s', (width, value) => {
    expect(at(width, '--font-size-overline')).toBe(value);
  });

  it('tightens the display type from 1024 px', () => {
    expect(at(360, '--line-height-display')).toBe('1.05');
    expect(at(360, '--letter-spacing-display')).toBe('-0.035em');
    expect(at(1024, '--line-height-display')).toBe('1.02');
    expect(at(1024, '--letter-spacing-display')).toBe('-0.04em');
  });
});

describe('Page-title classes (LK-2, LK-3)', () => {
  it.each([
    ['.lc-display', 'display'],
    ['.lc-title', 'title'],
    ['.lc-auth-title', 'auth-title'],
  ])('%s uses the %s step in bold primary ink', (selector, step) => {
    const declarations = rule(selector);
    expect(declarations).toMatch(new RegExp(`font-size:\\s*var\\(--font-size-${step}\\)`));
    expect(declarations).toMatch(new RegExp(`line-height:\\s*var\\(--line-height-${step}\\)`));
    expect(declarations).toMatch(new RegExp(`letter-spacing:\\s*var\\(--letter-spacing-${step}\\)`));
    expect(declarations).toMatch(/font-weight:\s*var\(--font-weight-bold\)/);
    expect(declarations).toMatch(/color:\s*var\(--color-text-primary\)/);
    expect(declarations).not.toMatch(/margin/);
  });

  it('.lc-overline is uppercase through CSS in the overline ink', () => {
    const declarations = rule('.lc-overline');
    expect(declarations).toMatch(/font-size:\s*var\(--font-size-overline\)/);
    expect(declarations).toMatch(/letter-spacing:\s*var\(--letter-spacing-overline\)/);
    expect(declarations).toMatch(/text-transform:\s*uppercase/);
    expect(declarations).toMatch(/color:\s*var\(--color-overline\)/);
  });
});
