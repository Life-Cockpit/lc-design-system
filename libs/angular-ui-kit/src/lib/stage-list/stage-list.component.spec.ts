import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StageItem, StageListComponent } from './stage-list.component';

@Component({
  standalone: true,
  imports: [StageListComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-stage-list
      [stages]="stages()"
      [max]="max()"
      [showValue]="showValue()"
      [showBar]="showBar()"
      [size]="size()"
      [clickable]="clickable()"
      [emptyText]="emptyText()"
      (stageClick)="onStageClick($event)"
    />
  `,
})
class TestHost {
  readonly stages = signal<StageItem[]>([
    { label: 'Planung', value: 10, color: '#2563eb', id: 'plan' },
    { label: 'Implementierung', value: 5, id: 'impl' },
    { label: 'Review', value: 0, id: 'review' },
  ]);
  readonly max = signal<number | null>(null);
  readonly showValue = signal(true);
  readonly showBar = signal(true);
  readonly size = signal<'sm' | 'md'>('md');
  readonly clickable = signal(false);
  readonly emptyText = signal('');

  readonly onStageClick = jest.fn<(stage: StageItem) => void>();
}

describe('StageListComponent', () => {
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

  it('renders one row per stage in input order', () => {
    const labels = Array.from(hostElement.querySelectorAll('.lc-stage-list__label'))
      .map((el) => el.textContent?.trim());

    expect(labels).toEqual(['Planung', 'Implementierung', 'Review']);
  });

  it('derives bar width from stage value and auto max', () => {
    const fills = hostElement.querySelectorAll<HTMLElement>('.lc-stage-list__fill');

    expect(fills[0].style.width).toBe('max(2px, 100%)');
    expect(fills[1].style.width).toBe('max(2px, 50%)');
    expect(fills[2].style.width).toBe('0%');
  });

  it('uses explicit max when provided', () => {
    host.max.set(40);
    fixture.detectChanges();

    const fills = hostElement.querySelectorAll<HTMLElement>('.lc-stage-list__fill');
    expect(fills[0].style.width).toBe('max(2px, 25%)');
    expect(fills[1].style.width).toBe('max(2px, 13%)');
  });

  it('guards against non-positive max values', () => {
    host.max.set(0);
    fixture.detectChanges();

    const fills = hostElement.querySelectorAll<HTMLElement>('.lc-stage-list__fill');
    expect(fills[0].style.width).toBe('max(2px, 100%)');
  });

  it('applies minimum visible width for non-zero values', () => {
    host.stages.set([{ label: 'Tiny', value: 1 }]);
    host.max.set(1000);
    fixture.detectChanges();

    const fill = hostElement.querySelector<HTMLElement>('.lc-stage-list__fill');
    expect(fill?.style.width).toBe('max(2px, 0%)');
  });

  it('hides bars when showBar is false', () => {
    host.showBar.set(false);
    fixture.detectChanges();

    expect(hostElement.querySelectorAll('.lc-stage-list__track').length).toBe(0);
  });

  it('hides values when showValue is false', () => {
    host.showValue.set(false);
    fixture.detectChanges();

    expect(hostElement.querySelectorAll('.lc-stage-list__value').length).toBe(0);
  });

  it('falls back to primary token when no stage color is provided', () => {
    const rows = hostElement.querySelectorAll<HTMLElement>('.lc-stage-list__row');

    expect(rows[1].style.getPropertyValue('--lc-stage-color').trim())
      .toBe('var(--lc-color-primary-500, var(--color-primary-500))');
  });

  it('renders empty text when no stages exist', () => {
    host.stages.set([]);
    host.emptyText.set('Keine Daten');
    fixture.detectChanges();

    expect(hostElement.querySelector('.lc-stage-list__empty')?.textContent?.trim()).toBe('Keine Daten');
  });

  it('emits stageClick when clickable and activated', () => {
    host.clickable.set(true);
    fixture.detectChanges();

    const rowButton = hostElement.querySelector<HTMLButtonElement>('.lc-stage-list__interactive');
    rowButton?.click();

    expect(host.onStageClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'plan', label: 'Planung', value: 10 }),
    );
  });
});
