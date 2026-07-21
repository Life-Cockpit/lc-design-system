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
  viewChild,
  HostListener,
} from '@angular/core';

// ── Public types ─────────────────────────────────────────────────────────────

export type DependencyNodeStatus = 'default' | 'active' | 'success' | 'warning' | 'error' | 'muted';
export type DependencyDirection = 'horizontal' | 'vertical';
export type DependencyRelation = 'depends' | 'blocks' | 'references' | 'requires' | 'extends' | 'implements' | 'uses';

/**
 * How nodes are placed.
 *
 * - `tree` — column = depth in the `children` tree; `dependsOn` links are drawn
 *   over the top as cross-references and don't move anything.
 * - `layered` — column = depth in the *dependency* graph (Sugiyama). Every link is
 *   a precedence constraint, so a node always sits past everything it depends on.
 */
export type DependencyLayout = 'tree' | 'layered';

/**
 * How the graph is scaled into the frame.
 *
 * - `none` — no fitting; the viewport is whatever the user panned/zoomed to.
 * - `contain` — shrink until all of it fits, both axes.
 * - `fit-width` — shrink to the frame's *width* only and let the viewer grow
 *   taller, so the page scrolls instead of the nodes shrinking out of legibility.
 */
export type DependencyFitMode = 'none' | 'contain' | 'fit-width';

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
  /** Draws it as a secondary link: dimmed, and out of the layout's main flow. */
  isCrossRef: boolean;
  /** Whether to cap the edge with an arrowhead. */
  arrow: boolean;
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
/** Breathing room around the graph's bounding box when auto-fitting, in layout units. */
const FIT_PADDING = 24;
/**
 * Auto-fit shrinks to fit but never enlarges: blowing a two-node graph up to fill
 * a 600px frame reads as broken, not as "fitted".
 */
const MAX_FIT_SCALE = 1;
/** Floor for the fit scale, so a huge graph in a tiny box stays a graph, not a smear. */
const MIN_FIT_SCALE = 0.05;

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
      arrow: false, marker: 'depends',
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
      arrow: false, marker: 'depends',
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
        color: style.color, dashed: style.dashed, isCrossRef: true,
        arrow: true, marker: relation,
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
      color: style.color, dashed: true, isCrossRef: true,
      arrow: true, marker: 'depends',
    });
  }

  return edges;
}

// ── Layered (DAG) layout ─────────────────────────────────────────────────────

/** A link as the layered layout sees it: a precedence constraint plus its styling. */
interface GraphEdge {
  /** Predecessor — placed in an earlier layer (left / above). */
  from: string;
  /** Dependent — placed in a later layer. */
  to: string;
  relation?: DependencyRelation;
  label?: string;
  /** A `children` link. Keeps the tree edge's neutral styling and carries no label. */
  structural: boolean;
  /** Points against the topological flow. Excluded from layering, drawn bowed. */
  back: boolean;
}

const push = <T>(map: Map<string, T[]>, key: string, value: T): void => {
  const bucket = map.get(key);
  if (bucket) bucket.push(value);
  else map.set(key, [value]);
};

/**
 * Flattens the input into the node set and the precedence links the layered
 * layout works on.
 *
 * Both link kinds are precedence: `dependsOn` says "this comes after that", and a
 * `children` link says the same of a parent and its child. Layering over their
 * union is what keeps a `children` edge pointing *with* the flow instead of
 * doubling back across the graph, and means nothing in the input goes undrawn.
 * A pair joined both ways is one edge, styled by its `dependsOn` relation.
 *
 * A self-link is dropped: it constrains a node to sit after itself, which no
 * layering can satisfy, and it has nowhere to be drawn.
 */
function collectGraph(roots: DependencyNode[]): {
  order: string[];
  nodes: Map<string, DependencyNode>;
  edges: GraphEdge[];
} {
  const nodes = new Map<string, DependencyNode>();
  const order: string[] = [];
  const edges = new Map<string, GraphEdge>();

  const walk = (node: DependencyNode): void => {
    if (!nodes.has(node.id)) {
      nodes.set(node.id, node);
      order.push(node.id);
    }
    for (const child of node.children || []) {
      const fresh = !nodes.has(child.id);
      if (node.id !== child.id) {
        edges.set(`${node.id}→${child.id}`, {
          from: node.id, to: child.id, structural: true, back: false,
        });
      }
      // Guards the recursion: a cycle or a second parent revisits a node that is
      // already collected, and there is nothing left to collect from it.
      if (fresh) walk(child);
    }
  };
  for (const root of roots) walk(root);

  for (const id of order) {
    for (const dep of nodes.get(id)?.dependsOn || []) {
      if (dep.id === id || !nodes.has(dep.id)) continue;
      const style = RELATION_STYLES[resolveRelation(dep.relation)];
      edges.set(`${dep.id}→${id}`, {
        from: dep.id, to: id, relation: dep.relation,
        label: dep.relationLabel ?? style.label,
        structural: false, back: false,
      });
    }
  }

  return { order, nodes, edges: [...edges.values()] };
}

/**
 * Longest-path layering: a node sits one layer past the deepest thing it depends
 * on, so every forward edge points strictly onwards and a node with several
 * predecessors clears *all* of them. Nodes with no predecessor land in layer 0.
 *
 * A cycle can't be layered — some link in the loop has to point backwards. A DFS
 * picks those out (a link to a node still on the stack) and marks them `back`;
 * the layering then runs on what's left, which is acyclic by construction. So a
 * cyclic input lays out fine, with the loop-closing links drawn as return edges.
 */
function assignLayers(order: string[], edges: GraphEdge[]): Map<string, number> {
  const out = new Map<string, GraphEdge[]>();
  for (const edge of edges) push(out, edge.from, edge);

  // Iterative DFS: a recursive one overflows the stack on a long chain, and a
  // process-order graph is mostly chain.
  const UNSEEN = 0, ON_STACK = 1, DONE = 2;
  const state = new Map<string, number>();
  for (const start of order) {
    if (state.get(start)) continue;
    state.set(start, ON_STACK);
    const stack: { id: string; next: number }[] = [{ id: start, next: 0 }];
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const outgoing = out.get(frame.id) ?? [];
      if (frame.next >= outgoing.length) {
        state.set(frame.id, DONE);
        stack.pop();
        continue;
      }
      const edge = outgoing[frame.next++];
      const seen = state.get(edge.to) ?? UNSEEN;
      if (seen === ON_STACK) edge.back = true; // closes a loop
      if (seen !== UNSEEN) continue;
      state.set(edge.to, ON_STACK);
      stack.push({ id: edge.to, next: 0 });
    }
  }

  // Longest path over what's left, walked in topological order.
  const indegree = new Map<string, number>(order.map(id => [id, 0]));
  for (const edge of edges) {
    if (!edge.back) indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }

  const layer = new Map<string, number>(order.map(id => [id, 0]));
  const queue = order.filter(id => !indegree.get(id));
  for (let i = 0; i < queue.length; i++) {
    for (const edge of out.get(queue[i]) ?? []) {
      if (edge.back) continue;
      layer.set(edge.to, Math.max(layer.get(edge.to) ?? 0, (layer.get(queue[i]) ?? 0) + 1));
      const remaining = (indegree.get(edge.to) ?? 0) - 1;
      indegree.set(edge.to, remaining);
      if (!remaining) queue.push(edge.to);
    }
  }
  return layer;
}

/** Median of the neighbour positions, or -1 when a node has no neighbours to follow. */
function median(values: number[]): number {
  if (!values.length) return -1;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Row index of every node within its own layer. */
function positionIndex(layers: string[][]): Map<string, number> {
  const index = new Map<string, number>();
  for (const layer of layers) layer.forEach((id, i) => index.set(id, i));
  return index;
}

/**
 * Edges cross when their endpoints are ordered oppositely in the two layers they
 * span. Counted per layer *pair* rather than per adjacent layer, so an edge
 * skipping a layer is scored too — this layout has no dummy nodes, and in a
 * dependency graph the long edges are exactly the ones that tangle.
 */
function countCrossings(layers: string[][], edges: GraphEdge[], layerOf: Map<string, number>): number {
  const index = positionIndex(layers);
  const groups = new Map<string, [number, number][]>();
  for (const edge of edges) {
    if (edge.back) continue;
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from === undefined || to === undefined) continue;
    push(groups, `${layerOf.get(edge.from)}:${layerOf.get(edge.to)}`, [from, to]);
  }

  let crossings = 0;
  for (const pairs of groups.values()) {
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        if ((pairs[i][0] - pairs[j][0]) * (pairs[i][1] - pairs[j][1]) < 0) crossings++;
      }
    }
  }
  return crossings;
}

/** Sweeps to run over the layers; each one reorders against the previous result. */
const ORDER_SWEEPS = 8;

/**
 * Crossing minimisation, median heuristic (Sugiyama's second phase): a node wants
 * to sit level with the middle of its neighbours, and ordering every layer that
 * way repeatedly untangles the edges between them.
 *
 * Sweeps alternate direction — downward passes order a layer by its predecessors,
 * upward passes by its successors — because settling one side alone just moves the
 * tangle to the other. The heuristic isn't monotonic, so the best ordering seen is
 * kept rather than the last one.
 */
function orderLayers(layers: string[][], edges: GraphEdge[], layerOf: Map<string, number>): string[][] {
  const predecessors = new Map<string, string[]>();
  const successors = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.back) continue;
    push(predecessors, edge.to, edge.from);
    push(successors, edge.from, edge.to);
  }

  const current = layers.map(layer => [...layer]);
  let best = current.map(layer => [...layer]);
  let bestCrossings = countCrossings(current, edges, layerOf);

  for (let sweep = 0; sweep < ORDER_SWEEPS && bestCrossings > 0; sweep++) {
    const downward = sweep % 2 === 0;
    const reference = downward ? predecessors : successors;
    const index = positionIndex(current);

    // The first layer of a downward sweep (and the last of an upward one) has no
    // reference layer, so it stays as it is and anchors the sweep.
    const targets = current.map((_, i) => i);
    for (const i of downward ? targets.slice(1) : targets.slice(0, -1).reverse()) {
      current[i] = [...current[i]]
        .map((id, row) => {
          const neighbours = (reference.get(id) ?? [])
            .map(n => index.get(n))
            .filter((p): p is number => p !== undefined);
          const m = median(neighbours);
          // No neighbours to follow: hold the current row, so a free node doesn't
          // get swept to the top of the layer on every pass.
          return { id, row, key: m < 0 ? row : m };
        })
        .sort((a, b) => a.key - b.key || a.row - b.row)
        .map(entry => entry.id);
    }

    const crossings = countCrossings(current, edges, layerOf);
    if (crossings < bestCrossings) {
      bestCrossings = crossings;
      best = current.map(layer => [...layer]);
    }
  }
  return best;
}

/** Alignment passes run after ordering, to straighten the edges it left behind. */
const ALIGN_PASSES = 4;

/**
 * Secondary-axis coordinates: with the row *order* fixed, slide each node towards
 * the middle of its neighbours so chains run straight instead of stair-stepping.
 *
 * Order and spacing are invariants here — the ordering phase chose them, and this
 * must not undo its work. So each layer is placed by a forward cascade that can
 * only push nodes further along, then shifted back by the average push: a uniform
 * shift keeps every gap and every relative position, and cancels the drift the
 * cascade would otherwise accumulate down the layer.
 */
function alignSecondary(
  layers: string[][],
  edges: GraphEdge[],
  step: number,
): Map<string, number> {
  const predecessors = new Map<string, string[]>();
  const successors = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.back) continue;
    push(predecessors, edge.to, edge.from);
    push(successors, edge.from, edge.to);
  }

  const pos = new Map<string, number>();
  for (const layer of layers) layer.forEach((id, i) => pos.set(id, i * step));

  for (let pass = 0; pass < ALIGN_PASSES; pass++) {
    const downward = pass % 2 === 0;
    const reference = downward ? predecessors : successors;
    const indices = layers.map((_, i) => i);

    for (const i of downward ? indices.slice(1) : indices.slice(0, -1).reverse()) {
      const layer = layers[i];
      if (!layer.length) continue;

      const wanted = layer.map(id => {
        const neighbours = (reference.get(id) ?? [])
          .map(n => pos.get(n))
          .filter((p): p is number => p !== undefined);
        return neighbours.length ? median(neighbours) : (pos.get(id) ?? 0);
      });

      const placed: number[] = [];
      for (let k = 0; k < layer.length; k++) {
        placed[k] = k === 0 ? wanted[k] : Math.max(wanted[k], placed[k - 1] + step);
      }
      const drift = placed.reduce((sum, p, k) => sum + (p - wanted[k]), 0) / placed.length;
      layer.forEach((id, k) => pos.set(id, placed[k] - drift));
    }
  }

  // Normalise so the graph starts at the origin, like the tree layout does.
  const min = Math.min(...pos.values());
  for (const [id, value] of pos) pos.set(id, value - min);
  return pos;
}

/**
 * Places the nodes of a dependency graph in layers running left→right
 * (`horizontal`) or top→bottom (`vertical`).
 *
 * Unlike the tree layout, the column a node lands in is decided by the *graph*, not
 * by the shape of the `children` nesting it happened to arrive in: layer = longest
 * dependency path to it. Every link is drawn, including the ones a tree layout has
 * to discard to keep a single parent per node.
 */
function layoutLayered(
  roots: DependencyNode[],
  dir: DependencyDirection,
  allNodes: Map<string, DependencyNode>,
): { nodes: LayoutNode[]; edges: LayoutEdge[]; nodeMap: Map<string, LayoutNode>; width: number; height: number } {
  const { order, nodes: originals, edges } = collectGraph(roots);
  if (!order.length) {
    return { nodes: [], edges: [], nodeMap: new Map(), width: 0, height: 0 };
  }

  const layerOf = assignLayers(order, edges);
  const depth = Math.max(...layerOf.values());
  const layers: string[][] = Array.from({ length: depth + 1 }, () => []);
  for (const id of order) layers[layerOf.get(id) ?? 0].push(id);

  const ordered = orderLayers(layers, edges, layerOf);

  const primarySize = dir === 'horizontal' ? NODE_WIDTH : NODE_HEIGHT;
  const secondarySize = dir === 'horizontal' ? NODE_HEIGHT : NODE_WIDTH;
  const secondary = alignSecondary(ordered, edges, secondarySize + V_GAP);

  const nodes: LayoutNode[] = [];
  const nodeMap = new Map<string, LayoutNode>();
  for (const layer of ordered) {
    for (const id of layer) {
      const source = originals.get(id);
      if (!source) continue;
      const original = allNodes.get(id);
      const primary = (layerOf.get(id) ?? 0) * (primarySize + H_GAP);
      const across = secondary.get(id) ?? 0;

      const laid: LayoutNode = {
        id, label: source.label, description: source.description, icon: source.icon,
        status: source.status || 'default', type: source.type, moreCount: source.moreCount,
        x: dir === 'horizontal' ? primary : across,
        y: dir === 'horizontal' ? across : primary,
        width: NODE_WIDTH, height: NODE_HEIGHT,
        depth: layerOf.get(id) ?? 0,
        // Layers come from the whole graph, not from one parent — there is no
        // single node this one hangs off, so nothing to report as its parent.
        parentId: null,
        incomingCount: original?.dependsOn?.length ?? 0,
        outgoingCount: original?.children?.length ?? 0,
      };
      nodes.push(laid);
      nodeMap.set(id, laid);
    }
  }

  const laidOut = [...nodeMap.values()];
  const layoutEdges: LayoutEdge[] = [];
  for (const edge of edges) {
    const source = nodeMap.get(edge.from);
    const target = nodeMap.get(edge.to);
    if (!source || !target) continue;

    const relation = resolveRelation(edge.relation);
    const style = RELATION_STYLES[relation];
    // A back edge runs against the flow by definition, so the direct route would
    // double back through its own layers — it always bows clear instead.
    const geo = routeCrossRef(source, target, dir, laidOut, /* allowDirect */ !edge.back);

    layoutEdges.push({
      id: `${edge.from}${edge.back ? '↺' : '⇢'}${edge.to}`,
      sourceId: edge.from, targetId: edge.to,
      path: geo.path, relation: edge.relation, label: edge.label,
      labelX: geo.labelX, labelY: geo.labelY,
      color: edge.structural ? 'var(--color-neutral-400)' : style.color,
      dashed: edge.back || (!edge.structural && style.dashed),
      // Everything here is a real dependency, so nothing is dimmed as secondary
      // except the return edges — which the layering had to break to lay out.
      isCrossRef: edge.back,
      arrow: true,
      marker: relation,
    });
  }

  const width = (depth + 1) * primarySize + depth * H_GAP;
  const across = Math.max(...laidOut.map(n => (dir === 'horizontal' ? n.y : n.x))) + secondarySize;

  return {
    nodes,
    edges: layoutEdges,
    nodeMap,
    width: dir === 'horizontal' ? width : across,
    height: dir === 'horizontal' ? across : width,
  };
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
 * - Tree layout (depth in the `children` nesting) and layered/DAG layout (depth in
 *   the dependency graph), via `layout`
 * - Horizontal (left-to-right) and vertical (top-to-bottom) layout directions
 * - Bidirectional dependencies: children (right/down) and dependsOn (cross-references)
 * - Relationship types: depends, blocks, references, requires, extends, implements, uses
 * - Edge labels showing relationship type
 * - Dashed vs solid edges per relationship category
 * - Color-coded edges per relationship type
 * - Node status colors (default, active, success, warning, error, muted)
 * - Pan and zoom controls with mouse wheel support
 * - Fitting (`fitMode` / `autoFit`, `minNodeSize`) and a static, non-navigable
 *   mode (`interactive: false`)
 * - Collapsible sub-trees
 * - Interactive node selection with detail panel
 * - Legend showing active relationship types
 * - SVG arrowhead markers on cross-reference edges
 * - Dark/light theme support
 *
 * ## Feeding it a graph
 *
 * `root` takes a single node (a tree) or an array (a forest — the shape to use for
 * a flat set of items related only by `dependsOn`). Either way the input is treated
 * as a graph: a link back to a node that already has a place in the layout — a
 * cycle, or a node reached from a second parent — is drawn as a cross-reference
 * arrow instead of being followed. Every node is laid out exactly once, and no
 * input can make the layout recurse forever.
 *
 * ## Picking a layout
 *
 * `tree` (default) answers "what contains what": the column is the depth in the
 * `children` nesting, and `dependsOn` links are drawn over the top without moving
 * anything.
 *
 * `layered` answers "what has to happen first": the column is the depth in the
 * dependency graph, so a node always sits past everything it depends on. Reach for
 * it whenever the question is about order or impact rather than containment —
 * a tree layout can only approximate that by first reducing the graph to a
 * spanning tree, which throws away every link that doesn't fit one parent per node.
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
 * @example Order of work — a flat set of items, laid out by their dependencies
 * ```html
 * <lc-dependency-viewer
 *   [root]="items()"
 *   layout="layered"
 *   direction="horizontal"
 *   fitMode="fit-width"
 *   (nodeSelect)="openItem($event)"
 * />
 * ```
 *
 * @example Static overview — the whole graph at a glance, click-through only
 * ```html
 * <lc-dependency-viewer
 *   [root]="graph()"
 *   [autoFit]="true"
 *   [interactive]="false"
 *   height="360px"
 *   (nodeSelect)="openDetail($event)"
 * />
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
  host: { '[class]': '"dep-viewer"', '[style.height]': 'hostHeight()' },
})
export class DependencyViewerComponent {
  /**
   * The graph to draw. A single node is the root of a tree; an array is a forest,
   * which is how you feed a flat set of items that has no natural root — e.g. the
   * specs of a plan, related only by `dependsOn`.
   */
  readonly root = input.required<DependencyNode | DependencyNode[]>();
  readonly direction = input<DependencyDirection>('horizontal');
  readonly height = input('500px');

  /**
   * `tree` (default) places nodes by their depth in the `children` nesting, and
   * draws `dependsOn` links over the top as cross-references.
   *
   * `layered` places them by their depth in the *dependency* graph: a node always
   * sits past everything it depends on, transitively, and nodes that depend on
   * nothing start the first layer. That makes `direction="horizontal"` read as an
   * order of work — left to right — which a tree layout can only approximate by
   * first throwing away every link that doesn't fit a single-parent hierarchy.
   *
   * Use `layered` for process, sequencing and impact views; `tree` for containment
   * hierarchies, where the nesting *is* the structure.
   */
  readonly layout = input<DependencyLayout>('tree');
  readonly showToolbar = input(true);
  readonly showEdgeLabels = input(true);
  readonly edgeWidth = input(1.5);

  /**
   * Scales and centres the graph so that all of it fits the canvas, and re-fits
   * whenever the container or the graph changes size. Turns the viewer into an
   * overview: nothing to pan or zoom to, everything visible at once.
   *
   * Shrinks only — the fit never enlarges past 100%, so a two-node graph keeps its
   * natural size instead of ballooning to fill the frame.
   *
   * Pair with `interactive: false` for a purely static display.
   *
   * Shorthand for `fitMode="contain"`, which supersedes it.
   */
  readonly autoFit = input(false);

  /**
   * How the graph is scaled into the frame. Defaults to `autoFit`'s setting —
   * `contain` when it is on, `none` when it isn't — and overrides it when set.
   *
   * `contain` fits both axes, so everything is visible at once but a big graph
   * shrinks to get there. `fit-width` fits the width only and lets the viewer grow
   * as tall as the graph needs, so the nodes keep a readable size and the *page*
   * scrolls; the graph itself never scrolls internally. Past roughly 20 nodes a
   * process view generally wants `fit-width`.
   */
  readonly fitMode = input<DependencyFitMode | null>(null);

  /**
   * Smallest node width, in px, that fitting may shrink to. Below it the fit stops
   * scaling down and lets the graph overflow instead — which `fit-width` turns into
   * page scroll, and `contain` into clipping. Pair it with `fit-width`.
   *
   * Nodes are 160px wide unscaled, so e.g. `80` allows shrinking to half size.
   */
  readonly minNodeSize = input<number | null>(null);

  /**
   * Viewport navigation: drag-to-pan, wheel-zoom and the toolbar's zoom buttons.
   * `false` freezes the viewport — node selection, expansion and collapse keep
   * working, so `nodeSelect` still fires in a static viewer.
   */
  readonly interactive = input(true);

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
  private readonly canvasRef = viewChild<ElementRef<HTMLElement>>('canvas');

  /** Last known layout position of the anchor, to compensate pan after a relayout. */
  private anchorPos: { id: string; x: number; y: number } | null = null;

  private roots = computed<DependencyNode[]>(() => {
    const root = this.root();
    return Array.isArray(root) ? root : [root];
  });

  protected effectiveRoots = computed<DependencyNode[]>(() => {
    const collapsed = this.collapsedIds();
    // One `visited` set across the whole forest: a node reachable from two roots
    // is the same node, and must be pruned identically wherever it turns up.
    const visited = new Set<string>();
    return this.roots().map(root => this.pruneCollapsed(root, collapsed, visited));
  });

  private allOriginalNodes = computed(() => {
    const map = new Map<string, DependencyNode>();
    for (const root of this.roots()) collectAllNodes(root, map);
    return map;
  });

  /**
   * The laid-out graph. Named `graph` rather than `layout` because `layout` is the
   * input that picks *how* it gets laid out.
   */
  protected graph = computed(() => {
    const dir = this.direction();
    const hiddenTypes = new Set(this.hiddenTypes());
    const hiddenRelations = new Set(this.hiddenRelations());
    const allNodes = this.allOriginalNodes();

    const placed = this.layout() === 'layered'
      ? layoutLayered(this.effectiveRoots(), dir, allNodes)
      : this.layoutTree(dir, allNodes);

    const edges = placed.edges.filter(e => !(e.relation && hiddenRelations.has(e.relation)));

    // Type filtering hides nodes and anything still pointing at them. It runs
    // after layout so the remaining nodes keep the positions they'd have anyway —
    // toggling a filter must not reshuffle the whole graph.
    const visibleNodes = hiddenTypes.size
      ? placed.nodes.filter(n => !(n.type && hiddenTypes.has(n.type)))
      : placed.nodes;
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = hiddenTypes.size
      ? edges.filter(e => visibleIds.has(e.sourceId) && visibleIds.has(e.targetId))
      : edges;

    return {
      nodes: visibleNodes,
      edges: visibleEdges,
      nodeMap: placed.nodeMap,
      width: placed.width,
      height: placed.height,
    };
  });

  /**
   * Tree layout over the forest: each root gets its own band along the secondary
   * axis. A `visited` set shared by all of them keeps a node that hangs off two
   * roots from being laid out twice — the second link becomes a cross-reference,
   * exactly as a second parent within one tree does.
   */
  private layoutTree(dir: DependencyDirection, allNodes: Map<string, DependencyNode>) {
    const backEdges: BackEdge[] = [];
    const visited = new Set<string>();
    const measured = this.effectiveRoots().map(root => measureTree(root, 0, dir, visited, backEdges));

    const nodes: LayoutNode[] = [];
    const nodeMap = new Map<string, LayoutNode>();
    const treeEdges: LayoutEdge[] = [];

    let offset = 0;
    for (const measure of measured) {
      if (dir === 'horizontal') {
        layoutTreeH(measure, 0, offset, null, nodes, treeEdges, allNodes, nodeMap);
      } else {
        layoutTreeV(measure, offset, 0, null, nodes, treeEdges, allNodes, nodeMap);
      }
      offset += measure.secondary + V_GAP;
    }

    const primary = measured.length ? Math.max(...measured.map(m => m.primary)) : 0;
    const secondary = Math.max(0, offset - V_GAP);

    return {
      nodes,
      edges: [...treeEdges, ...createCrossRefEdges(nodeMap, allNodes, dir, backEdges)],
      nodeMap,
      width: dir === 'horizontal' ? primary : secondary,
      height: dir === 'horizontal' ? secondary : primary,
    };
  }

  /**
   * Height `fit-width` derived from the graph, or `null` under any other mode.
   *
   * `fit-width` scales to the frame's width and lets the height follow the graph,
   * so a tall graph runs past the frame and the *page* scrolls instead of the nodes
   * shrinking out of legibility. The height is therefore always the graph's, never
   * the frame's — including when the graph is the shorter of the two. Deriving it
   * unconditionally is also what keeps the fit stable: this height becomes the
   * canvas's, so a fit that consulted the canvas height would be reading back its
   * own last output and could flip between two answers forever.
   */
  protected contentHeight = signal<number | null>(null);

  protected effectiveFitMode = computed<DependencyFitMode>(() =>
    this.fitMode() ?? (this.autoFit() ? 'contain' : 'none'),
  );

  /** The host only gives up its configured height when the fit made it grow. */
  protected hostHeight = computed(() => (this.contentHeight() === null ? this.height() : 'auto'));

  /** `minNodeSize` expressed as the scale it forbids fitting to go below. */
  private minFitScale = computed(() => {
    const min = this.minNodeSize();
    if (!min || min <= 0) return MIN_FIT_SCALE;
    return Math.min(MAX_FIT_SCALE, Math.max(MIN_FIT_SCALE, min / NODE_WIDTH));
  });

  constructor() {
    // Keep the anchor node pinned to its screen position across relayouts. A new
    // `root` (an expand step) re-runs the tree layout from scratch, which recentres
    // subtrees and shifts nodes that didn't change — the camera stays put while the
    // graph slides underneath it. Compensating the pan by the anchor's own delta is
    // what makes incremental expansion feel stable.
    effect(() => {
      const nodeMap = this.graph().nodeMap;
      const anchorId = this.anchorNodeId() ?? this.selectedNodeId();

      // Fitting recentres the whole graph on every relayout, which subsumes
      // holding one node still. Running both would have them fight over the pan.
      if (this.effectiveFitMode() !== 'none' || !anchorId) {
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

    // Re-fit when the graph changes shape. Reading `canvasRef` here (rather than
    // only inside `fit`) is what gets the *first* fit to run: the view child
    // resolves after the initial render, which re-triggers this effect at the
    // point the canvas finally has a measurable size.
    effect(() => {
      if (this.effectiveFitMode() === 'none') {
        // Leaving fit-width behind: the grown height was this fit's doing, so it
        // goes with it, or the host keeps a size nothing is maintaining any more.
        untracked(() => this.contentHeight.set(null));
        return;
      }
      if (!this.canvasRef()) return;
      this.graph();
      this.minFitScale();
      untracked(() => this.fit());
    });

    // …and when the container changes size. ResizeObserver delivers an initial
    // callback on observe, so this covers the first fit in a browser too.
    effect(onCleanup => {
      const el = this.canvasRef()?.nativeElement;
      if (this.effectiveFitMode() === 'none' || !el || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.fit());
      observer.observe(el);
      onCleanup(() => observer.disconnect());
    });
  }

  protected svgWidth = computed(() => this.graph().width + 80);
  protected svgHeight = computed(() => this.graph().height + 80);
  protected viewBox = computed(() => `0 0 ${this.svgWidth()} ${this.svgHeight()}`);
  protected transform = computed(() => {
    const z = this.zoom() / 100;
    return `translate(${this.panX()}px, ${this.panY()}px) scale(${z})`;
  });

  // A fitted scale is an arbitrary fraction; the readout is not the source of
  // truth, so it rounds rather than printing "63.41999999%".
  protected zoomLabel = computed(() => Math.round(this.zoom()));

  protected selectedNode = computed<LayoutNode | null>(() => {
    const id = this.selectedNodeId();
    if (!id) return null;
    return this.graph().nodes.find(n => n.id === id) ?? null;
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
    for (const edge of this.graph().edges) {
      // Keyed off the label, not `isCrossRef`: in the layered layout the labelled
      // dependency edges are the main flow, not cross-references.
      if (!edge.label || seen.has(edge.label)) continue;
      seen.set(edge.label, { label: edge.label, color: edge.color, dashed: edge.dashed });
    }
    return Array.from(seen.values());
  });

  protected typeLegendItems = computed(() => {
    const colors = this.typeColors();
    const seen = new Map<string, { type: string; color: string }>();
    for (const node of this.graph().nodes) {
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
    const node = this.graph().nodeMap.get(id);
    if (!node) return;
    const z = this.zoom() / 100;
    const el = this.canvasEl();
    const viewW = el?.clientWidth ?? 0;
    const viewH = el?.clientHeight ?? 0;
    // Invert screen = pan + z * layout for the node's centre.
    this.panX.set(viewW / 2 - (node.x + node.width / 2) * z);
    this.panY.set(viewH / 2 - (node.y + node.height / 2) * z);
    this.anchorPos = { id, x: node.x, y: node.y };
  }

  /**
   * Scales and centres the graph to fit the canvas, per `fitMode`. Called for you
   * when fitting is on; public so a caller can fit on demand without it.
   *
   * No-op while the canvas has no size (before the first render, or in a detached
   * / `display: none` container) — the fit observers re-run once it does.
   */
  fit(): void {
    const mode = this.effectiveFitMode();
    if (mode === 'none') return;

    const el = this.canvasEl();
    const viewW = el?.clientWidth ?? 0;
    const viewH = el?.clientHeight ?? 0;
    if (!viewW || !viewH) return;

    const box = this.contentBox();
    if (box.width <= 0 || box.height <= 0) return;

    // `fit-width` deliberately ignores the height: it is the mode that lets the
    // graph be taller than the frame. That is also what keeps it stable — the
    // height it produces feeds back in as the canvas's own height, and a scale
    // derived from that height would chase itself.
    const natural = mode === 'fit-width'
      ? viewW / box.width
      : Math.min(viewW / box.width, viewH / box.height);
    const scale = Math.min(MAX_FIT_SCALE, Math.max(this.minFitScale(), natural));

    this.zoom.set(scale * 100);
    // Invert screen = pan + scale * layout for the box's top-left corner, so the
    // box lands centred in the canvas.
    this.panX.set((viewW - box.width * scale) / 2 - box.x * scale);

    const scaledHeight = box.height * scale;
    if (mode === 'fit-width') {
      // The viewer takes the graph's height and pins it to the top. Past the frame
      // that means the page scrolls through a readable graph rather than the frame
      // clipping one that was shrunk to fit.
      this.contentHeight.set(Math.ceil(scaledHeight));
      this.panY.set(-box.y * scale);
    } else {
      this.contentHeight.set(null);
      this.panY.set((viewH - scaledHeight) / 2 - box.y * scale);
    }
    // The camera just moved deliberately; a stale anchor baseline would have the
    // next relayout "correct" a position this fit had already chosen.
    this.anchorPos = null;
  }

  /**
   * Restores the initial view — the fitted one under `autoFit`, otherwise the
   * default zoom and pan.
   */
  resetView(): void {
    if (this.effectiveFitMode() !== 'none') {
      this.fit();
      return;
    }
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

  // ── Viewport measurement ───────────────────────────────────────────────────

  private canvasEl(): HTMLElement | null {
    return (
      this.canvasRef()?.nativeElement ??
      this.hostEl.nativeElement.querySelector('.dep-viewer__canvas')
    );
  }

  /**
   * Bounding box of everything drawn, in layout units.
   *
   * Edge label points stand in for the edges themselves. A parent→child edge stays
   * inside the node boxes anyway, and a bowed cross-reference puts its label at the
   * apex of the bow — the only part of it that reaches outside them.
   */
  private contentBox(): { x: number; y: number; width: number; height: number } {
    const { nodes, edges } = this.graph();
    if (!nodes.length) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }
    for (const e of edges) {
      minX = Math.min(minX, e.labelX);
      minY = Math.min(minY, e.labelY);
      maxX = Math.max(maxX, e.labelX);
      maxY = Math.max(maxY, e.labelY);
    }

    return {
      x: minX - FIT_PADDING,
      y: minY - FIT_PADDING,
      width: maxX - minX + FIT_PADDING * 2,
      height: maxY - minY + FIT_PADDING * 2,
    };
  }

  protected onMouseDown(event: MouseEvent): void {
    if (!this.interactive() || event.button !== 0) return;
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
    // Return *before* preventDefault: a static viewer must not swallow the wheel
    // event, or the page can't be scrolled past it.
    if (!this.interactive()) return;
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
