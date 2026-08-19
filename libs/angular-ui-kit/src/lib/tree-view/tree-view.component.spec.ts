import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TreeViewComponent, type TreeNode } from './tree-view.component';
import { resolveFileIcon } from './file-icons';

@Component({
  standalone: true,
  imports: [TreeViewComponent],
  template: `<lc-tree-view
    [nodes]="nodes()"
    [showToolbar]="showToolbar()"
    [(selectedId)]="selectedId"
  />`,
})
class TestHost {
  nodes = signal<TreeNode[]>([
    {
      name: 'src',
      expanded: true,
      children: [
        { name: 'app.component.ts' },
        { name: 'styles.scss' },
      ],
    },
    { name: 'README.md' },
  ]);
  showToolbar = signal(true);
  selectedId = signal<string | null>(null);
}

describe('TreeViewComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideHttpClient()],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  function items(): HTMLElement[] {
    return Array.from(el.querySelectorAll('.lc-tree-view__item'));
  }

  it('renders expanded folder children', () => {
    // src (expanded) + 2 children + README.md = 4 rows
    expect(items().length).toBe(4);
    expect(el.textContent).toContain('app.component.ts');
    expect(el.textContent).toContain('README.md');
  });

  it('collapses and expands a folder on toggle click', () => {
    const chevron = el.querySelector<HTMLButtonElement>(
      '.lc-tree-view__chevron-btn',
    )!;
    chevron.click();
    fixture.detectChanges();
    // children hidden: src + README.md = 2 rows
    expect(items().length).toBe(2);

    chevron.click();
    fixture.detectChanges();
    expect(items().length).toBe(4);
  });

  it('selects a node on click and updates two-way binding', () => {
    const readme = items().find((i) => i.textContent?.includes('README.md'))!;
    readme.click();
    fixture.detectChanges();
    expect(host.selectedId()).toBe('/README.md');
    expect(readme.classList).toContain('lc-tree-view__item--selected');
  });

  it('expand-all / collapse-all toolbar buttons work', () => {
    const [expandBtn, collapseBtn] = Array.from(
      el.querySelectorAll<HTMLButtonElement>('.lc-tree-view__tool-btn'),
    );

    collapseBtn.click();
    fixture.detectChanges();
    expect(items().length).toBe(2);

    expandBtn.click();
    fixture.detectChanges();
    expect(items().length).toBe(4);
  });

  describe('keyboard navigation (roving tabindex)', () => {
    function key(target: HTMLElement, key: string): KeyboardEvent {
      const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      target.dispatchEvent(ev);
      return ev;
    }

    it('exposes exactly one tab stop and aria-posinset / aria-setsize', () => {
      const rows = items();
      const tabStops = rows.filter((r) => r.getAttribute('tabindex') === '0');
      expect(tabStops.length).toBe(1);
      expect(tabStops[0].textContent).toContain('src');
      // src (1 of 2 roots), app.component.ts (1 of 2 children), README.md (2 of 2 roots)
      expect(rows[0].getAttribute('aria-posinset')).toBe('1');
      expect(rows[0].getAttribute('aria-setsize')).toBe('2');
      expect(rows[1].getAttribute('aria-posinset')).toBe('1');
      expect(rows[1].getAttribute('aria-setsize')).toBe('2');
      expect(rows[3].getAttribute('aria-posinset')).toBe('2');
      expect(rows[3].getAttribute('aria-setsize')).toBe('2');
    });

    it('ArrowDown / ArrowUp move focus and the tab stop', () => {
      const rows = items();
      rows[0].focus();
      const ev = key(rows[0], 'ArrowDown');
      fixture.detectChanges();
      expect(ev.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(rows[1]);
      expect(rows[1].getAttribute('tabindex')).toBe('0');
      expect(rows[0].getAttribute('tabindex')).toBe('-1');

      key(rows[1], 'ArrowUp');
      fixture.detectChanges();
      expect(document.activeElement).toBe(rows[0]);
    });

    it('Home / End jump to the first / last node', () => {
      const rows = items();
      rows[1].focus();
      key(rows[1], 'End');
      expect(document.activeElement).toBe(rows[3]);
      key(rows[3], 'Home');
      expect(document.activeElement).toBe(rows[0]);
    });

    it('ArrowLeft on a leaf focuses the parent, ArrowRight on an expanded folder focuses the first child', () => {
      const rows = items();
      rows[1].focus();
      key(rows[1], 'ArrowLeft');
      expect(document.activeElement).toBe(rows[0]);

      key(rows[0], 'ArrowRight');
      expect(document.activeElement).toBe(rows[1]);
    });

    it('ArrowLeft / ArrowRight collapse and expand a folder', () => {
      const rows = items();
      key(rows[0], 'ArrowLeft');
      fixture.detectChanges();
      expect(items().length).toBe(2);
      key(items()[0], 'ArrowRight');
      fixture.detectChanges();
      expect(items().length).toBe(4);
    });

    it('skips disabled nodes and falls back to the selected node as tab stop', () => {
      host.nodes.set([
        { name: 'a', id: 'a', disabled: true },
        { name: 'b', id: 'b' },
        { name: 'c', id: 'c' },
      ]);
      host.selectedId.set('c');
      fixture.detectChanges();
      const rows = items();
      expect(rows.map((r) => r.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);

      rows[1].focus();
      key(rows[1], 'ArrowUp');
      // 'a' is disabled: focus stays on 'b'.
      expect(document.activeElement).toBe(rows[1]);
    });
  });

  describe('custom node types', () => {
    const domainTree: TreeNode[] = [
      {
        name: 'Group Alpha',
        id: 'g1',
        type: 'group',
        color: 'rgb(120, 80, 200)',
        expanded: true,
        badge: '↳3',
        children: [
          { name: 'Item One', id: 'i1', type: 'item', status: 'success' },
          { name: 'Item Two', id: 'i2', type: 'item', status: 'busy' },
        ],
      },
    ];

    beforeEach(() => {
      host.nodes.set(domainTree);
      fixture.detectChanges();
    });

    it('nodes with children expand regardless of custom type', () => {
      expect(items().length).toBe(3);

      const chevron = el.querySelector<HTMLButtonElement>(
        '.lc-tree-view__chevron-btn',
      )!;
      chevron.click();
      fixture.detectChanges();
      expect(items().length).toBe(1);
    });

    it('custom-type nodes render a colored type dot instead of a file icon', () => {
      const dots = el.querySelectorAll<HTMLElement>('.lc-tree-view__type-dot');
      expect(dots.length).toBe(3);
      expect(dots[0].style.backgroundColor).toBe('rgb(120, 80, 200)');
      expect(el.querySelector('.lc-tree-view__icon lc-icon')).toBeNull();
    });

    it('renders success and busy status indicators', () => {
      expect(el.querySelector('.lc-tree-view__status--success')).toBeTruthy();
      const busy = el.querySelector<HTMLElement>('.lc-tree-view__status--busy');
      expect(busy).toBeTruthy();

      const busyItem = items().find((i) => i.textContent?.includes('Item Two'))!;
      expect(busyItem.getAttribute('aria-busy')).toBe('true');
    });

    it('keeps the badge visible while the label truncates', () => {
      const groupItem = items()[0];
      const badge = groupItem.querySelector('.lc-tree-view__badge');
      expect(badge?.textContent).toContain('↳3');
    });

    it('selection and nodeClick still work for custom-type nodes', () => {
      const item = items().find((i) => i.textContent?.includes('Item One'))!;
      item.click();
      fixture.detectChanges();
      expect(host.selectedId()).toBe('i1');
    });
  });
});

describe('resolveFileIcon', () => {
  it('matches well-known file names', () => {
    expect(resolveFileIcon('package.json')).toBe('brand-npm');
    expect(resolveFileIcon('Dockerfile')).toBe('brand-docker');
    expect(resolveFileIcon('README.md')).toBe('book');
  });

  it('matches by extension', () => {
    expect(resolveFileIcon('app.component.ts')).toBe('brand-typescript');
    expect(resolveFileIcon('logo.SVG')).toBe('file-vector');
    expect(resolveFileIcon('photo.jpeg')).toBe('photo');
  });

  it('falls back to a generic file icon', () => {
    expect(resolveFileIcon('mystery.xyz')).toBe('file');
    expect(resolveFileIcon('noextension')).toBe('file');
  });
});
