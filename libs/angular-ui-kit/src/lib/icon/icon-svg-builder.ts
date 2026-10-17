/**
 * The sink-free SVG builder of `lc-icon` (3.5, gap AS-14).
 *
 * Fetched icon files are not the kit's own strings, so they never go through
 * the `lc-icon` Trusted Types policy. Instead this strict tokenizer reads the
 * text and creates the `<svg>` with `createElementNS`, `setAttribute` and
 * `createTextNode` only — no HTML or XML parser, so no Trusted Types sink in
 * any browser. It accepts a small allow-list: basic shapes with paint and
 * geometry attributes (Tabler's files use only `svg` and `path`). Anything
 * else rejects the whole icon with a reason for the console, and `lc-icon`
 * shows its placeholder. The server renders the kit's bundled icons through
 * it too, so prerendered HTML and the browser carry the same SVG.
 *
 * @internal
 */

export const SVG_NS = 'http://www.w3.org/2000/svg';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';

/** Longest accepted input, in characters (Tabler's largest file has 2,666 bytes). */
export const MAX_SVG_LENGTH = 32_768;
const MAX_DEPTH = 16;

/** Elements an icon may contain; `svg` only as the root. Any other element rejects the icon. */
const ELEMENTS: ReadonlySet<string> = new Set([
  'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'text',
]);

/** Attributes that are kept (in source order); every other one is dropped silently. */
const ATTRIBUTES: ReadonlySet<string> = new Set([
  'viewBox', 'width', 'height', 'preserveAspectRatio', 'class',
  'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'pathLength',
  'fill', 'fill-rule', 'fill-opacity', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity',
  'opacity', 'color', 'vector-effect', 'shape-rendering',
  'text-anchor', 'dominant-baseline', 'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing',
]);

const NAMED_ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const ENTITY = /&(?:#x([0-9a-fA-F]{1,6})|#([0-9]{1,7})|(amp|lt|gt|quot|apos));/g;
const NAME = /[A-Za-z_][A-Za-z0-9_.:-]*/y;
const WHITESPACE = /[ \t\r\n]*/y;

/** The reasons `buildSvg` gives; they end up in the console warning. */
export const SVG_REJECTION = {
  tooLarge: 'it is larger than 32 KB',
  doctype: 'a DOCTYPE is not allowed',
  malformed: 'it is not well-formed',
  element: (name: string) => `<${name}> is not allowed`,
  attribute: (name: string) => `the attribute "${name}" is not allowed`,
  reference: (value: string) => `a reference to "${value}" is not allowed`,
} as const;

/** The built `<svg>`, or why the text was rejected. */
export type SvgBuildResult = { svg: SVGElement; reason?: undefined } | { svg?: undefined; reason: string };

class SvgRejected extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

/**
 * Builds an `<svg>` element of `doc` from SVG text, through the allow-list.
 * Never throws for bad input: the result names the reason instead.
 */
export function buildSvg(doc: Document, text: string): SvgBuildResult {
  if (text.length > MAX_SVG_LENGTH) return { reason: SVG_REJECTION.tooLarge };
  try {
    return { svg: new SvgBuilder(doc, text).build() };
  } catch (error) {
    if (error instanceof SvgRejected) return { reason: error.reason };
    throw error;
  }
}

/**
 * Whether the text is meant to be an SVG document (its first element is
 * `<svg>`), as opposed to an HTML page such as a SPA's `index.html` fallback.
 * Only decides which console message `lc-icon` prints; `buildSvg` decides
 * what renders.
 */
export function looksLikeSvgDocument(text: string): boolean {
  return /^\uFEFF?\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE[^[>]*(?:\[[\s\S]*?\])?\s*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s/>]/i.test(
    text,
  );
}

class SvgBuilder {
  private i = 0;

  constructor(
    private readonly doc: Document,
    private readonly text: string,
  ) {}

  build(): SVGElement {
    const { text } = this;
    if (text.charCodeAt(0) === 0xfeff) this.i = 1;
    if (text.startsWith('<?xml', this.i)) {
      const end = text.indexOf('?>', this.i);
      if (end < 0 || !/^<\?xml[ \t\r\n?]/.test(text.slice(this.i, this.i + 6))) this.reject(SVG_REJECTION.malformed);
      this.i = end + 2;
    }
    this.skipMisc();
    if (text[this.i] !== '<') this.reject(SVG_REJECTION.malformed);
    const root = this.element(1);
    this.skipMisc();
    if (this.i !== text.length) this.reject(SVG_REJECTION.malformed);
    return root;
  }

  /** Whitespace and comments around the root element; anything else that starts with `<!` or `<?` is rejected. */
  private skipMisc(): void {
    for (;;) {
      this.skipWhitespace();
      if (this.text.startsWith('<!--', this.i)) this.skipComment();
      else if (this.text.startsWith('<!', this.i) || this.text.startsWith('<?', this.i)) this.rejectMarkupDeclaration();
      else return;
    }
  }

  private skipComment(): void {
    const end = this.text.indexOf('-->', this.i + 4);
    if (end < 0) this.reject(SVG_REJECTION.malformed);
    this.i = end + 3;
  }

  private rejectMarkupDeclaration(): never {
    const head = this.text.slice(this.i, this.i + 9).toUpperCase();
    this.reject(head.startsWith('<!DOCTYPE') || head.startsWith('<!ENTITY') ? SVG_REJECTION.doctype : SVG_REJECTION.malformed);
  }

  private skipWhitespace(): boolean {
    WHITESPACE.lastIndex = this.i;
    WHITESPACE.exec(this.text);
    const moved = WHITESPACE.lastIndex > this.i;
    this.i = WHITESPACE.lastIndex;
    return moved;
  }

  private name(): string {
    NAME.lastIndex = this.i;
    const match = NAME.exec(this.text);
    if (!match) this.reject(SVG_REJECTION.malformed);
    this.i = NAME.lastIndex;
    return match[0];
  }

  /** One element and its content; the cursor is on its `<`. */
  private element(depth: number): SVGElement {
    const { text } = this;
    this.i++;
    const name = this.name();
    if (depth > MAX_DEPTH) this.reject(SVG_REJECTION.malformed);
    const isRoot = depth === 1;
    if (!ELEMENTS.has(name) || isRoot !== (name === 'svg')) this.reject(SVG_REJECTION.element(name));
    const element = this.doc.createElementNS(SVG_NS, name) as SVGElement;

    const seen = new Set<string>();
    let selfClosing = false;
    for (;;) {
      const separated = this.skipWhitespace();
      if (text.startsWith('/>', this.i)) {
        this.i += 2;
        selfClosing = true;
        break;
      }
      if (text[this.i] === '>') {
        this.i++;
        break;
      }
      if (!separated) this.reject(SVG_REJECTION.malformed);
      const attribute = this.name();
      this.skipWhitespace();
      if (text[this.i] !== '=') this.reject(SVG_REJECTION.malformed);
      this.i++;
      this.skipWhitespace();
      const quote = text[this.i];
      if (quote !== '"' && quote !== "'") this.reject(SVG_REJECTION.malformed);
      const end = text.indexOf(quote, this.i + 1);
      if (end < 0) this.reject(SVG_REJECTION.malformed);
      const raw = text.slice(this.i + 1, end);
      if (raw.includes('<')) this.reject(SVG_REJECTION.malformed);
      this.i = end + 1;
      if (seen.has(attribute)) this.reject(SVG_REJECTION.malformed);
      seen.add(attribute);
      // XML attribute-value normalisation: literal tabs and line breaks become spaces.
      this.attribute(element, attribute, this.decode(raw.replace(/[\t\r\n]/g, ' ')), isRoot);
    }

    if (!selfClosing) this.content(element, name, depth);
    return element;
  }

  private attribute(element: SVGElement, name: string, value: string, isRoot: boolean): void {
    const lower = name.toLowerCase();
    if (lower.startsWith('on')) this.reject(SVG_REJECTION.attribute(name));
    if (lower === 'href' || lower.endsWith(':href')) this.reject(SVG_REJECTION.reference(value));
    if (/url\s*\(|javascript:/i.test(value)) this.reject(SVG_REJECTION.reference(value));
    if (name === 'xmlns') {
      if (value !== SVG_NS) this.reject(SVG_REJECTION.malformed);
      if (isRoot) element.setAttributeNS(XMLNS_NS, 'xmlns', value);
      return;
    }
    if (ATTRIBUTES.has(name)) element.setAttribute(name, value);
  }

  /** Children and text up to the closing tag of `name`. */
  private content(element: SVGElement, name: string, depth: number): void {
    const { text } = this;
    for (;;) {
      if (this.i >= text.length) this.reject(SVG_REJECTION.malformed);
      if (text.startsWith('</', this.i)) {
        this.i += 2;
        const closing = this.name();
        this.skipWhitespace();
        if (closing !== name || text[this.i] !== '>') this.reject(SVG_REJECTION.malformed);
        this.i++;
        return;
      }
      if (text.startsWith('<!--', this.i)) {
        this.skipComment();
        continue;
      }
      if (text.startsWith('<!', this.i) || text.startsWith('<?', this.i)) this.rejectMarkupDeclaration();
      if (text[this.i] === '<') {
        element.appendChild(this.element(depth + 1));
        continue;
      }
      const next = text.indexOf('<', this.i);
      const end = next < 0 ? text.length : next;
      const value = this.decode(text.slice(this.i, end));
      this.i = end;
      // Text only inside <text>; elsewhere only whitespace, kept so the DOM
      // equals what an XML parser makes of the same string.
      if (name !== 'text' && /[^ \t\r\n]/.test(value)) this.reject(SVG_REJECTION.malformed);
      if (value) element.appendChild(this.doc.createTextNode(value));
    }
  }

  /** Resolves the five predefined entities and numeric references; any other `&` rejects the icon. */
  private decode(raw: string): string {
    if (!raw.includes('&')) return raw;
    if (raw.replace(ENTITY, '').includes('&')) this.reject(SVG_REJECTION.malformed);
    return raw.replace(ENTITY, (_, hex: string | undefined, dec: string | undefined, named: string | undefined) => {
      if (named) return NAMED_ENTITIES[named];
      const code = hex ? parseInt(hex, 16) : parseInt(dec ?? '', 10);
      if (!code || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) this.reject(SVG_REJECTION.malformed);
      return String.fromCodePoint(code);
    });
  }

  private reject(reason: string): never {
    throw new SvgRejected(reason);
  }
}
