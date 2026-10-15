import { compile } from 'sass';
import { join } from 'path';

/**
 * 3.3 (AC-10): lc-list texts wrap long unbroken values (an e-mail address, a
 * device name) instead of overflowing the row. jsdom applies no stylesheets,
 * so the contract is read from the compiled CSS.
 */
describe('lc-list text styles (AC-10)', () => {
  const css = compile(join(__dirname, 'list.component.scss'), {
    loadPaths: [join(__dirname, '../../styles')],
  }).css;
  const rule = (selector: string): string => {
    const start = css.indexOf(`${selector} {`);
    expect(start).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
  };

  it.each(['.lc-list__label', '.lc-list__subtitle', '.lc-list__description'])(
    '%s wraps anywhere',
    (selector) => {
      expect(rule(selector)).toMatch(/overflow-wrap:\s*anywhere/);
    },
  );

  it('lets the label shrink inside its row', () => {
    expect(rule('.lc-list__label')).toMatch(/min-width:\s*0/);
  });
});
