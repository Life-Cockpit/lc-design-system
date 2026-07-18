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
