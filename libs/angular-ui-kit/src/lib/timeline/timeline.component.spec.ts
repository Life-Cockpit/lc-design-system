import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { TimelineComponent, TimelineItem } from './timeline.component';
import {
  TimelineContentDirective,
  TimelineMetaDirective,
} from './timeline-templates.directive';
import { IconComponent } from '../icon/icon.component';

@Component({
  standalone: true,
  imports: [TimelineComponent],
  template: `
    <lc-timeline
      [items]="items()"
      [orientation]="orientation"
      [compact]="compact"
    ></lc-timeline>
  `,
})
class TestHostComponent {
  items = signal<TimelineItem[]>([
    { title: 'First event', description: 'Description 1', timestamp: '10:00' },
    { title: 'Second event', color: 'success' },
    { title: 'Third event', icon: 'check', color: 'primary' },
  ]);
  orientation: 'vertical' | 'horizontal' = 'vertical';
  compact = false;
}

@Component({
  standalone: true,
  imports: [TimelineComponent, TimelineContentDirective, TimelineMetaDirective],
  template: `
    <lc-timeline [items]="items()">
      <ng-template lcTimelineMeta let-item>
        @if (item.state === 'running') {
          läuft seit {{ seconds() }} s
        } @else if (item.meta) {
          {{ item.meta }}
        }
      </ng-template>
      <ng-template lcTimelineContent let-item>
        @if (item.state === 'failed') {
          <pre class="test-command">{{ item.title }} fehlgeschlagen</pre>
        }
      </ng-template>
    </lc-timeline>
  `,
})
class TranscriptHostComponent {
  seconds = signal(42);
  items = signal<TimelineItem[]>([
    { title: 'Schritt eins', titleMono: 'step_one', state: 'success', meta: '3 s' },
    {
      title: 'Schritt zwei',
      titleMono: 'step_two',
      state: 'failed',
      badge: 'Fehlgeschlagen',
      badgeVariant: 'error',
    },
    { title: 'Schritt drei', state: 'running' },
    { title: 'Schritt vier', state: 'pending' },
  ]);
}

describe('TimelineComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(TimelineComponent))).toBeTruthy();
  });

  it('should render all items', () => {
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('.timeline__item'));
    expect(items.length).toBe(3);
  });

  it('should render titles', () => {
    fixture.detectChanges();
    const titles = fixture.debugElement.queryAll(By.css('.timeline__title'));
    expect(titles[0].nativeElement.textContent.trim()).toBe('First event');
    expect(titles[1].nativeElement.textContent.trim()).toBe('Second event');
  });

  it('should render description when provided', () => {
    fixture.detectChanges();
    const descriptions = fixture.debugElement.queryAll(By.css('.timeline__description'));
    expect(descriptions.length).toBe(1);
    expect(descriptions[0].nativeElement.textContent.trim()).toBe('Description 1');
  });

  it('should render timestamp when provided', () => {
    fixture.detectChanges();
    const timestamps = fixture.debugElement.queryAll(By.css('.timeline__timestamp'));
    expect(timestamps.length).toBe(1);
    expect(timestamps[0].nativeElement.textContent.trim()).toBe('10:00');
  });

  it('should apply vertical class by default', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.timeline--vertical'))).toBeTruthy();
  });

  it('should apply horizontal class', () => {
    host.orientation = 'horizontal';
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.timeline--horizontal'))).toBeTruthy();
  });

  it('should apply compact class', () => {
    host.compact = true;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.timeline--compact'))).toBeTruthy();
  });

  it('should render dots for items without icons', () => {
    fixture.detectChanges();
    const dots = fixture.debugElement.queryAll(By.css('.timeline__dot'));
    expect(dots.length).toBe(2);
  });

  it('should apply color class to marker', () => {
    fixture.detectChanges();
    const markers = fixture.debugElement.queryAll(By.css('.timeline__marker'));
    expect(markers[1].nativeElement.classList).toContain('timeline__marker--success');
  });

  it('should render connectors between items but not after last', () => {
    fixture.detectChanges();
    const connectors = fixture.debugElement.queryAll(By.css('.timeline__connector'));
    expect(connectors.length).toBe(2);
  });

  it('renders items with identical titles (tracked by id / index, not title)', () => {
    fixture.detectChanges();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    host.items.set([
      { title: 'Deployed', timestamp: '10:00' },
      { title: 'Deployed', timestamp: '11:00' },
      { title: 'Deployed', timestamp: '12:00' },
    ]);
    fixture.detectChanges();
    const timestamps = fixture.debugElement.queryAll(By.css('.timeline__timestamp'));
    expect(timestamps.map(t => t.nativeElement.textContent.trim())).toEqual(['10:00', '11:00', '12:00']);
    expect(warn.mock.calls.some(args => String(args[0]).includes('NG0955'))).toBe(false);
    warn.mockRestore();
  });

  it('marks marker icons as decorative', () => {
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.directive(IconComponent)).componentInstance as IconComponent;
    expect(icon.decorative()).toBe(true);
  });
});

describe('TimelineComponent transcript extensions', () => {
  let fixture: ComponentFixture<TranscriptHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TranscriptHostComponent);
    fixture.detectChanges();
  });

  it('maps entry states onto semantic marker colors', () => {
    const markers = fixture.debugElement.queryAll(By.css('.timeline__marker'));
    expect(markers[0].nativeElement.classList).toContain('timeline__marker--success');
    expect(markers[1].nativeElement.classList).toContain('timeline__marker--error');
    expect(markers[2].nativeElement.classList).toContain('timeline__marker--primary');
    expect(markers[3].nativeElement.classList).toContain('timeline__marker--neutral');
  });

  it('marks only the running entry with the pulse modifier', () => {
    const markers = fixture.debugElement.queryAll(By.css('.timeline__marker'));
    const running = markers.filter((m) =>
      m.nativeElement.classList.contains('timeline__marker--running'),
    );
    expect(running.length).toBe(1);
    expect(markers[2].nativeElement.classList).toContain('timeline__marker--running');
  });

  it('renders the mono title suffix in the header', () => {
    const monos = fixture.debugElement.queryAll(By.css('.timeline__title-mono'));
    expect(monos.map((m) => m.nativeElement.textContent.trim())).toEqual([
      'step_one',
      'step_two',
    ]);
  });

  it('renders the header badge with its variant', () => {
    const badges = fixture.debugElement.queryAll(By.css('.timeline__header .lc-badge'));
    expect(badges.length).toBe(1);
    expect(badges[0].nativeElement.textContent.trim()).toBe('Fehlgeschlagen');
    expect(badges[0].nativeElement.classList).toContain('lc-badge--error');
  });

  it('renders the live meta template per item (static meta and live ticker)', () => {
    const metas = fixture.debugElement.queryAll(By.css('.timeline__meta'));
    const texts = metas.map((m) => m.nativeElement.textContent.trim());
    expect(texts).toContain('3 s');
    expect(texts).toContain('läuft seit 42 s');
  });

  it('renders free per-entry content only where the template produces it', () => {
    const commands = fixture.debugElement.queryAll(By.css('.test-command'));
    expect(commands.length).toBe(1);
    expect(commands[0].nativeElement.textContent).toContain('Schritt zwei fehlgeschlagen');
  });

  it('falls back to the static meta string without a meta template', () => {
    // Covered by the base host below: item.meta renders directly.
    const staticFixture = TestBed.createComponent(TestHostComponent);
    staticFixture.componentInstance.items.set([
      { title: 'Nur Meta', meta: '12 s' },
    ]);
    staticFixture.detectChanges();
    const meta = staticFixture.debugElement.query(By.css('.timeline__meta'));
    expect(meta.nativeElement.textContent.trim()).toBe('12 s');
  });
});
