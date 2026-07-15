import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  computed,
  signal,
  untracked,
  HostListener,
} from '@angular/core';

// ── Public types ─────────────────────────────────────────────────────────────

export type DependencyNodeStatus = 'default' | 'active' | 'success' | 'warning' | 'error' | 'muted';
export type DependencyDirection = 'horizontal' | 'vertical';
export type DependencyRelation = 'depends' | 'blocks' | 'references' | 'requires' | 'extends' | 'implements' | 'uses';

export interface DependencyEdgeDef {
  /** Target node id */
  id: string;
  /** Relationship type — drives edge colour and dash style */
  relation?: DependencyRelation;
  /**
   * Free-form edge label, for graphs whose relationship vocabulary is wider than
   * `DependencyRelation` (e.g. `CALLS`, `HAS_COLUMN`, `AUTHORED_BY`). Shown
   * verbatim instead of the `relation` label; colouring still follows `relation`,
   * which may be omitted for a generic look.
   */
  relationLabel?: string;
}

export interface DependencyNode {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon name */
  icon?: string;
  /** Visual status / color */
  status?: DependencyNodeStatus;
  /**
   * Category of the node (e.g. `Class`, `Table`, `Feature`). Colours the node via
   * the `typeColors` input and drives the type legend. Takes precedence over
   * `status` for the fill; `status` still applies when no type colour resolves.
   */
  type?: string;
  /**
   * Number of neighbours that exist but aren't part of `children` — rendered as a
   * "+N" marker. Use when a node's neighbourhood is capped (god nodes) so the
   * truncation is visible instead of silent.
   */
  moreCount?: number;
  /** Child nodes: items this node is required for (right / bottom side) */
  children?: DependencyNode[];
  /** Dependencies: items this node depends on (shown as cross-reference edges) */
  dependsOn?: DependencyEdgeDef[];
  /**
   * Opaque payload. Never read or interpreted by the component; handed back
   * unchanged on `nodeSelect` / `nodeExpand` so callers can carry their own
   * metadata (keys, labels, file paths, …) through the viewer.
   */
  data?: Record<string, unknown>;
}

// ── Layout types ─────────────────────────────────────────────────────────────

interface LayoutNode {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  status: DependencyNodeStatus;
  type?: string;
  moreCount?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  parentId: string | null;
  incomingCount: number;
  outgoingCount: number;
}

interface LayoutEdge {
  id: string;
  path: string;
  sourceId: string;
  targetId: string;
  relation?: DependencyRelation;
  /** Resolved display label (free-form `relationLabel` wins over the relation's) */
  label?: string;
  labelX: number;
  labelY: number;
  color: string;
  dashed: boolean;
  isCrossRef: boolean;
  /** Arrow marker id suffix — always a known relation, so the marker resolves */
  marker: DependencyRelation;
}

// ── Constants ────────────────────────────────────────────────────────────────

const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;
const H_GAP = 80;
const V_GAP = 24;
/** How far a bowed edge clears the row/column it loops across. */
const BACK_EDGE_BOW = 36;
/** Points sampled along a curve when testing it against the node boxes. */
const ROUTE_SAMPLES = 24;
/** Ignore grazing the very edge of a box — only a real incursion counts. */
const ROUTE_INSET = 3;

const RELATION_STYLES: Record<DependencyRelation, { color: string; dashed: boolean; label: string }> = {
  depends:    { color: 'var(--color-neutral-400)',  dashed: false, label: 'depends on' },
  blocks:     { color: 'var(--color-error-default)', dashed: false, label: 'blocks' },
  references: { color: 'var(--color-info-default, #3b82f6)', dashed: true,  label: 'references' },
  requires:   { color: 'var(--color-warning-default)', dashed: false, label: 'requires' },
  extends:    { color: 'var(--color-primary-400)',  dashed: true,  label: 'extends' },
  implements: { color: 'var(--color-success-default)', dashed: true,  label: 'implements' },
  uses:       { color: 'var(--color-neutral-300)',  dashed: true,  label: 'uses' },
};

// ── Layout algorithm ─────────────────────────────────────────────────────────

interface TreeMeasure {
  node: DependencyNode;
  primary: number;
  secondary: number;
  children: TreeMeasure[];
  depth: number;
}

/** A `children` link that couldn't be laid out as a tree edge (cycle or second parent). */
interface BackEdge {
  from: string;
  to: string;
}

/**
 * Measures the tree, treating the input as a *graph*: `visited` guards against a
 * node being laid out twice.
 *
 * Two cases route through it, and both are normal in a graph rather than a strict
 * tree: a cycle (a → b → a), which would otherwise recurse until the stack blows,
 * and a node reachable from two parents, which would otherwise be drawn twice at
 * two positions. Either way the node already has a place in the layout, so the
 * link is recorded as a back edge and later drawn as a cross-reference arrow.
 */
function measureTree(
  node: DependencyNode,
  depth: number,
  dir: DependencyDirection,
  visited: Set<string>,
  backEdges: BackEdge[],
): TreeMeasure {
  visited.add(node.id);

  const children: TreeMeasure[] = [];
  for (const child of node.children || []) {
    if (visited.has(child.id)) {
      backEdges.push({ from: node.id, to: child.id });
      continue;
    }
    children.push(measureTree(child, depth + 1, dir, visited, backEdges));
  }

  const nodePrimary = dir === 'horizontal' ? NODE_WIDTH : NODE_HEIGHT;
  const nodeSecondary = dir === 'horizontal' ? NODE_HEIGHT : NODE_WIDTH;

  if (children.length === 0) {
    return { node, primary: nodePrimary, secondary: nodeSecondary, children, depth };
  }

  const totalChildSecondary = children.reduce((sum, c) => sum + c.secondary, 0)
    + (children.length - 1) * V_GAP;
  const maxChildPrimary = Math.max(...children.map(c => c.primary));

  return {
    node,
    primary: nodePrimary + H_GAP + maxChildPrimary,
    secondary: Math.max(nodeSecondary, totalChildSecondary),
    children,
    depth,
  };
}

function layoutTreeH(
  measure: TreeMeasure, x: number, y: number, parentId: string | null,
  nodes: LayoutNode[], edges: LayoutEdge[], allNodes: Map<string, DependencyNode>,
  nodeMap: Map<string, LayoutNode>,
): void {
  const nodeY = y + measure.secondary / 2 - NODE_HEIGHT / 2;
  const orig = allNodes.get(measure.node.id);

  const laid: LayoutNode = {
    id: measure.node.id, label: measure.node.label, description: measure.node.description,
    icon: measure.node.icon, status: measure.node.status || 'default',
    type: measure.node.type, moreCount: measure.node.moreCount,
    x, y: nodeY, width: NODE_WIDTH, height: NODE_HEIGHT, depth: measure.depth, parentId,
    incomingCount: orig?.dependsOn?.length ?? 0, outgoingCount: orig?.children?.length ?? 0,
  };
  nodes.push(laid);
  nodeMap.set(laid.id, laid);

  if (parentId) {
    const parent = nodeMap.get(parentId)!;
    const sx = parent.x + parent.width;
    const sy = parent.y + parent.height / 2;
    const tx = x;
    const ty = nodeY + NODE_HEIGHT / 2;
    const mx = sx + H_GAP / 2;
    edges.push({
      id: `${parentId}→${measure.node.id}`, sourceId: parentId, targetId: measure.node.id,
      path: `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`,
      labelX: mx, labelY: (sy + ty) / 2,
      color: 'var(--color-neutral-300)', dashed: false, isCrossRef: false,
      marker: 'depends',
    });
  }

  let childY = y;
  for (const child of measure.children) {
    layoutTreeH(child, x + NODE_WIDTH + H_GAP, childY, measure.node.id, nodes, edges, allNodes, nodeMap);
    childY += child.secondary + V_GAP;
  }
}

function layoutTreeV(
  measure: TreeMeasure, x: number, y: number, parentId: string | null,
  nodes: LayoutNode[], edges: LayoutEdge[], allNodes: Map<string, DependencyNode>,
  nodeMap: Map<string, LayoutNode>,
): void {
  const nodeX = x + measure.secondary / 2 - NODE_WIDTH / 2;
  const orig = allNodes.get(measure.node.id);

  const laid: LayoutNode = {
    id: measure.node.id, label: measure.node.label, description: measure.node.description,
    icon: measure.node.icon, status: measure.node.status || 'default',
    type: measure.node.type, moreCount: measure.node.moreCount,
    x: nodeX, y, width: NODE_WIDTH, height: NODE_HEIGHT, depth: measure.depth, parentId,
    incomingCount: orig?.dependsOn?.length ?? 0, outgoingCount: orig?.children?.length ?? 0,
  };
  nodes.push(laid);
  nodeMap.set(laid.id, laid);

  if (parentId) {
    const parent = nodeMap.get(parentId)!;
    const sx = parent.x + parent.width / 2;
    const sy = parent.y + parent.height;
    const tx = nodeX + NODE_WIDTH / 2;
    const ty = y;
    const my = sy + H_GAP / 2;
    edges.push({
      id: `${parentId}→${measure.node.id}`, sourceId: parentId, targetId: measure.node.id,
      path: `M ${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}`,
      labelX: (sx + tx) / 2, labelY: my,
      color: 'var(--color-neutral-300)', dashed: false, isCrossRef: false,
      marker: 'depends',
    });
  }

  let childX = x;
  for (const child of measure.children) {
    layoutTreeV(child, childX, y + NODE_HEIGHT + H_GAP, measure.node.id, nodes, edges, allNodes, nodeMap);
    childX += child.secondary + V_GAP;
  }
}

// The `map.has` check doubles as the cycle guard: revisiting a node means the
// graph loops back (or converges from a second parent), and there is nothing
// left to collect from it.
function collectAllNodes(node: DependencyNode, map: Map<string, DependencyNode>): void {
  if (map.has(node.id)) return;
  map.set(node.id, node);
  for (const child of node.children || []) collectAllNodes(child, map);
}

interface Pt {
  x: number;
  y: number;
}
type Cubic = [Pt, Pt, Pt, Pt];

interface EdgeGeometry {
  path: string;
  labelX: number;
  labelY: number;
  /** Control points, kept so the route can be tested against the node boxes. */
  points: Cubic;
}

const cubicPath = (p: Cubic) =>
  `M ${p[0].x} ${p[0].y} C ${p[1].x} ${p[1].y}, ${p[2].x} ${p[2].y}, ${p[3].x} ${p[3].y}`;

function cubicAt(p: Cubic, t: number): Pt {
  const m = 1 - t;
  return {
    x: m * m * m * p[0].x + 3 * m * m * t * p[1].x + 3 * m * t * t * p[2].x + t * t * t * p[3].x,
    y: m * m * m * p[0].y + 3 * m * m * t * p[1].y + 3 * m * t * t * p[2].y + t * t * t * p[3].y,
  };
}

/**
 * Nodes the curve passes through, ignoring its own endpoints — a path necessarily
 * touches those, and counting them would make every edge look like a crossing.
 */
function crossedNodes(points: Cubic, nodes: LayoutNode[], exclude: Set<string>): LayoutNode[] {
  const hit = new Map<string, LayoutNode>();
  for (let i = 0; i <= ROUTE_SAMPLES; i++) {
    const p = cubicAt(points, i / ROUTE_SAMPLES);
    for (const n of nodes) {
      if (exclude.has(n.id) || hit.has(n.id)) continue;
      if (
        p.x > n.x + ROUTE_INSET &&
        p.x < n.x + n.width - ROUTE_INSET &&
        p.y > n.y + ROUTE_INSET &&
        p.y < n.y + n.height - ROUTE_INSET
      ) {
        hit.set(n.id, n);
      }
    }
  }
  return [...hit.values()];
}

/** The straight-ish curve between two nodes, following the layout flow. */
function directGeometry(source: LayoutNode, target: LayoutNode, dir: DependencyDirection): EdgeGeometry {
  if (dir === 'horizontal') {
    const p0 = { x: source.x + source.width, y: source.y + source.height / 2 };
    const p3 = { x: target.x, y: target.y + target.height / 2 };
    const mx = (p0.x + p3.x) / 2;
    const points: Cubic = [p0, { x: mx, y: p0.y }, { x: mx, y: p3.y }, p3];
    // labelY is the curve midpoint, not a baseline offset: the template centres the
    // text on it via `dominant-baseline`. Nudging it up instead (as this did) pushes
    // the label out of a 24px gutter and into the node above it.
    return { path: cubicPath(points), labelX: mx, labelY: (p0.y + p3.y) / 2, points };
  }
  const p0 = { x: source.x + source.width / 2, y: source.y + source.height };
  const p3 = { x: target.x + target.width / 2, y: target.y };
  const my = (p0.y + p3.y) / 2;
  const points: Cubic = [p0, { x: p0.x, y: my }, { x: p3.x, y: my }, p3];
  return { path: cubicPath(points), labelX: (p0.x + p3.x) / 2, labelY: my, points };
}

type BowSide = 'below' | 'above' | 'right' | 'left';

/**
 * Leaves from one side of both boxes and bows clear of everything in `obstacles`,
 * so the edge travels through empty space instead of disappearing behind the nodes
 * between its endpoints.
 *
 * The side matters: bowing *below* clears an obstacle sitting beside the endpoints,
 * but drives straight through one stacked underneath them. Callers try several.
 */
function bowedGeometry(
  source: LayoutNode,
  target: LayoutNode,
  obstacles: LayoutNode[],
  side: BowSide,
): EdgeGeometry {
  const all = [source, target, ...obstacles];
  switch (side) {
    case 'below': {
      const dip = Math.max(...all.map(n => n.y + n.height)) + BACK_EDGE_BOW;
      const p0 = { x: source.x + source.width / 2, y: source.y + source.height };
      const p3 = { x: target.x + target.width / 2, y: target.y + target.height };
      const points: Cubic = [p0, { x: p0.x, y: dip }, { x: p3.x, y: dip }, p3];
      return { path: cubicPath(points), labelX: (p0.x + p3.x) / 2, labelY: dip - 4, points };
    }
    case 'above': {
      const rise = Math.min(...all.map(n => n.y)) - BACK_EDGE_BOW;
      const p0 = { x: source.x + source.width / 2, y: source.y };
      const p3 = { x: target.x + target.width / 2, y: target.y };
      const points: Cubic = [p0, { x: p0.x, y: rise }, { x: p3.x, y: rise }, p3];
      return { path: cubicPath(points), labelX: (p0.x + p3.x) / 2, labelY: rise + 12, points };
    }
    case 'right': {
      const bow = Math.max(...all.map(n => n.x + n.width)) + BACK_EDGE_BOW;
      const p0 = { x: source.x + source.width, y: source.y + source.height / 2 };
      const p3 = { x: target.x + target.width, y: target.y + target.height / 2 };
      const points: Cubic = [p0, { x: bow, y: p0.y }, { x: bow, y: p3.y }, p3];
      return { path: cubicPath(points), labelX: bow - 4, labelY: (p0.y + p3.y) / 2, points };
    }
    case 'left': {
      const bow = Math.min(...all.map(n => n.x)) - BACK_EDGE_BOW;
      const p0 = { x: source.x, y: source.y + source.height / 2 };
      const p3 = { x: target.x, y: target.y + target.height / 2 };
      const points: Cubic = [p0, { x: bow, y: p0.y }, { x: bow, y: p3.y }, p3];
      return { path: cubicPath(points), labelX: bow + 4, labelY: (p0.y + p3.y) / 2, points };
    }
  }
}

// Try the side that suits the layout flow first: in a left-to-right tree the free
// space is above and below the rows; in a top-to-bottom one it's left and right.
const bowSides = (dir: DependencyDirection): BowSide[] =>
  dir === 'horizontal' ? ['below', 'above', 'right', 'left'] : ['right', 'left', 'below', 'above'];

/**
 * Cross-references connect arbitrary pairs, so unlike parent→child edges (which
 * always run down the gutter between two levels) they can cut straight across
 * unrelated nodes. Pick the cleanest of a handful of candidate routes.
 *
 * This is a small fixed search, not obstacle-avoiding routing: it clears the common
 * cases cheaply, but a dense enough graph can leave every candidate crossing
 * something. Then the least-bad one wins, and `direct` wins ties — a pointless
 * detour reads worse than a short hop behind one box.
 */
function routeCrossRef(
  source: LayoutNode,
  target: LayoutNode,
  dir: DependencyDirection,
  nodes: LayoutNode[],
  allowDirect = true,
): EdgeGeometry {
  const exclude = new Set([source.id, target.id]);
  const direct = directGeometry(source, target, dir);
  const obstacles = crossedNodes(direct.points, nodes, exclude);

  if (allowDirect && !obstacles.length) return direct;

  let best = allowDirect ? direct : null;
  let bestCount = allowDirect ? obstacles.length : Infinity;

  for (const side of bowSides(dir)) {
    const candidate = bowedGeometry(source, target, obstacles, side);
    const count = crossedNodes(candidate.points, nodes, exclude).length;
    if (count < bestCount) {
      best = candidate;
      bestCount = count;
      if (count === 0) break;
    }
  }
  return best ?? direct;
}

/**
 * Falls back to `depends` for anything not in the style table. Callers may pass a
 * relation that only carries a free-form `relationLabel`, and untyped callers can
 * pass an unknown string — neither may end up with an undefined style or an
 * arrow marker id that doesn't exist in the template's `<defs>`.
 */
function resolveRelation(relation: DependencyRelation | undefined): DependencyRelation {
  return relation && RELATION_STYLES[relation] ? relation : 'depends';
}

function createCrossRefEdges(
  nodeMap: Map<string, LayoutNode>, allOriginal: Map<string, DependencyNode>,
  dir: DependencyDirection, backEdges: BackEdge[],
): LayoutEdge[] {
  const edges: LayoutEdge[] = [];
  const nodes = [...nodeMap.values()];

  for (const [, orig] of allOriginal) {
    if (!orig.dependsOn?.length) continue;
    const target = nodeMap.get(orig.id);
    if (!target) continue;

    for (const dep of orig.dependsOn) {
      const source = nodeMap.get(dep.id);
      if (!source) continue;

      const relation = resolveRelation(dep.relation);
      const style = RELATION_STYLES[relation];
      const geo = routeCrossRef(source, target, dir, nodes);

      edges.push({
        id: `${dep.id}⇢${orig.id}`, sourceId: dep.id, targetId: orig.id,
        path: geo.path, relation: dep.relation,
        label: dep.relationLabel ?? style.label,
        labelX: geo.labelX, labelY: geo.labelY,
        color: style.color, dashed: style.dashed, isCrossRef: true, marker: relation,
      });
    }
  }

  // Links the tree layout couldn't follow (cycle, or a node reached from a second
  // parent). The relationship is real, so draw it as a cross-reference rather than
  // dropping it silently. These always bow: they point against the layout flow by
  // definition, so the direct route would double back across their own row.
  for (const back of backEdges) {
    const source = nodeMap.get(back.from);
    const target = nodeMap.get(back.to);
    if (!source || !target) continue;

    const style = RELATION_STYLES.depends;
    const geo = routeCrossRef(source, target, dir, nodes, /* allowDirect */ false);
    edges.push({
      id: `${back.from}↺${back.to}`, sourceId: back.from, targetId: back.to,
      path: geo.path, labelX: geo.labelX, labelY: geo.labelY,
      color: style.color, dashed: true, isCrossRef: true, marker: 'depends',
    });
  }

  return edges;
}

// ── Status colors ────────────────────────────────────────────────────────────

// Labels read from the theme's semantic ink, not from a `--color-<status>-700`.
// Those resolve to dark ink in both themes (error-700 is #6b0909), which on the
// dark theme's translucent tint over #14222e is dark-on-dark. The status is
// carried by the border and tint; the label just has to be readable, and
// --color-text-* is the one pair that flips with the theme.
const STATUS_COLORS: Record<DependencyNodeStatus, { bg: string; border: string; text: string }> = {
  default: { bg: 'var(--color-neutral-50)', border: 'var(--color-neutral-300)', text: 'var(--color-text-primary)' },
  active:  { bg: 'var(--color-primary-50)', border: 'var(--color-primary-400)', text: 'var(--color-text-primary)' },
  success: { bg: 'var(--color-success-50, #f0fdf4)', border: 'var(--color-success-default)', text: 'var(--color-text-primary)' },
  warning: { bg: 'var(--color-warning-50, #fffbeb)', border: 'var(--color-warning-default)', text: 'var(--color-text-primary)' },
  error:   { bg: 'var(--color-error-50, #fef2f2)', border: 'var(--color-error-default)', text: 'var(--color-text-primary)' },
  muted:   { bg: 'var(--color-neutral-100)', border: 'var(--color-neutral-200)', text: 'var(--color-text-tertiary)' },
};

/** Parses `#rgb`, `#rrggbb`, `rgb()` and `rgba()`. Anything else → null. */
function parseRgb(color: string): [number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)/i);
  if (rgb) {
    const p = rgb[1].split(',').map(s => parseFloat(s));
    if (p.length >= 3 && p.every(n => !Number.isNaN(n))) return [p[0], p[1], p[2]];
  }
  return null;
}

/**
 * Ink that stays readable on an arbitrary caller-supplied `typeColors` value.
 *
 * No theme token can do this job: a type colour is chosen by the consumer, so it
 * may be light while the theme is dark (or the reverse). `--color-neutral-900`
 * looks like "dark ink" but the dark theme inverts the neutral scale and resolves
 * it to #f9fafb — white label on a pale tile. Derive the ink from the colour's own
 * luminance instead, and fall back to the theme when it can't be parsed.
 */
function readableInk(color: string): string {
  const rgb = parseRgb(color);
  if (!rgb) return 'var(--color-text-primary)';
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? '#111827' : '#f9fafb';
}

/**
 * Dependency viewer component for visualizing hierarchical and cross-cutting relationships.
 *
 * Features:
 * - Horizontal (left-to-right) and vertical (top-to-bottom) layout directions
 * - Bidirectional dependencies: children (right/down) and dependsOn (cross-references)
 * - Relationship types: depends, blocks, references, requires, extends, implements, uses
 * - Edge labels showing relationship type
 * - Dashed vs solid edges per relationship category
 * - Color-coded edges per relationship type
 * - Node status colors (default, active, success, warning, error, muted)
 * - Pan and zoom controls with mouse wheel support
 * - Collapsible sub-trees
 * - Interactive node selection with detail panel
 * - Legend showing active relationship types
 * - SVG arrowhead markers on cross-reference edges
 * - Dark/light theme support
 *
 * ## Feeding it a graph
 *
 * `root` is a *tree*, but the input is treated as a graph: a link back to a node
 * that already has a place in the layout — a cycle, or a node reached from a
 * second parent — is drawn as a cross-reference arrow instead of being followed.
 * Every node is laid out exactly once, and no input can make the layout recurse
 * forever.
 *
 * For incremental exploration, hand in a wider `root` per step and let
 * `nodeExpand` drive the loading. Pan, zoom, collapse state and selection all
 * survive a `root` swap, and `anchorNodeId` (defaulting to the selected node)
 * keeps the viewport pinned while the graph grows around it.
 *
 * @example
 * ```html
 * <lc-dependency-viewer [root]="specTree" direction="horizontal" />
 * ```
 *
 * @example Incremental graph exploration
 * ```html
 * <lc-dependency-viewer
 *   [root]="graph()"
 *   [anchorNodeId]="anchor()"
 *   [typeColors]="{ Alpha: '#c1e3e9' }"
 *   (nodeSelect)="showDetails($event)"
 *   (nodeExpand)="loadNeighbours($event)"
 * />
 * ```
 */
@Component({
  selector: 'lc-dependency-viewer',
  standalone: true,
  templateUrl: './dependency-viewer.component.html',
  styleUrls: ['./dependency-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"dep-viewer"', '[style.height]': 'height()' },
})
export class DependencyViewerComponent {
  readonly root = input.required<DependencyNode>();
  readonly direction = input<DependencyDirection>('horizontal');
  readonly height = input('500px');
  readonly showToolbar = input(true);
  readonly showEdgeLabels = input(true);
  readonly edgeWidth = input(1.5);

  /**
   * Node the viewport holds still across `root` updates. Defaults to the node the
   * user last selected, which keeps click-to-expand steady without any wiring.
   * Set it explicitly to anchor somewhere else (e.g. a deep-linked node).
   */
  readonly anchorNodeId = input<string | null>(null);

  /** Fill colour per `DependencyNode.type`, e.g. `{ Class: '#8ea475' }`. */
  readonly typeColors = input<Record<string, string>>({});

  /** Relations to hide. Cross-reference edges of these types aren't rendered. */
  readonly hiddenRelations = input<readonly DependencyRelation[]>([]);

  /** Node types to hide, matched against `DependencyNode.type`. */
  readonly hiddenTypes = input<readonly string[]>([]);

  /** Fires when a node is selected (not on deselect), with the original node incl. `data`. */
  readonly nodeSelect = output<DependencyNode>();

  /** Fires on double-click — the hook for "expand this node's neighbourhood". */
  readonly nodeExpand = output<DependencyNode>();

  protected zoom = signal(100);
  protected panX = signal(40);
  protected panY = signal(40);
  protected selectedNodeId = signal<string | null>(null);
  protected collapsedIds = signal<Set<string>>(new Set());

  private isPanning = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private readonly hostEl = inject(ElementRef<HTMLElement>);

  /** Last known layout position of the anchor, to compensate pan after a relayout. */
  private anchorPos: { id: string; x: number; y: number } | null = null;

  protected effectiveRoot = computed<DependencyNode>(() =>
    this.pruneCollapsed(this.root(), this.collapsedIds(), new Set())
  );

  private allOriginalNodes = computed(() => {
    const map = new Map<string, DependencyNode>();
    collectAllNodes(this.root(), map);
    return map;
  });

  protected layout = computed(() => {
    const root = this.effectiveRoot();
    const dir = this.direction();
    const hiddenTypes = new Set(this.hiddenTypes());
    const hiddenRelations = new Set(this.hiddenRelations());

    const backEdges: BackEdge[] = [];
    const measured = measureTree(root, 0, dir, new Set(), backEdges);
    const nodes: LayoutNode[] = [];
    const nodeMap = new Map<string, LayoutNode>();
    const treeEdges: LayoutEdge[] = [];
    const allNodes = this.allOriginalNodes();

    if (dir === 'horizontal') {
      layoutTreeH(measured, 0, 0, null, nodes, treeEdges, allNodes, nodeMap);
    } else {
      layoutTreeV(measured, 0, 0, null, nodes, treeEdges, allNodes, nodeMap);
    }

    const crossEdges = createCrossRefEdges(nodeMap, allNodes, dir, backEdges);
    const edges = [...treeEdges, ...crossEdges].filter(
      e => !(e.relation && hiddenRelations.has(e.relation)),
    );

    // Type filtering hides nodes and anything still pointing at them. It runs
    // after layout so the remaining nodes keep the positions they'd have anyway —
    // toggling a filter must not reshuffle the whole graph.
    const visibleNodes = hiddenTypes.size
      ? nodes.filter(n => !(n.type && hiddenTypes.has(n.type)))
      : nodes;
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = hiddenTypes.size
      ? edges.filter(e => visibleIds.has(e.sourceId) && visibleIds.has(e.targetId))
      : edges;

    return {
      nodes: visibleNodes,
      edges: visibleEdges,
      nodeMap,
      width: dir === 'horizontal' ? measured.primary : measured.secondary,
      height: dir === 'horizontal' ? measured.secondary : measured.primary,
    };
  });

  constructor() {
    // Keep the anchor node pinned to its screen position across relayouts. A new
    // `root` (an expand step) re-runs the tree layout from scratch, which recentres
    // subtrees and shifts nodes that didn't change — the camera stays put while the
    // graph slides underneath it. Compensating the pan by the anchor's own delta is
    // what makes incremental expansion feel stable.
    effect(() => {
      const nodeMap = this.layout().nodeMap;
      const anchorId = this.anchorNodeId() ?? this.selectedNodeId();

      if (!anchorId) {
        this.anchorPos = null;
        return;
      }
      const node = nodeMap.get(anchorId);
      if (!node) {
        this.anchorPos = null;
        return;
      }

      const prev = this.anchorPos;
      if (prev && prev.id === anchorId && (prev.x !== node.x || prev.y !== node.y)) {
        const dx = node.x - prev.x;
        const dy = node.y - prev.y;
        // `transform: translate(pan px) scale(z)` with `transform-origin: 0 0`, so
        // screen = pan + z * layout — a layout delta moves the node by z * delta.
        untracked(() => {
          const z = this.zoom() / 100;
          this.panX.set(this.panX() - dx * z);
          this.panY.set(this.panY() - dy * z);
        });
      }
      this.anchorPos = { id: anchorId, x: node.x, y: node.y };
    });
  }

  protected svgWidth = computed(() => this.layout().width + 80);
  protected svgHeight = computed(() => this.layout().height + 80);
  protected viewBox = computed(() => `0 0 ${this.svgWidth()} ${this.svgHeight()}`);
  protected transform = computed(() => {
    const z = this.zoom() / 100;
    return `translate(${this.panX()}px, ${this.panY()}px) scale(${z})`;
  });

  protected selectedNode = computed<LayoutNode | null>(() => {
    const id = this.selectedNodeId();
    if (!id) return null;
    return this.layout().nodes.find(n => n.id === id) ?? null;
  });

  protected selectedDependsOn = computed<DependencyEdgeDef[]>(() => {
    const id = this.selectedNodeId();
    if (!id) return [];
    return this.allOriginalNodes().get(id)?.dependsOn ?? [];
  });

  // Grouped by label rather than relation, so free-form `relationLabel`s (CALLS,
  // HAS_COLUMN, …) each get their own entry instead of collapsing into the handful
  // of built-in relation types they borrow their colour from.
  protected legendItems = computed(() => {
    const seen = new Map<string, { label: string; color: string; dashed: boolean }>();
    for (const edge of this.layout().edges) {
      if (!edge.isCrossRef || !edge.label || seen.has(edge.label)) continue;
      seen.set(edge.label, { label: edge.label, color: edge.color, dashed: edge.dashed });
    }
    return Array.from(seen.values());
  });

  protected typeLegendItems = computed(() => {
    const colors = this.typeColors();
    const seen = new Map<string, { type: string; color: string }>();
    for (const node of this.layout().nodes) {
      if (!node.type || seen.has(node.type) || !colors[node.type]) continue;
      seen.set(node.type, { type: node.type, color: colors[node.type] });
    }
    return Array.from(seen.values());
  });

  // O(1) against the collected map. Deliberately keyed off the *original* tree, so
  // a collapsed node keeps its "+" toggle even though it has no children in the
  // pruned tree that gets laid out.
  protected hasChildren(nodeId: string): boolean {
    return !!this.allOriginalNodes().get(nodeId)?.children?.length;
  }

  protected isCollapsed(nodeId: string): boolean {
    return this.collapsedIds().has(nodeId);
  }

  protected getRelationLabel(relation: DependencyRelation): string {
    return RELATION_STYLES[relation]?.label ?? relation;
  }

  // `visited` keeps a cyclic graph from recursing forever here too — this runs
  // before the layout's own guard sees the tree.
  private pruneCollapsed(
    node: DependencyNode,
    collapsed: Set<string>,
    visited: Set<string>,
  ): DependencyNode {
    if (visited.has(node.id) || collapsed.has(node.id) || !node.children?.length) {
      return { ...node, children: [] };
    }
    visited.add(node.id);
    return {
      ...node,
      children: node.children.map(c => this.pruneCollapsed(c, collapsed, visited)),
    };
  }

  protected selectNode(id: string, event: Event): void {
    event.stopPropagation();
    const next = this.selectedNodeId() === id ? null : id;
    this.selectedNodeId.set(next);
    if (!next) return;
    const original = this.allOriginalNodes().get(id);
    if (original) this.nodeSelect.emit(original);
  }

  protected expandNode(id: string, event: Event): void {
    event.stopPropagation();
    // A double-click also delivers two clicks, which would toggle the selection
    // straight back off. Re-assert it so the expanded node stays selected — and
    // stays the anchor the viewport holds onto.
    this.selectedNodeId.set(id);
    const original = this.allOriginalNodes().get(id);
    if (original) this.nodeExpand.emit(original);
  }

  protected toggleCollapse(id: string, event: Event): void {
    event.stopPropagation();
    this.collapsedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected deselectNode(): void { this.selectedNodeId.set(null); }
  protected zoomIn(): void { this.zoom.update(z => Math.min(z + 25, 300)); }
  protected zoomOut(): void { this.zoom.update(z => Math.max(z - 25, 25)); }
  protected resetZoom(): void { this.resetView(); }

  // ── Imperative API ─────────────────────────────────────────────────────────
  // For deep links (?anchor=<key> → centre on that node) and programmatic
  // expand/collapse. Mirrors lc-tree-view's expandAll()/collapseAll() surface.

  /** Centres the viewport on a node. No-op for an id that isn't laid out. */
  focusNode(id: string): void {
    const node = this.layout().nodeMap.get(id);
    if (!node) return;
    const z = this.zoom() / 100;
    const el = this.hostEl.nativeElement.querySelector('.dep-viewer__canvas');
    const viewW = el?.clientWidth ?? 0;
    const viewH = el?.clientHeight ?? 0;
    // Invert screen = pan + z * layout for the node's centre.
    this.panX.set(viewW / 2 - (node.x + node.width / 2) * z);
    this.panY.set(viewH / 2 - (node.y + node.height / 2) * z);
    this.anchorPos = { id, x: node.x, y: node.y };
  }

  /** Restores the initial zoom and pan. */
  resetView(): void {
    this.zoom.set(100);
    this.panX.set(40);
    this.panY.set(40);
  }

  /** Expands a collapsed node. */
  expand(id: string): void {
    this.collapsedIds.update(set => {
      if (!set.has(id)) return set;
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  /** Collapses a node's sub-tree. */
  collapse(id: string): void {
    this.collapsedIds.update(set => {
      if (set.has(id)) return set;
      const next = new Set(set);
      next.add(id);
      return next;
    });
  }

  /** Expands every collapsed node. */
  expandAll(): void {
    this.collapsedIds.set(new Set());
  }

  /** Collapses every node that has children. */
  collapseAll(): void {
    const ids = new Set<string>();
    for (const [id, node] of this.allOriginalNodes()) {
      if (node.children?.length) ids.add(id);
    }
    this.collapsedIds.set(ids);
  }

  protected onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    this.isPanning = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  @HostListener('document:mousemove', ['$event'])
  protected onMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return;
    this.panX.update(x => x + event.clientX - this.lastMouseX);
    this.panY.update(y => y + event.clientY - this.lastMouseY);
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  @HostListener('document:mouseup')
  protected onMouseUp(): void { this.isPanning = false; }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.zoom.update(z => event.deltaY < 0 ? Math.min(z + 10, 300) : Math.max(z - 10, 25));
  }

  // `type` is the category axis (Class/Table/Feature/…), `status` the semantic one
  // (error/warning/…). A resolved type colour wins for the fill; everything else
  // falls back to the status palette, so consumers that only use `status` are
  // unaffected.
  protected getNodeBg(node: LayoutNode): string {
    const typeColor = node.type ? this.typeColors()[node.type] : undefined;
    return typeColor ?? STATUS_COLORS[node.status].bg;
  }

  protected getNodeBorder(node: LayoutNode): string {
    const typeColor = node.type ? this.typeColors()[node.type] : undefined;
    return typeColor ?? STATUS_COLORS[node.status].border;
  }

  protected getNodeText(node: LayoutNode): string {
    const typeColor = node.type ? this.typeColors()[node.type] : undefined;
    return typeColor ? readableInk(typeColor) : STATUS_COLORS[node.status].text;
  }
}
