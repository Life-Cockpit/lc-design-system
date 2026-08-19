import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Signal, WritableSignal, signal } from '@angular/core';
import {
  DependencyViewerComponent,
  DependencyNode,
  DependencyDirection,
  DependencyRelation,
  DependencyLayout,
  DependencyFitMode,
} from './dependency-viewer.component';

@Component({
  standalone: true,
  imports: [DependencyViewerComponent],
  template: `<lc-dependency-viewer
    [root]="root()"
    [layout]="layout()"
    [fitMode]="fitMode()"
    [minNodeSize]="minNodeSize()"
    [direction]="direction()"
    [showToolbar]="showToolbar()"
    [showEdgeLabels]="showEdgeLabels()"
    [typeColors]="typeColors()"
    [hiddenRelations]="hiddenRelations()"
    [hiddenTypes]="hiddenTypes()"
    [anchorNodeId]="anchorNodeId()"
    [autoFit]="autoFit()"
    [interactive]="interactive()"
  />`,
})
class TestHost {
  root = signal<DependencyNode | DependencyNode[]>({
    id: 'root',
    label: 'Root',
    children: [
      { id: 'a', label: 'A', status: 'success' },
      {
        id: 'b',
        label: 'B',
        status: 'warning',
        children: [{ id: 'b1', label: 'B1' }],
      },
    ],
  });
  layout = signal<DependencyLayout>('tree');
  fitMode = signal<DependencyFitMode | null>(null);
  minNodeSize = signal<number | null>(null);
  direction = signal<DependencyDirection>('horizontal');
  showToolbar = signal(true);
  showEdgeLabels = signal(true);
  typeColors = signal<Record<string, string>>({});
  hiddenRelations = signal<DependencyRelation[]>([]);
  hiddenTypes = signal<string[]>([]);
  anchorNodeId = signal<string | null>(null);
  autoFit = signal(false);
  interactive = signal(true);
}

describe('DependencyViewerComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  // ── Basic rendering ────────────────────────────────────────────

  it('should create the component', () => {
    expect(el.querySelector('lc-dependency-viewer')).toBeTruthy();
  });

  it('should render nodes for all items', () => {
    const nodes = el.querySelectorAll('.dep-viewer__node');
    expect(nodes.length).toBe(4); // root, a, b, b1
  });

  it('should render tree edges', () => {
    const edges = el.querySelectorAll('.dep-viewer__edge');
    expect(edges.length).toBe(3); // root→a, root→b, b→b1
  });

  it('should show node labels', () => {
    const labels = el.querySelectorAll('.dep-viewer__node-label');
    const texts = Array.from(labels).map(l => l.textContent?.trim());
    expect(texts).toContain('Root');
    expect(texts).toContain('A');
    expect(texts).toContain('B');
    expect(texts).toContain('B1');
  });

  // ── Toolbar ──────────────────────────────────────────────────

  it('should show toolbar by default', () => {
    expect(el.querySelector('.dep-viewer__toolbar')).toBeTruthy();
  });

  it('should hide toolbar when showToolbar is false', () => {
    host.showToolbar.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.dep-viewer__toolbar')).toBeFalsy();
  });

  it('should show direction indicator', () => {
    const label = el.querySelector('.dep-viewer__direction-label');
    expect(label?.textContent?.trim()).toBe('→');
  });

  // ── Zoom ───────────────────────────────────────────────────

  it('should show initial zoom at 100%', () => {
    const z = el.querySelector('.dep-viewer__zoom');
    expect(z?.textContent?.trim()).toBe('100%');
  });

  it('should zoom in when + clicked', () => {
    const btns = el.querySelectorAll('.dep-viewer__btn');
    (btns[0] as HTMLElement).click();
    fixture.detectChanges();
    const z = el.querySelector('.dep-viewer__zoom');
    expect(z?.textContent?.trim()).toBe('125%');
  });

  it('should zoom out when − clicked', () => {
    const btns = el.querySelectorAll('.dep-viewer__btn');
    (btns[1] as HTMLElement).click();
    fixture.detectChanges();
    const z = el.querySelector('.dep-viewer__zoom');
    expect(z?.textContent?.trim()).toBe('75%');
  });

  // ── Node selection ─────────────────────────────────────────

  it('should show detail panel on node click', () => {
    expect(el.querySelector('.dep-viewer__detail')).toBeFalsy();
    const node = el.querySelector('.dep-viewer__node') as SVGElement;
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.dep-viewer__detail')).toBeTruthy();
  });

  it('should deselect on canvas click', () => {
    const node = el.querySelector('.dep-viewer__node') as SVGElement;
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.dep-viewer__detail')).toBeTruthy();
    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    canvas.click();
    fixture.detectChanges();
    expect(el.querySelector('.dep-viewer__detail')).toBeFalsy();
  });

  // ── Collapse/expand ────────────────────────────────────────

  it('should show collapse toggle for nodes with children', () => {
    const toggles = el.querySelectorAll('.dep-viewer__toggle');
    // root (has children) and b (has children)
    expect(toggles.length).toBe(2);
  });

  it('should collapse subtree on toggle click', () => {
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(4);
    const toggle = el.querySelectorAll('.dep-viewer__toggle')[1] as SVGElement;
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    // B1 should be gone
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(3);
  });

  it('should re-expand subtree on second toggle click', () => {
    const toggle = el.querySelectorAll('.dep-viewer__toggle')[1] as SVGElement;
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(3);
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(4);
  });

  // ── Vertical direction ─────────────────────────────────────

  it('should render in vertical mode', () => {
    host.direction.set('vertical');
    fixture.detectChanges();
    const label = el.querySelector('.dep-viewer__direction-label');
    expect(label?.textContent?.trim()).toBe('↓');
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(4);
  });

  it('should place toggle below node in vertical mode', () => {
    host.direction.set('vertical');
    fixture.detectChanges();
    const toggleCircle = el.querySelector('.dep-viewer__toggle circle') as SVGCircleElement;
    const nodeRect = el.querySelector('.dep-viewer__node rect') as SVGRectElement;
    const cy = parseFloat(toggleCircle.getAttribute('cy')!);
    const nodeY = parseFloat(nodeRect.getAttribute('y')!);
    const nodeH = parseFloat(nodeRect.getAttribute('height')!);
    expect(cy).toBeGreaterThan(nodeY + nodeH - 1);
  });

  // ── Cross-reference edges (dependsOn) ──────────────────────

  it('should render cross-reference edges', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'blocks' }] },
      ],
    });
    fixture.detectChanges();
    const crossEdges = el.querySelectorAll('.dep-viewer__edge--cross-ref');
    expect(crossEdges.length).toBe(1);
  });

  it('should show edge labels for cross-reference edges', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'references' }] },
      ],
    });
    fixture.detectChanges();
    const labels = el.querySelectorAll('.dep-viewer__edge-label');
    expect(labels.length).toBe(1);
    expect(labels[0].textContent?.trim()).toBe('references');
  });

  it('should hide edge labels when showEdgeLabels is false', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'blocks' }] },
      ],
    });
    host.showEdgeLabels.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__edge-label').length).toBe(0);
  });

  it('should show dashed edges for referencing relations', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'references' }] },
      ],
    });
    fixture.detectChanges();
    const crossEdge = el.querySelector('.dep-viewer__edge--cross-ref') as SVGPathElement;
    expect(crossEdge.getAttribute('stroke-dasharray')).toBe('6 3');
  });

  // ── Legend ─────────────────────────────────────────────────

  it('should show legend when cross-reference edges exist', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'blocks' }] },
      ],
    });
    fixture.detectChanges();
    expect(el.querySelector('.dep-viewer__legend')).toBeTruthy();
    const items = el.querySelectorAll('.dep-viewer__legend-text');
    expect(items.length).toBe(1);
    expect(items[0].textContent?.trim()).toBe('blocks');
  });

  it('should not show legend when no cross-reference edges', () => {
    fixture.detectChanges();
    expect(el.querySelector('.dep-viewer__legend')).toBeFalsy();
  });

  // ── Detail panel with dependencies ────────────────────────

  it('should show dependency info in detail panel', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      description: 'The root node',
      children: [
        { id: 'a', label: 'A' },
        {
          id: 'b',
          label: 'B',
          dependsOn: [{ id: 'a', relation: 'requires' }],
        },
      ],
    });
    fixture.detectChanges();

    // Click on node B
    const nodes = el.querySelectorAll('.dep-viewer__node');
    const nodeB = Array.from(nodes).find(n => n.querySelector('.dep-viewer__node-label')?.textContent?.trim() === 'B');
    nodeB!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    const detail = el.querySelector('.dep-viewer__detail');
    expect(detail).toBeTruthy();
    expect(detail!.querySelector('.dep-viewer__detail-deps')).toBeTruthy();
    expect(detail!.querySelector('.dep-viewer__dep-relation')?.textContent?.trim()).toBe('requires');
  });

  // ── Status colors ─────────────────────────────────────────

  it('should apply status-specific fill to nodes', () => {
    // …__node-fill, not just `rect`: each node also carries an opaque backdrop
    // rect beneath the (translucent) status fill.
    const rects = el.querySelectorAll('.dep-viewer__node .dep-viewer__node-fill');
    const firstFill = rects[0].getAttribute('fill');
    expect(firstFill).toBeTruthy();
    // Second node (A) has status 'success'
    const secondFill = rects[1].getAttribute('fill');
    expect(secondFill).toBeTruthy();
    expect(firstFill).not.toBe(secondFill);
  });

  it('should back every node with an opaque rect beneath the status fill', () => {
    for (const node of Array.from(el.querySelectorAll('.dep-viewer__node'))) {
      const rects = Array.from(node.querySelectorAll('rect'));
      // The backdrop must be painted first, or a translucent status tint would let
      // the edges routed behind the node show through it.
      expect(rects[0].classList).toContain('dep-viewer__node-backdrop');
      expect(rects[1].classList).toContain('dep-viewer__node-fill');
    }
  });

  // ── Cross-refs in vertical mode ────────────────────────────

  it('should render cross-refs in vertical direction', () => {
    host.direction.set('vertical');
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'uses' }] },
      ],
    });
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__edge--cross-ref').length).toBe(1);
  });

  // ── Arrow markers ─────────────────────────────────────────

  it('should have arrowhead marker on cross-reference edges', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'blocks' }] },
      ],
    });
    fixture.detectChanges();
    const crossEdge = el.querySelector('.dep-viewer__edge--cross-ref') as SVGPathElement;
    expect(crossEdge.getAttribute('marker-end')).toContain('arrow-blocks');
  });

  it('should not have arrowhead on tree edges', () => {
    const treeEdges = el.querySelectorAll('.dep-viewer__edge:not(.dep-viewer__edge--cross-ref)');
    for (const edge of Array.from(treeEdges)) {
      const marker = edge.getAttribute('marker-end');
      expect(!marker || marker === '').toBeTruthy();
    }
  });

  // ── Graph tolerance ────────────────────────────────────────────
  // The input is a tree, but callers explore graphs. Both cases below used to be
  // fatal or wrong; they must now degrade to a cross-reference edge.

  it('should survive a cycle instead of overflowing the stack', () => {
    const b: DependencyNode = { id: 'b', label: 'B' };
    const a: DependencyNode = { id: 'a', label: 'A', children: [b] };
    b.children = [a]; // closes the loop: a → b → a

    expect(() => {
      host.root.set(a);
      fixture.detectChanges();
    }).not.toThrow();

    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(2);
    expect(el.querySelectorAll('.dep-viewer__edge--cross-ref').length).toBe(1);
  });

  it('should render a node reachable from two parents exactly once', () => {
    const shared: DependencyNode = { id: 'shared', label: 'Shared' };
    host.root.set({
      id: 'r',
      label: 'R',
      children: [
        { id: 'p1', label: 'P1', children: [shared] },
        { id: 'p2', label: 'P2', children: [shared] },
      ],
    });
    fixture.detectChanges();

    const labels = Array.from(el.querySelectorAll('.dep-viewer__node-label')).map(n => n.textContent);
    expect(labels.filter(l => l === 'Shared').length).toBe(1);
    // …and the second parent's link survives as a cross-reference.
    expect(el.querySelectorAll('.dep-viewer__edge--cross-ref').length).toBe(1);
  });

  // ── Edge routing ───────────────────────────────────────────────
  // Cross-references join arbitrary pairs, so they can cut across unrelated nodes
  // — which reads as an edge vanishing behind a box. Parent→child edges always run
  // down the gutter and never do. Endpoints are excluded: a path necessarily
  // touches its own source and target.

  // Samples the rendered path in SVG user space and reports which foreign node
  // boxes it enters. Mirrors what the eye sees, independent of the routing code.
  const nodeBoxes = () =>
    Array.from(el.querySelectorAll('.dep-viewer__node')).map(g => {
      const r = g.querySelector('rect') as SVGRectElement;
      return {
        id: g.querySelector('.dep-viewer__node-label')?.textContent?.trim() ?? '',
        x: +(r.getAttribute('x') ?? 0),
        y: +(r.getAttribute('y') ?? 0),
        w: +(r.getAttribute('width') ?? 0),
        h: +(r.getAttribute('height') ?? 0),
      };
    });

  // jsdom has no SVG geometry engine (getPointAtLength is unimplemented), so
  // evaluate the cubic from the `d` attribute directly.
  const sampleCubic = (d: string) => {
    const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    const [x0, y0, x1, y1, x2, y2, x3, y3] = nums;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const m = 1 - t;
      pts.push({
        x: m * m * m * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x3,
        y: m * m * m * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y3,
      });
    }
    return pts;
  };

  const crossingsOf = (edge: Element, endpoints: string[]) => {
    const pts = sampleCubic(edge.getAttribute('d') ?? '');
    return nodeBoxes()
      .filter(b => !endpoints.includes(b.id))
      .filter(b => pts.some(p => p.x > b.x + 3 && p.x < b.x + b.w - 3 && p.y > b.y + 3 && p.y < b.y + b.h - 3))
      .map(b => b.id);
  };

  it('should route a cross-reference around a node that sits in its way', () => {
    // 'far' depends on 'near'; 'blocker' sits between them, so the direct curve
    // from near → far would cut straight through it.
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'near', label: 'Near' },
        { id: 'blocker', label: 'Blocker' },
        { id: 'far', label: 'Far', dependsOn: [{ id: 'near', relation: 'blocks' }] },
      ],
    });
    fixture.detectChanges();

    const crossRef = el.querySelector('.dep-viewer__edge--cross-ref') as SVGPathElement;
    expect(crossingsOf(crossRef, ['Near', 'Far'])).toEqual([]);
  });

  it('should leave a clear cross-reference to a later column on its direct route', () => {
    // 'b1' depends on 'a', one column back and nothing in between: the gutter
    // S-curve is the route, and it must not detour over or under the rows.
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1', dependsOn: [{ id: 'a', relation: 'blocks' }] }] },
      ],
    });
    fixture.detectChanges();

    const crossRef = el.querySelector('.dep-viewer__edge--cross-ref') as SVGPathElement;
    const boxes = nodeBoxes();
    const lowest = Math.max(...boxes.map(b => b.y + b.h));
    const highest = Math.min(...boxes.map(b => b.y));
    const pts = sampleCubic(crossRef.getAttribute('d') ?? '');
    expect(Math.max(...pts.map(p => p.y))).toBeLessThanOrEqual(lowest + 1);
    expect(Math.min(...pts.map(p => p.y))).toBeGreaterThanOrEqual(highest - 1);
  });

  // ── Sibling cross-references ─────────────────────────────────
  // Two nodes in the same column have no gutter between them. The old "direct"
  // S-curve ran backwards through both endpoints and surfaced only in the gap
  // between them — a diagonal stub that read as an edge from nowhere to nowhere.

  const box = (label: string) => nodeBoxes().find(b => b.id === label)!;

  it('should route a cross-reference between siblings beside the column, not through it', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'requires' }] },
      ],
    });
    fixture.detectChanges();

    const crossRef = el.querySelector('.dep-viewer__edge--cross-ref') as SVGPathElement;
    const pts = sampleCubic(crossRef.getAttribute('d') ?? '');
    const a = box('A');
    const b = box('B');
    // Every point of the path lies on or beyond the column's right edge…
    const columnRight = Math.max(a.x + a.w, b.x + b.w);
    for (const p of pts) expect(p.x).toBeGreaterThanOrEqual(columnRight - 0.01);
    // …and it clears the boxes by a visible margin at its apex.
    expect(Math.max(...pts.map(p => p.x))).toBeGreaterThan(columnRight + 20);
    // It stays within the rows it connects — no dip below or rise above them.
    expect(Math.min(...pts.map(p => p.y))).toBeGreaterThanOrEqual(a.y);
    expect(Math.max(...pts.map(p => p.y))).toBeLessThanOrEqual(b.y + b.h);
  });

  it('should spread overlapping sibling bows into distinct lanes', () => {
    // Three siblings all depending on the first: three bows down the same side,
    // sharing a start point. Drawn at one clearance they'd lie on top of each
    // other and read as one edge with three arrowheads.
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'requires' }] },
        { id: 'c', label: 'C', dependsOn: [{ id: 'a', relation: 'requires' }] },
        { id: 'd', label: 'D', dependsOn: [{ id: 'a', relation: 'requires' }] },
      ],
    });
    fixture.detectChanges();

    const crossRefs = Array.from(el.querySelectorAll('.dep-viewer__edge--cross-ref'));
    expect(crossRefs.length).toBe(3);
    const apexes = crossRefs.map(e => Math.max(...sampleCubic(e.getAttribute('d') ?? '').map(p => p.x)));
    // Every apex is its own — no two bows peak at the same distance…
    expect(new Set(apexes.map(x => Math.round(x))).size).toBe(3);
    // …and they nest: at least a lane's width between neighbours.
    const sorted = [...apexes].sort((x, y) => x - y);
    expect(sorted[1] - sorted[0]).toBeGreaterThanOrEqual(12);
    expect(sorted[2] - sorted[1]).toBeGreaterThanOrEqual(12);
    // Nothing runs through the sibling in between.
    for (const e of crossRefs) {
      const through = crossingsOf(e, ['A', 'B', 'C', 'D']);
      expect(through).toEqual([]);
    }
  });

  it('should attach a sideways bow beside the collapse toggle of a node with children', () => {
    // 'B' has children, so its right side carries the toggle disc at its midpoint.
    // An arrowhead delivered under the disc is invisible — the bow attaches beside it.
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1' }], dependsOn: [{ id: 'a', relation: 'requires' }] },
      ],
    });
    fixture.detectChanges();

    const crossRef = el.querySelector('.dep-viewer__edge--cross-ref') as SVGPathElement;
    const nums = (crossRef.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g)!.map(Number);
    const endY = nums[nums.length - 1];
    const b = box('B');
    const midY = b.y + b.h / 2;
    // Beside the disc (radius 8), still on the box's edge.
    expect(Math.abs(endY - midY)).toBeGreaterThan(8);
    expect(endY).toBeGreaterThan(b.y);
    expect(endY).toBeLessThan(b.y + b.h);
  });

  it('should widen the gutter when sibling bows would reach the next column', () => {
    // 'A' has a child in the next column, so its bows swing into an inner gutter.
    // Three nested lanes plus the toggle disc need more than the default 80px —
    // the next column has to move over rather than have the bows run into it.
    const roomy = (deps: number) => ({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] },
        ...Array.from({ length: deps }, (_, i) => ({
          id: `s${i}`, label: `S${i}`, dependsOn: [{ id: 'a', relation: 'requires' as const }],
        })),
      ],
    });

    host.root.set(roomy(0));
    fixture.detectChanges();
    const plain = box('A1').x - (box('A').x + box('A').w);

    host.root.set(roomy(3));
    fixture.detectChanges();
    const widened = box('A1').x - (box('A').x + box('A').w);
    expect(widened).toBeGreaterThan(plain);

    // And the bows do stay out of the next column.
    for (const e of Array.from(el.querySelectorAll('.dep-viewer__edge--cross-ref'))) {
      expect(crossingsOf(e, ['A', 'S0', 'S1', 'S2'])).toEqual([]);
    }
  });

  // ── Label fitting ────────────────────────────────────────────
  // Boxes are one size per graph. Short labels keep the 160px box; a long one
  // widens every box up to a cap, and past the cap labels wrap and then truncate.

  // The node group whose label starts with `prefix` — a wrapped label's text is
  // its lines run together, so match on the start rather than the whole.
  const labelOf = (prefix: string) =>
    Array.from(el.querySelectorAll('.dep-viewer__node')).find(n =>
      n.querySelector('.dep-viewer__node-label')?.textContent?.startsWith(prefix),
    )!;

  it('should keep the default box for short labels', () => {
    const r = el.querySelector('.dep-viewer__node-fill') as SVGRectElement;
    expect(r.getAttribute('width')).toBe('160');
    expect(r.getAttribute('height')).toBe('40');
  });

  it('should widen every box for a long label, up to a cap', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [{ id: 'long', label: 'A label that is a good deal longer than the box' }],
    });
    fixture.detectChanges();

    const widths = Array.from(el.querySelectorAll('.dep-viewer__node-fill')).map(r => +(r.getAttribute('width') ?? 0));
    expect(new Set(widths).size).toBe(1); // one size per graph
    expect(widths[0]).toBeGreaterThan(160);
    expect(widths[0]).toBeLessThanOrEqual(240);
  });

  it('should wrap a label the widest box cannot hold onto a second line', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [{ id: 'long', label: 'A very long label that certainly exceeds the widest box the viewer allows' }],
    });
    fixture.detectChanges();

    const g = labelOf('A very long');
    const spans = g.querySelectorAll('.dep-viewer__node-label tspan');
    expect(spans.length).toBe(2);
    // Two lines: the graph switches to the taller box.
    const r = g.querySelector('.dep-viewer__node-fill') as SVGRectElement;
    expect(r.getAttribute('width')).toBe('240');
    expect(+(r.getAttribute('height') ?? 0)).toBeGreaterThan(40);
    // The second line continues below the first, both centred on the box.
    expect(spans[1].getAttribute('dy')).not.toBe('0');
    expect(spans[0].getAttribute('x')).toBe(spans[1].getAttribute('x'));
  });

  it('should ellipsise what two lines cannot hold and offer the full label as a tooltip', () => {
    const label = 'An extremely long label that goes on and on well past what even two lines of the widest box could ever hold';
    host.root.set({ id: 'root', label: 'Root', children: [{ id: 'long', label }] });
    fixture.detectChanges();

    const g = labelOf('An extremely');
    const spans = Array.from(g.querySelectorAll('.dep-viewer__node-label tspan'));
    expect(spans.length).toBe(2);
    expect(spans[1].textContent?.endsWith('…')).toBe(true);
    expect(g.querySelector('title')?.textContent).toBe(label);
  });

  it('should not add a tooltip to a label that fits', () => {
    expect(el.querySelector('.dep-viewer__node title')).toBeNull();
  });

  it('should keep the box size stable when a subtree is collapsed', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [{ id: 'p', label: 'P', children: [{ id: 'long', label: 'A label that is a good deal longer than the box' }] }],
    });
    fixture.detectChanges();
    const before = (el.querySelector('.dep-viewer__node-fill') as SVGRectElement).getAttribute('width');

    viewerOf().collapse('p');
    fixture.detectChanges();
    const after = (el.querySelector('.dep-viewer__node-fill') as SVGRectElement).getAttribute('width');
    expect(after).toBe(before);
    expect(before).not.toBe('160');
  });

  it('should never route a parent→child edge through another node', () => {
    fixture.detectChanges();
    const treeEdges = Array.from(
      el.querySelectorAll('.dep-viewer__edge:not(.dep-viewer__edge--cross-ref)'),
    );
    expect(treeEdges.length).toBeGreaterThan(0);
    for (const e of treeEdges) {
      // endpoints unknown per edge here, so allow any box the path legitimately
      // touches at its ends by checking the *interior* sample range only
      const pts = sampleCubic(e.getAttribute('d') ?? '').slice(6, 19);
      const through = nodeBoxes().filter(b =>
        pts.some(p => p.x > b.x + 3 && p.x < b.x + b.w - 3 && p.y > b.y + 3 && p.y < b.y + b.h - 3),
      );
      expect(through).toEqual([]);
    }
  });

  // ── Outputs ────────────────────────────────────────────────────

  it('should emit nodeSelect with the original node including data', () => {
    const emitted: DependencyNode[] = [];
    const viewer = fixture.debugElement.children[0].componentInstance as DependencyViewerComponent;
    viewer.nodeSelect.subscribe((n: DependencyNode) => emitted.push(n));

    host.root.set({
      id: 'root',
      label: 'Root',
      children: [{ id: 'a', label: 'A', data: { key: 'k1', file_path: 'src/a.ts' } }],
    });
    fixture.detectChanges();

    const nodeA = Array.from(el.querySelectorAll('.dep-viewer__node')).find(n =>
      n.textContent?.includes('A'),
    ) as SVGGElement;
    nodeA.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe('a');
    expect(emitted[0].data).toEqual({ key: 'k1', file_path: 'src/a.ts' });
  });

  it('should not emit nodeSelect when deselecting', () => {
    const emitted: DependencyNode[] = [];
    const viewer = fixture.debugElement.children[0].componentInstance as DependencyViewerComponent;
    viewer.nodeSelect.subscribe((n: DependencyNode) => emitted.push(n));

    const node = el.querySelector('.dep-viewer__node') as SVGGElement;
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    node.dispatchEvent(new MouseEvent('click', { bubbles: true })); // toggles off
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
  });

  it('should emit nodeExpand on double-click and keep the node selected', () => {
    const emitted: DependencyNode[] = [];
    const viewer = fixture.debugElement.children[0].componentInstance as DependencyViewerComponent;
    viewer.nodeExpand.subscribe((n: DependencyNode) => emitted.push(n));

    const node = el.querySelector('.dep-viewer__node') as SVGGElement;
    node.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe('root');
    expect(el.querySelector('.dep-viewer__node--selected')).toBeTruthy();
  });

  // ── Free-form relation labels ──────────────────────────────────

  it('should render a free-form relationLabel verbatim', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relationLabel: 'CALLS' }] },
      ],
    });
    fixture.detectChanges();

    const labels = Array.from(el.querySelectorAll('.dep-viewer__edge-label')).map(n => n.textContent);
    expect(labels).toContain('CALLS');
  });

  it('should paint edge labels after the nodes so they cannot be covered', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relationLabel: 'CALLS' }] },
      ],
    });
    fixture.detectChanges();

    // SVG paints in document order, so the label must come after every node.
    const svg = el.querySelector('.dep-viewer__svg') as SVGSVGElement;
    const kids = Array.from(svg.children);
    const lastNode = kids.map(k => k.classList.contains('dep-viewer__node')).lastIndexOf(true);
    const firstLabel = kids.findIndex(k => k.classList.contains('dep-viewer__edge-label'));

    expect(lastNode).toBeGreaterThan(-1);
    expect(firstLabel).toBeGreaterThan(-1);
    expect(firstLabel).toBeGreaterThan(lastNode);
  });

  it('should drop edge labels when showEdgeLabels is false', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relationLabel: 'CALLS' }] },
      ],
    });
    host.showEdgeLabels.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__edge-label').length).toBe(0);
  });

  it('should fall back to a valid arrow marker for an unstyled relation', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relationLabel: 'HAS_COLUMN' }] },
      ],
    });
    fixture.detectChanges();

    const crossEdge = el.querySelector('.dep-viewer__edge--cross-ref') as SVGPathElement;
    // Must point at a marker that exists in <defs>, not `url(#arrow-undefined)`.
    expect(crossEdge.getAttribute('marker-end')).toBe('url(#arrow-depends)');
  });

  // ── moreCount / type ───────────────────────────────────────────

  it('should render a "+N" marker for capped neighbourhoods', () => {
    host.root.set({ id: 'root', label: 'Root', moreCount: 42 });
    fixture.detectChanges();
    expect(el.querySelector('.dep-viewer__more')?.textContent).toContain('+42');
  });

  it('should colour a node by type, overriding status, and list it in the type legend', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [{ id: 'a', label: 'A', type: 'Class', status: 'error' }],
    });
    host.typeColors.set({ Class: 'rgb(18, 52, 86)' });
    fixture.detectChanges();

    const rects = Array.from(el.querySelectorAll('.dep-viewer__node rect'));
    const fills = rects.map(r => r.getAttribute('fill'));
    expect(fills).toContain('rgb(18, 52, 86)'); // type wins over the error status

    const legend = Array.from(el.querySelectorAll('.dep-viewer__legend-text')).map(n => n.textContent);
    expect(legend).toContain('Class');
  });

  it('should pick label ink that contrasts with the type colour', () => {
    // A type colour comes from the caller, so it can be light while the theme is
    // dark (or the reverse). No theme token survives that — the ink has to follow
    // the colour's own luminance.
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'pale', label: 'Pale', type: 'Light' },
        { id: 'deep', label: 'Deep', type: 'Dark' },
      ],
    });
    host.typeColors.set({ Light: '#f1d3a7', Dark: '#144f5b' });
    fixture.detectChanges();

    const inkOf = (label: string) =>
      Array.from(el.querySelectorAll('.dep-viewer__node-label'))
        .find(n => n.textContent?.trim() === label)
        ?.getAttribute('fill');

    expect(inkOf('Pale')).toBe('#111827'); // dark ink on the pale tile
    expect(inkOf('Deep')).toBe('#f9fafb'); // light ink on the deep tile
  });

  it('should fall back to theme ink for an unparseable type colour', () => {
    host.root.set({ id: 'root', label: 'Root', children: [{ id: 'a', label: 'A', type: 'Var' }] });
    host.typeColors.set({ Var: 'var(--some-consumer-token)' });
    fixture.detectChanges();

    const ink = Array.from(el.querySelectorAll('.dep-viewer__node-label'))
      .find(n => n.textContent?.trim() === 'A')
      ?.getAttribute('fill');
    expect(ink).toBe('var(--color-text-primary)');
  });

  it('should keep using status when the node has no type colour', () => {
    host.root.set({ id: 'root', label: 'Root', children: [{ id: 'a', label: 'A', status: 'error' }] });
    host.typeColors.set({ Class: 'rgb(18, 52, 86)' });
    fixture.detectChanges();

    const fills = Array.from(el.querySelectorAll('.dep-viewer__node rect')).map(r => r.getAttribute('fill'));
    expect(fills).not.toContain('rgb(18, 52, 86)');
  });

  // ── Filters ────────────────────────────────────────────────────

  it('should hide edges of a filtered relation', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'blocks' }] },
      ],
    });
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__edge--cross-ref').length).toBe(1);

    host.hiddenRelations.set(['blocks']);
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__edge--cross-ref').length).toBe(0);
  });

  it('should hide nodes of a filtered type', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A', type: 'Class' },
        { id: 'b', label: 'B', type: 'Table' },
      ],
    });
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(3);

    host.hiddenTypes.set(['Table']);
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(2);
  });

  // ── Imperative API ─────────────────────────────────────────────

  it('should expand and collapse programmatically', () => {
    const viewer = fixture.debugElement.children[0].componentInstance as DependencyViewerComponent;

    viewer.collapse('b');
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(3); // b1 pruned

    viewer.expand('b');
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(4);

    viewer.collapseAll();
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(1); // only root

    viewer.expandAll();
    fixture.detectChanges();
    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(4);
  });

  // ── Viewport stability across [root] updates (incremental loading) ──
  // Pan/zoom/collapse/selection already survive a root swap — they live in signals
  // with no reset path. What doesn't survive is the layout: it recentres subtrees,
  // so untouched nodes move and the camera, standing still, ends up looking
  // somewhere else. These pin the compensation that fixes that.

  // Reaching into the protected signals: the viewport maths is internal, but its
  // observable effect (where a node lands on screen) is exactly what these assert.
  interface ViewerInternals {
    zoom: WritableSignal<number>;
    panX: WritableSignal<number>;
    panY: WritableSignal<number>;
    selectedNodeId: WritableSignal<string | null>;
    contentHeight: Signal<number | null>;
    graph: Signal<{
      nodeMap: Map<string, { x: number; y: number; depth: number }>;
      edges: { sourceId: string; targetId: string; isCrossRef: boolean; dashed: boolean }[];
    }>;
  }
  const viewerOf = () =>
    fixture.debugElement.children[0].componentInstance as unknown as DependencyViewerComponent &
      ViewerInternals;

  const nodeIn = (id: string) => {
    const n = viewerOf().graph().nodeMap.get(id);
    if (!n) throw new Error(`node ${id} is not laid out`);
    return n;
  };
  // Asserting the *precondition*: if a scenario doesn't actually move the anchor in
  // layout space, the screen-position assertion holds trivially and proves nothing.
  const layoutPos = (id: string) => ({ x: nodeIn(id).x, y: nodeIn(id).y });
  const screenPos = (id: string) => {
    const v = viewerOf();
    const n = nodeIn(id);
    const z = v.zoom() / 100;
    return { x: v.panX() + n.x * z, y: v.panY() + n.y * z };
  };

  // A sibling inserted *before* the anchor pushes it down — inserting after it
  // wouldn't move it at all, and the test would pass without any compensation.
  const growWithSiblingBefore = () =>
    host.root.set({
      id: 'r',
      label: 'R',
      children: [
        { id: 'c', label: 'C' },
        { id: 'a', label: 'A' },
      ],
    });

  it('should keep the anchor node at the same screen position when siblings arrive', () => {
    host.root.set({ id: 'r', label: 'R', children: [{ id: 'a', label: 'A' }] });
    host.anchorNodeId.set('a');
    fixture.detectChanges();

    const layoutBefore = layoutPos('a');
    const screenBefore = screenPos('a');

    growWithSiblingBefore();
    fixture.detectChanges();

    expect(layoutPos('a')).not.toEqual(layoutBefore); // the layout really did move it
    expect(screenPos('a')).toEqual(screenBefore); // …and the camera followed
  });

  it('should compensate correctly while zoomed (delta scales with zoom)', () => {
    host.root.set({ id: 'r', label: 'R', children: [{ id: 'a', label: 'A' }] });
    host.anchorNodeId.set('a');
    fixture.detectChanges();

    viewerOf().zoom.set(250);
    fixture.detectChanges();

    const layoutBefore = layoutPos('a');
    const screenBefore = screenPos('a');

    growWithSiblingBefore();
    fixture.detectChanges();

    expect(layoutPos('a')).not.toEqual(layoutBefore);
    expect(screenPos('a')).toEqual(screenBefore);
  });

  it('should fall back to the selected node as anchor when none is given', () => {
    host.root.set({ id: 'r', label: 'R', children: [{ id: 'a', label: 'A' }] });
    fixture.detectChanges();

    viewerOf().selectedNodeId.set('a');
    fixture.detectChanges();

    const layoutBefore = layoutPos('a');
    const screenBefore = screenPos('a');

    growWithSiblingBefore();
    fixture.detectChanges();

    expect(layoutPos('a')).not.toEqual(layoutBefore);
    expect(screenPos('a')).toEqual(screenBefore);
  });

  it('should centre a node with focusNode()', () => {
    // focusNode reads the canvas size, which jsdom always reports as 0 — stub it
    // so the centring maths is actually exercised rather than dividing by nothing.
    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });

    const viewer = viewerOf();
    viewer.zoom.set(150);
    viewer.focusNode('b1');
    fixture.detectChanges();

    const n = nodeIn('b1');
    const z = viewer.zoom() / 100;
    // screen = pan + z * layout, so the node's centre must land on the canvas centre
    expect(viewer.panX() + (n.x + 160 / 2) * z).toBeCloseTo(400, 5);
    expect(viewer.panY() + (n.y + 40 / 2) * z).toBeCloseTo(300, 5);
  });

  it('should reset the view', () => {
    const viewer = viewerOf();
    viewer.zoom.set(250);
    viewer.panX.set(-500);
    viewer.resetView();
    expect(viewer.zoom()).toBe(100);
    expect(viewer.panX()).toBe(40);
    expect(viewer.panY()).toBe(40);
  });

  // ── Auto-fit ───────────────────────────────────────────────────
  // The contract is "no scrolling, no panning": every node lands inside the
  // canvas rectangle. These assert that in *screen* space — the same maths the
  // browser applies to the SVG — rather than trusting the scale the code picked.

  // jsdom lays nothing out, so the canvas always measures 0×0. Give it a size and
  // auto-fit has something real to fit into.
  const sizeCanvas = (w: number, h: number) => {
    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    Object.defineProperty(canvas, 'clientWidth', { value: w, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: h, configurable: true });
    return canvas;
  };

  // screen = pan + zoom * layout, applied to every node's box.
  const screenBoxes = () => {
    const v = viewerOf();
    const z = v.zoom() / 100;
    return Array.from(el.querySelectorAll('.dep-viewer__node .dep-viewer__node-fill')).map(r => {
      const x = +(r.getAttribute('x') ?? 0);
      const y = +(r.getAttribute('y') ?? 0);
      return {
        left: v.panX() + x * z,
        top: v.panY() + y * z,
        right: v.panX() + (x + +(r.getAttribute('width') ?? 0)) * z,
        bottom: v.panY() + (y + +(r.getAttribute('height') ?? 0)) * z,
      };
    });
  };

  const expectAllInside = (w: number, h: number) => {
    const boxes = screenBoxes();
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(w);
      expect(b.bottom).toBeLessThanOrEqual(h);
    }
  };

  /** A `count`-node graph, fanned out `branching` wide so it grows on both axes. */
  const wideTree = (count: number, branching = 4): DependencyNode => {
    const nodes: DependencyNode[] = Array.from({ length: count }, (_, i) => ({
      id: `n${i}`,
      label: `Node ${i}`,
    }));
    for (let i = 1; i < count; i++) {
      const parent = nodes[Math.floor((i - 1) / branching)];
      (parent.children ??= []).push(nodes[i]);
    }
    return nodes[0];
  };

  const enableAutoFit = (w = 800, h = 400) => {
    sizeCanvas(w, h);
    host.autoFit.set(true);
    fixture.detectChanges();
  };

  it.each([1, 2, 7, 23, 50])('should fit a %i-node graph entirely in the canvas', count => {
    host.root.set(wideTree(count));
    fixture.detectChanges();
    enableAutoFit(800, 400);
    expectAllInside(800, 400);
  });

  it.each([1, 7, 50])('should fit a %i-node vertical graph entirely in the canvas', count => {
    host.direction.set('vertical');
    host.root.set(wideTree(count));
    fixture.detectChanges();
    enableAutoFit(800, 400);
    expectAllInside(800, 400);
  });

  it('should re-fit when the container is resized', () => {
    host.root.set(wideTree(30));
    fixture.detectChanges();
    enableAutoFit(900, 500);

    const zoomBefore = viewerOf().zoom();

    // The real trigger is a ResizeObserver callback, which jsdom does not
    // implement; fit() is what that callback calls, so drive it directly.
    sizeCanvas(300, 200);
    viewerOf().fit();
    fixture.detectChanges();

    expect(viewerOf().zoom()).toBeLessThan(zoomBefore); // smaller frame → smaller scale
    expectAllInside(300, 200);
  });

  it('should re-fit when the graph grows', () => {
    host.root.set(wideTree(4));
    fixture.detectChanges();
    enableAutoFit(800, 400);

    host.root.set(wideTree(50));
    fixture.detectChanges();

    expectAllInside(800, 400);
  });

  it('should shrink to fit but never enlarge past 100%', () => {
    host.root.set({ id: 'only', label: 'Only' });
    fixture.detectChanges();
    enableAutoFit(2000, 1200); // vastly bigger than one 160×40 node

    expect(viewerOf().zoom()).toBe(100);
  });

  it('should centre the fitted graph in the canvas', () => {
    host.root.set(wideTree(12));
    fixture.detectChanges();
    enableAutoFit(800, 400);

    const boxes = screenBoxes();
    const left = Math.min(...boxes.map(b => b.left));
    const right = Math.max(...boxes.map(b => b.right));
    const top = Math.min(...boxes.map(b => b.top));
    const bottom = Math.max(...boxes.map(b => b.bottom));

    expect(left).toBeCloseTo(800 - right, 5);
    expect(top).toBeCloseTo(400 - bottom, 5);
  });

  it('should leave the viewport untouched when autoFit is off', () => {
    // The no-regression guard: the fit machinery must not run unasked.
    sizeCanvas(800, 400);
    host.root.set(wideTree(50));
    fixture.detectChanges();

    const viewer = viewerOf();
    expect(viewer.zoom()).toBe(100);
    expect(viewer.panX()).toBe(40);
    expect(viewer.panY()).toBe(40);
  });

  it('should re-fit rather than reset to 100% when resetView is called under autoFit', () => {
    host.root.set(wideTree(50));
    fixture.detectChanges();
    enableAutoFit(800, 400);

    const fitted = viewerOf().zoom();
    expect(fitted).toBeLessThan(100); // precondition: this graph really is too big

    viewerOf().resetView();
    fixture.detectChanges();

    expect(viewerOf().zoom()).toBeCloseTo(fitted, 5);
    expectAllInside(800, 400);
  });

  it('should let auto-fit win over anchor compensation', () => {
    // Both move the pan on relayout. If the anchor effect still ran, it would drag
    // the camera off the fit and push nodes out of frame.
    host.root.set(wideTree(4));
    host.anchorNodeId.set('n3');
    fixture.detectChanges();
    enableAutoFit(800, 400);

    host.root.set(wideTree(50));
    fixture.detectChanges();

    expectAllInside(800, 400);
  });

  // ── Static mode (interactive: false) ───────────────────────────

  it('should not pan on drag when interactive is false', () => {
    host.interactive.set(false);
    fixture.detectChanges();

    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 260, clientY: 190 }));
    fixture.detectChanges();

    expect(viewerOf().panX()).toBe(40);
    expect(viewerOf().panY()).toBe(40);
  });

  it('should still pan on drag by default', () => {
    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 100, clientY: 100 }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 260, clientY: 190 }));
    fixture.detectChanges();

    expect(viewerOf().panX()).toBe(200); // 40 + 160
    expect(viewerOf().panY()).toBe(130); // 40 + 90
  });

  it('should not zoom on wheel — nor swallow the event — when interactive is false', () => {
    host.interactive.set(false);
    fixture.detectChanges();

    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    const wheel = new WheelEvent('wheel', { deltaY: -120, cancelable: true, bubbles: true });
    canvas.dispatchEvent(wheel);
    fixture.detectChanges();

    expect(viewerOf().zoom()).toBe(100);
    // Not prevented, so the page behind the viewer can still scroll.
    expect(wheel.defaultPrevented).toBe(false);
  });

  it('should still zoom on wheel by default', () => {
    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, cancelable: true, bubbles: true }));
    fixture.detectChanges();

    expect(viewerOf().zoom()).toBe(110);
  });

  it('should hide the zoom controls but keep the direction read-out when static', () => {
    host.interactive.set(false);
    fixture.detectChanges();

    expect(el.querySelectorAll('.dep-viewer__btn').length).toBe(0);
    expect(el.querySelector('.dep-viewer__zoom')).toBeFalsy();
    expect(el.querySelector('.dep-viewer__toolbar')).toBeTruthy();
    expect(el.querySelector('.dep-viewer__direction-label')?.textContent?.trim()).toBe('→');
  });

  it('should mark the canvas static so it stops advertising drag', () => {
    host.interactive.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.dep-viewer__canvas')?.classList).toContain('dep-viewer__canvas--static');
  });

  it('should still emit nodeSelect in static mode', () => {
    const emitted: DependencyNode[] = [];
    const viewer = fixture.debugElement.children[0].componentInstance as DependencyViewerComponent;
    viewer.nodeSelect.subscribe((n: DependencyNode) => emitted.push(n));

    host.interactive.set(false);
    host.autoFit.set(true);
    fixture.detectChanges();

    const node = el.querySelector('.dep-viewer__node') as SVGGElement;
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe('root');
    expect(el.querySelector('.dep-viewer__detail')).toBeTruthy();
  });

  it('should still collapse sub-trees in static mode', () => {
    // Collapsing is content interaction, not viewport navigation — `interactive`
    // governs pan/zoom only.
    host.interactive.set(false);
    fixture.detectChanges();

    const toggle = el.querySelectorAll('.dep-viewer__toggle')[1] as SVGElement;
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(3);
  });

  // ── Layered layout ─────────────────────────────────────────────
  // The point of `layered` is that a node's column comes from the dependency
  // graph, not from the `children` nesting it arrived in. These assert the
  // topology in layout space: column index, and which links got drawn.

  /** Column (horizontal) or row (vertical) index each node was placed in. */
  const layerOf = (id: string) => nodeIn(id).depth;

  /** `a` must come strictly before `b` along the flow axis. */
  const expectBefore = (a: string, b: string) => {
    const [pa, pb] = host.direction() === 'horizontal'
      ? [nodeIn(a).x, nodeIn(b).x]
      : [nodeIn(a).y, nodeIn(b).y];
    expect(pa).toBeLessThan(pb);
  };

  const edgeIds = () =>
    new Set(viewerOf().graph().edges.map(e => `${e.sourceId}→${e.targetId}`));

  /** A flat set of specs wired only by `dependsOn` — the process-order shape. */
  const specs = (deps: Record<string, string[]>): DependencyNode[] =>
    Object.entries(deps).map(([id, on]) => ({
      id,
      label: id.toUpperCase(),
      dependsOn: on.map(d => ({ id: d })),
    }));

  const useLayered = (root: DependencyNode | DependencyNode[]) => {
    host.root.set(root);
    host.layout.set('layered');
    fixture.detectChanges();
  };

  it('should put nodes that depend on nothing in the first layer', () => {
    useLayered(specs({ a: [], b: [], c: ['a', 'b'] }));

    expect(layerOf('a')).toBe(0);
    expect(layerOf('b')).toBe(0);
    expect(layerOf('c')).toBe(1);
  });

  it('should place a node past everything it transitively depends on', () => {
    useLayered(specs({ a: [], b: ['a'], c: ['b'], d: ['c'] }));

    expect([layerOf('a'), layerOf('b'), layerOf('c'), layerOf('d')]).toEqual([0, 1, 2, 3]);
    expectBefore('a', 'b');
    expectBefore('b', 'c');
    expectBefore('c', 'd');
  });

  it('should clear the *deepest* predecessor when a node has several', () => {
    // `d` depends on `a` (layer 0) and on `c` (layer 2). Following either one
    // alone would put it at layer 1 — on top of, or left of, `c`.
    useLayered(specs({ a: [], b: ['a'], c: ['b'], d: ['a', 'c'] }));

    expect(layerOf('d')).toBe(3);
    expectBefore('c', 'd');
    expectBefore('a', 'd');
  });

  it('should draw every dependency edge, including the ones a tree layout drops', () => {
    // `d` has two predecessors: a spanning tree can only keep one of them.
    useLayered(specs({ a: [], b: ['a'], c: ['a'], d: ['b', 'c'] }));

    expect(edgeIds()).toEqual(new Set(['a→b', 'a→c', 'b→d', 'c→d']));
    expect(el.querySelectorAll('.dep-viewer__edge').length).toBe(4);
  });

  it('should lay out a cycle instead of hanging or dropping nodes', () => {
    useLayered(specs({ a: ['c'], b: ['a'], c: ['b'] }));

    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(3);
    // Every link survives — the one that closes the loop is drawn as a return
    // edge rather than being layered.
    expect(edgeIds()).toEqual(new Set(['c→a', 'a→b', 'b→c']));
  });

  it('should mark the loop-closing edge as a return edge', () => {
    useLayered(specs({ a: ['c'], b: ['a'], c: ['b'] }));

    const back = viewerOf().graph().edges.filter(e => e.isCrossRef);
    expect(back.length).toBe(1);
    expect(back[0].dashed).toBe(true);
  });

  it('should treat a children link as precedence too, so it never points backwards', () => {
    // `parent` also depends on `late`, which is three layers deep — the child must
    // follow its parent there rather than staying at layer 1.
    useLayered([
      { id: 'x', label: 'X' },
      { id: 'y', label: 'Y', dependsOn: [{ id: 'x' }] },
      { id: 'late', label: 'Late', dependsOn: [{ id: 'y' }] },
      {
        id: 'parent',
        label: 'Parent',
        dependsOn: [{ id: 'late' }],
        children: [{ id: 'child', label: 'Child' }],
      },
    ]);

    expectBefore('parent', 'child');
    expect(layerOf('child')).toBe(layerOf('parent') + 1);
  });

  // A plan-shaped graph — parallel starts, fan-in, fan-out, a long pole — handed
  // over in an order that has nothing to do with its dependencies, which is how a
  // query result arrives.
  const PLAN: Record<string, string[]> = {
    s01: [], s02: [], s03: [],
    s04: ['s01'], s05: ['s01', 's02'], s06: ['s02'], s07: ['s03'],
    s08: ['s04'], s09: ['s05', 's07'], s10: ['s06'],
    s11: ['s08', 's09'], s12: ['s09'], s13: ['s10'],
    s14: ['s11'], s15: ['s12', 's13'], s16: ['s11', 's13'],
    s17: ['s14', 's15'], s18: ['s16'], s19: ['s17', 's18'],
    s20: ['s19'],
  };

  const shuffled = <T,>(items: T[]): T[] => {
    const out = [...items];
    let seed = 12345; // fixed, so the test is not a dice roll
    for (let i = out.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const j = seed % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  /**
   * Edge crossings, given each node's row within its layer. Two edges spanning the
   * same pair of layers cross when their endpoints are ordered oppositely.
   */
  const crossingsGiven = (row: (id: string) => number) => {
    const { edges } = viewerOf().graph();
    let count = 0;
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const [a, b] = [edges[i], edges[j]];
        if (layerOf(a.sourceId) !== layerOf(b.sourceId)) continue;
        if (layerOf(a.targetId) !== layerOf(b.targetId)) continue;
        const spread = (row(a.sourceId) - row(b.sourceId)) * (row(a.targetId) - row(b.targetId));
        if (spread < 0) count++;
      }
    }
    return count;
  };

  it('should cut crossings well below the order the graph arrived in', () => {
    const entries = shuffled(Object.entries(PLAN));
    useLayered(entries.map(([id, on]) => ({
      id, label: id.toUpperCase(), dependsOn: on.map(d => ({ id: d })),
    })));

    // What you'd get by stacking each layer in arrival order — the do-nothing
    // baseline the ordering phase has to beat.
    const arrival = new Map(entries.map(([id], i) => [id, i]));
    const baseline = crossingsGiven(id => arrival.get(id) ?? 0);
    const actual = crossingsGiven(id => nodeIn(id).y);

    expect(baseline).toBeGreaterThan(8); // precondition: this input really is tangled
    expect(actual).toBeLessThanOrEqual(baseline / 2);
  });

  it('should keep every edge pointing forwards in a plan-shaped graph', () => {
    useLayered(shuffled(Object.entries(PLAN)).map(([id, on]) => ({
      id, label: id.toUpperCase(), dependsOn: on.map(d => ({ id: d })),
    })));

    for (const edge of viewerOf().graph().edges) {
      expect(nodeIn(edge.sourceId).x).toBeLessThan(nodeIn(edge.targetId).x);
    }
  });

  it('should reduce crossings by reordering within a layer', () => {
    // Fed deliberately crossed: the first layer's order is a, b but their
    // successors arrive as (b→p, a→q). Ordering the second layer by the median of
    // its predecessors has to put q above p to untangle it.
    useLayered(specs({ a: [], b: [], p: ['b'], q: ['a'] }));

    expect(nodeIn('q').y).toBeLessThan(nodeIn('p').y);
  });

  it('should lay layers out as rows when vertical', () => {
    host.direction.set('vertical');
    useLayered(specs({ a: [], b: ['a'], c: ['b'] }));

    expect(nodeIn('a').y).toBeLessThan(nodeIn('b').y);
    expect(nodeIn('b').y).toBeLessThan(nodeIn('c').y);
    // Same layer index drives the *row*, so the columns are free to differ.
    expect(layerOf('c')).toBe(2);
  });

  it('should keep node selection working in layered mode', () => {
    const emitted: DependencyNode[] = [];
    viewerOf().nodeSelect.subscribe((n: DependencyNode) => emitted.push(n));
    useLayered(specs({ a: [], b: ['a'] }));

    (el.querySelector('.dep-viewer__node') as SVGGElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted.map(n => n.id)).toEqual(['a']);
  });

  it('should keep type colours working in layered mode', () => {
    host.typeColors.set({ Spec: '#c1e3e9' });
    useLayered([{ id: 'a', label: 'A', type: 'Spec' }]);

    const fill = el.querySelector('.dep-viewer__node-fill')?.getAttribute('fill');
    expect(fill).toBe('#c1e3e9');
  });

  it('should ignore a dependency on a node that is not in the graph', () => {
    useLayered(specs({ a: ['ghost'], b: ['a'] }));

    expect(layerOf('a')).toBe(0);
    expect(edgeIds()).toEqual(new Set(['a→b']));
  });

  it('should ignore a self-dependency rather than deadlocking the layering', () => {
    useLayered(specs({ a: ['a'], b: ['a'] }));

    expect(layerOf('a')).toBe(0);
    expect(layerOf('b')).toBe(1);
  });

  it('should leave the tree layout alone by default', () => {
    // Same input, default layout: columns come from the `children` depth, and the
    // dependsOn link stays a cross-reference that moves nothing.
    host.root.set({
      id: 'r',
      label: 'R',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a' }] },
      ],
    });
    fixture.detectChanges();

    expect(nodeIn('a').x).toBe(nodeIn('b').x); // siblings, so same column
    expect(nodeIn('a').depth).toBe(1);
  });

  // ── Forest input ───────────────────────────────────────────────

  it('should lay out an array of roots as a forest', () => {
    host.root.set([
      { id: 'r1', label: 'R1', children: [{ id: 'a', label: 'A' }] },
      { id: 'r2', label: 'R2', children: [{ id: 'b', label: 'B' }] },
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(4);
    // Both roots start the flow; they're stacked, not nested.
    expect(nodeIn('r1').x).toBe(nodeIn('r2').x);
    expect(nodeIn('r2').y).toBeGreaterThan(nodeIn('r1').y);
  });

  it('should lay out a node reachable from two roots exactly once', () => {
    const shared: DependencyNode = { id: 'shared', label: 'Shared' };
    host.root.set([
      { id: 'r1', label: 'R1', children: [shared] },
      { id: 'r2', label: 'R2', children: [shared] },
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.dep-viewer__node').length).toBe(3);
  });

  // ── Fit modes ──────────────────────────────────────────────────

  it('should treat fitMode="contain" as autoFit', () => {
    host.root.set(wideTree(30));
    fixture.detectChanges();
    sizeCanvas(800, 400);
    host.fitMode.set('contain');
    fixture.detectChanges();

    expectAllInside(800, 400);
  });

  it('should let fitMode override autoFit', () => {
    host.root.set(wideTree(30));
    host.autoFit.set(true);
    host.fitMode.set('none');
    fixture.detectChanges();
    sizeCanvas(800, 400);
    viewerOf().fit();

    expect(viewerOf().zoom()).toBe(100); // never fitted
  });

  const fitWidth = (w: number, h: number) => {
    sizeCanvas(w, h);
    host.fitMode.set('fit-width');
    fixture.detectChanges();
    viewerOf().fit();
    fixture.detectChanges();
  };

  it('should scale to the width only, ignoring a frame too short for the graph', () => {
    host.root.set(wideTree(50));
    fixture.detectChanges();
    fitWidth(800, 120);

    const boxes = screenBoxes();
    // Everything is inside horizontally…
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(-0.5);
      expect(b.right).toBeLessThanOrEqual(800.5);
    }
    // …and the graph is allowed to run past the frame's height instead of
    // shrinking to meet it.
    expect(Math.max(...boxes.map(b => b.bottom))).toBeGreaterThan(120);
  });

  it('should keep nodes bigger under fit-width than under contain', () => {
    host.root.set(wideTree(50));
    fixture.detectChanges();

    sizeCanvas(800, 120);
    host.fitMode.set('contain');
    fixture.detectChanges();
    viewerOf().fit();
    const contained = viewerOf().zoom();

    fitWidth(800, 120);
    expect(viewerOf().zoom()).toBeGreaterThan(contained);
  });

  it('should grow the viewer to the graph height so the page scrolls, not the graph', () => {
    host.root.set(wideTree(50));
    fixture.detectChanges();
    fitWidth(800, 120);

    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    expect(canvas.classList).toContain('dep-viewer__canvas--sized');
    expect(parseFloat(canvas.style.height)).toBeGreaterThan(120);
    // The host gives up its fixed height so the grown canvas is actually visible.
    expect((el.querySelector('lc-dependency-viewer') as HTMLElement).style.height).toBe('auto');
  });

  it('should size the viewer down to a graph shorter than the frame', () => {
    // fit-width hands the height to the graph in *both* directions — a three-node
    // graph gets a compact viewer, not a 500px box with a strip of content in it.
    host.root.set(wideTree(3));
    fixture.detectChanges();
    fitWidth(800, 400);

    const canvas = el.querySelector('.dep-viewer__canvas') as HTMLElement;
    expect(canvas.classList).toContain('dep-viewer__canvas--sized');
    expect(parseFloat(canvas.style.height)).toBeLessThan(400);
  });

  it('should settle rather than oscillate when re-fitting at the grown height', () => {
    host.root.set(wideTree(50));
    fixture.detectChanges();
    fitWidth(800, 120);

    const { zoom, height } = { zoom: viewerOf().zoom(), height: viewerOf().contentHeight() };

    // What the ResizeObserver does after the canvas grows: measure again and re-fit.
    // The scale must not depend on the height this very fit produced.
    sizeCanvas(800, height ?? 0);
    viewerOf().fit();

    expect(viewerOf().zoom()).toBeCloseTo(zoom, 5);
    expect(viewerOf().contentHeight()).toBe(height);
  });

  it('should release the grown height when fitting is turned off', () => {
    host.root.set(wideTree(50));
    fixture.detectChanges();
    fitWidth(800, 120);
    expect(viewerOf().contentHeight()).not.toBeNull();

    host.fitMode.set('none');
    fixture.detectChanges();

    expect(viewerOf().contentHeight()).toBeNull();
    expect((el.querySelector('lc-dependency-viewer') as HTMLElement).style.height).toBe('500px');
  });

  it('should stop shrinking at minNodeSize', () => {
    host.root.set(wideTree(80));
    fixture.detectChanges();

    sizeCanvas(400, 200);
    host.fitMode.set('contain');
    fixture.detectChanges();
    viewerOf().fit();
    expect(viewerOf().zoom()).toBeLessThan(50); // precondition: it really did shrink past half

    host.minNodeSize.set(80); // half of the 160px node width
    fixture.detectChanges();
    viewerOf().fit();

    expect(viewerOf().zoom()).toBeCloseTo(50, 5);
  });

  it('should not let minNodeSize enlarge a graph that already fits', () => {
    host.root.set({ id: 'only', label: 'Only' });
    fixture.detectChanges();

    sizeCanvas(2000, 1200);
    host.fitMode.set('contain');
    host.minNodeSize.set(160);
    fixture.detectChanges();
    viewerOf().fit();

    expect(viewerOf().zoom()).toBe(100);
  });
});
