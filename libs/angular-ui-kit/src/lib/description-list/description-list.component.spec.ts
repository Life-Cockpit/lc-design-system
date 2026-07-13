import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DescriptionListComponent,
  DescriptionListItem,
  DescriptionListLayout,
} from './description-list.component';

@Component({
  standalone: true,
  imports: [DescriptionListComponent],
  template: `
    <lc-description-list
      [items]="items()"
      [layout]="layout()"
      [leaders]="leaders()"
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
});
