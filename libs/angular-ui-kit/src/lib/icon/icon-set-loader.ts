import type { IconVariant } from './icon.component';

/**
 * The kit's whole 3.5.1 inline set, loaded lazily (3.6, AS-17).
 *
 * `lc-icon` asks for it only when a 3.5.1 inline name renders that nobody
 * registered and the app keeps `unregistered: 'load'` (the default). The
 * dynamic `import()` of the internal entry makes bundlers emit the set as a
 * separate chunk, fetched once per page; on the server it is read from the
 * server bundle. A failed import is forgotten, so the next icon tries again.
 *
 * @internal
 */
export interface LoadedIconSet {
  /** The markup of a glyph key (see `resolveInlineGlyph`) and variant. */
  svg(key: string, variant: IconVariant): string | undefined;
}

let loading: Promise<LoadedIconSet> | null = null;
let loaded: LoadedIconSet | null = null;

/** The set when it has loaded already (then icons render synchronously), else `null`. */
export function loadedIconSet(): LoadedIconSet | null {
  return loaded;
}

/** Loads the set once per page; concurrent callers share the request. */
export function loadIconSet(): Promise<LoadedIconSet> {
  if (!loading) {
    loading = import('@lifecorner/angular-ui-kit/internal/icon-set').then(
      ({ INLINE_ICON_SVGS, INLINE_TABLER_SVGS }) => {
        const set: LoadedIconSet = {
          svg: (key, variant) => INLINE_ICON_SVGS[key]?.[variant] ?? INLINE_TABLER_SVGS[key]?.[variant],
        };
        loaded = set;
        return set;
      },
      (error: unknown) => {
        loading = null;
        throw error;
      },
    );
  }
  return loading;
}

/**
 * Forgets the loaded set. Unit tests only.
 * @internal
 */
export function resetIconSet(): void {
  loading = null;
  loaded = null;
}
