import type { Router } from '@angular/router';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';

/**
 * The side navigation's current-item rules (3.5, AS-16), moved out of
 * `lc-sidenav` unchanged (3.6, AS-18) so `lc-sidenav-placeholder` expands the
 * same groups before the sidenav has loaded.
 *
 * @internal
 */

/** The items sorted by `displayOrder`. */
export function sortNavigationItems(items: readonly NavigationItem[]): NavigationItem[] {
  return [...items].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Every item rendered as a link, in display order (depth first): simple
 * items, the children of a group, the children of a section, and the
 * children of a section's sub-group.
 */
export function navigationLinks(sortedItems: readonly NavigationItem[]): NavigationItem[] {
  const links: NavigationItem[] = [];
  for (const item of sortedItems) {
    if (item.isSection) {
      for (const child of item.children ?? []) {
        if (child.children?.length) links.push(...child.children);
        else links.push(child);
      }
    } else if (item.children?.length) {
      links.push(...item.children);
    } else {
      links.push(item);
    }
  }
  return links;
}

/** The router URL's path: primary outlet only, no query, fragment or matrix parameters. */
export function navigationPath(router: Pick<Router, 'parseUrl'>, url: string): string {
  const segments = router.parseUrl(url).root.children['primary']?.segments ?? [];
  return `/${segments.map((segment) => segment.path).join('/')}`;
}

/**
 * The one current link (or none). With `activeRoute` set: the first link
 * whose route equals it. Without: the router's path — the exact match wins,
 * otherwise the longest link route the path continues with a `/` (`/`
 * matches only `/`); ties go to the first link in display order.
 */
export function currentNavigationItem(
  links: readonly NavigationItem[],
  activeRoute: string,
  path: string,
): NavigationItem | null {
  if (activeRoute !== '') return links.find((link) => link.route === activeRoute) ?? null;
  const exact = links.find((link) => link.route === path);
  if (exact) return exact;
  let best: NavigationItem | null = null;
  for (const link of links) {
    const route = link.route;
    if (!route || route === '/' || !path.startsWith(`${route}/`)) continue;
    if (!best || route.length > best.route.length) best = link;
  }
  return best;
}

/** Ids of the collapsible parents (top-level groups, section sub-groups) that contain the current item. */
export function currentItemParents(items: readonly NavigationItem[], current: NavigationItem | null): string[] {
  const ids: string[] = [];
  if (!current) return ids;
  for (const item of items) {
    const collapsibles = item.isSection ? (item.children ?? []) : [item];
    for (const parent of collapsibles) {
      if (parent.children?.includes(current)) {
        ids.push(parent.id);
      }
    }
  }
  return ids;
}
