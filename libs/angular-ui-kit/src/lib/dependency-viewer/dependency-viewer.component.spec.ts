import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Signal, WritableSignal, signal } from '@angular/core';
import {
  DependencyViewerComponent,
  DependencyNode,
  DependencyDirection,
  DependencyRelation,
} from './dependency-viewer.component';

@Component({
  standalone: true,
  imports: [DependencyViewerComponent],
  template: `<lc-dependency-viewer
    [root]="root()"
    [direction]="direction()"
    [showToolbar]="showToolbar()"
    [showEdgeLabels]="showEdgeLabels()"
    [typeColors]="typeColors()"
    [hiddenRelations]="hiddenRelations()"
    [hiddenTypes]="hiddenTypes()"
    [anchorNodeId]="anchorNodeId()"
  />`,
})
class TestHost {
  root = signal<DependencyNode>({
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
  direction = signal<DependencyDirection>('horizontal');
  showToolbar = signal(true);
  showEdgeLabels = signal(true);
  typeColors = signal<Record<string, string>>({});
  hiddenRelations = signal<DependencyRelation[]>([]);
  hiddenTypes = signal<string[]>([]);
  anchorNodeId = signal<string | null>(null);
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

  it('should leave a clear cross-reference on its direct route', () => {
    host.root.set({
      id: 'root',
      label: 'Root',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', dependsOn: [{ id: 'a', relation: 'blocks' }] },
      ],
    });
    fixture.detectChanges();

    const crossRef = el.querySelector('.dep-viewer__edge--cross-ref') as SVGPathElement;
    // No obstacle between them, so no detour: the path must not dip below the row.
    const lowest = Math.max(...nodeBoxes().map(b => b.y + b.h));
    const pts = sampleCubic(crossRef.getAttribute('d') ?? '');
    expect(Math.max(...pts.map(p => p.y))).toBeLessThanOrEqual(lowest + 1);
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
    layout: Signal<{ nodeMap: Map<string, { x: number; y: number }> }>;
  }
  const viewerOf = () =>
    fixture.debugElement.children[0].componentInstance as unknown as DependencyViewerComponent &
      ViewerInternals;

  const nodeIn = (id: string) => {
    const n = viewerOf().layout().nodeMap.get(id);
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
});
