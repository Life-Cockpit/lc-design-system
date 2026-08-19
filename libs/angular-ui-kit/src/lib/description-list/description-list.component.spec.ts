import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DescriptionListComponent,
  DescriptionListItem,
  DescriptionListLayout,
  DescriptionListSeparator,
} from './description-list.component';

@Component({
  standalone: true,
  imports: [DescriptionListComponent],
  template: `
    <lc-description-list
      [items]="items()"
      [layout]="layout()"
      [leaders]="leaders()"
      [separator]="separator()"
      [clickable]="clickable()"
      (itemClick)="onItemClick($event)"
    />
  `,
})
class TestHost {
  readonly items = signal<DescriptionListItem[]>([
    { term: 'Repository', value: 'example/project', href: '#', emphasis: 'primary', id: 'repo' },
    { term: 'Access', value: 'Token stored · read only' },
    { term: 'Status', value: 'Maintained', emphasis: 'strong' },
  ]);
  readonly layout = signal<DescriptionListLayout>('rows');
  readonly leaders = signal(false);
  readonly separator = signal<DescriptionListSeparator>('line');
  readonly clickable = signal(false);

  readonly onItemClick = jest.fn<(item: DescriptionListItem) => void>();
}

describe('DescriptionListComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let hostElement: HTMLElement;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    hostElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders one row per item with term and value', () => {
    const terms = Array.from(hostElement.querySelectorAll('.lc-dl__term')).map((el) =>
      el.textContent?.trim(),
    );
    expect(terms).toEqual(['Repository', 'Access', 'Status']);
  });

  it('renders a value as a link when href is provided', () => {
    const link = hostElement.querySelector<HTMLAnchorElement>('.lc-dl__link');
    expect(link?.textContent?.trim()).toBe('example/project');
    expect(link?.getAttribute('href')).toBe('#');
  });

  it('applies the emphasis modifier class to the value', () => {
    const values = hostElement.querySelectorAll('.lc-dl__value');
    expect(values[0].classList).toContain('lc-dl__value--primary');
    expect(values[1].classList).toContain('lc-dl__value--default');
    expect(values[2].classList).toContain('lc-dl__value--strong');
  });

  it('adds the leaders modifier only for the rows layout', () => {
    host.leaders.set(true);
    fixture.detectChanges();
    expect(hostElement.querySelector('.lc-dl')?.classList).toContain('lc-dl--leaders');

    host.layout.set('stacked');
    fixture.detectChanges();
    expect(hostElement.querySelector('.lc-dl')?.classList).not.toContain('lc-dl--leaders');
  });

  it('emits itemClick with the row payload', () => {
    const row = hostElement.querySelector<HTMLElement>('.lc-dl__row');
    row?.click();
    expect(host.onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'repo', term: 'Repository' }),
    );
  });

  it('makes rows keyboard-operable when clickable', () => {
    let row = hostElement.querySelector<HTMLElement>('.lc-dl__row') as HTMLElement;
    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('role')).toBe(false);

    host.clickable.set(true);
    fixture.detectChanges();
    row = hostElement.querySelector<HTMLElement>('.lc-dl__row') as HTMLElement;
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('tabindex')).toBe('0');
    expect(row.classList).toContain('lc-dl__row--clickable');

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    row.dispatchEvent(enter);
    row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(enter.defaultPrevented).toBe(true);
    expect(host.onItemClick).toHaveBeenCalledTimes(2);
    expect(host.onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'repo' }));

    // Enter on the nested link is the link's own activation, not the row's.
    const link = row.querySelector<HTMLElement>('.lc-dl__link') as HTMLElement;
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(host.onItemClick).toHaveBeenCalledTimes(2);
  });

  it('renders a muted value suffix when provided', () => {
    host.items.set([{ term: 'Score', value: '78 / 100', valueSuffix: 'good' }]);
    fixture.detectChanges();
    const suffix = hostElement.querySelector('.lc-dl__value-suffix');
    expect(suffix?.textContent?.trim()).toBe('good');
  });

  it('applies the mono emphasis modifier', () => {
    host.items.set([{ term: 'Revision', value: 'a1b2c3d', emphasis: 'mono' }]);
    fixture.detectChanges();
    expect(hostElement.querySelector('.lc-dl__value')?.classList).toContain('lc-dl__value--mono');
  });

  it('applies the separator modifier (default line, then divider / none)', () => {
    expect(hostElement.querySelector('.lc-dl')?.classList).toContain('lc-dl--sep-line');

    host.separator.set('divider');
    fixture.detectChanges();
    expect(hostElement.querySelector('.lc-dl')?.classList).toContain('lc-dl--sep-divider');

    host.separator.set('none');
    fixture.detectChanges();
    expect(hostElement.querySelector('.lc-dl')?.classList).toContain('lc-dl--sep-none');
  });
});
