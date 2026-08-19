import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { TimelineComponent, TimelineItem } from './timeline.component';
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
