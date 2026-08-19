import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { EmptyStateComponent } from './empty-state.component';
import { IconComponent } from '../icon/icon.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideHttpClient()],
    }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders as a status region with the md size by default', () => {
    const root = el.querySelector('.empty-state') as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.getAttribute('role')).toBe('status');
    expect(root.classList).toContain('empty-state--md');
  });

  it('applies the size class', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(el.querySelector('.empty-state--lg')).toBeTruthy();
    expect(el.querySelector('.empty-state--md')).toBeNull();
  });

  it('renders heading and message only when provided', () => {
    expect(el.querySelector('.empty-state__heading')).toBeNull();
    expect(el.querySelector('.empty-state__message')).toBeNull();

    fixture.componentRef.setInput('heading', 'No data');
    fixture.componentRef.setInput('message', 'Nothing to show yet.');
    fixture.detectChanges();
    expect(el.querySelector('.empty-state__heading')?.textContent?.trim()).toBe('No data');
    expect(el.querySelector('.empty-state__message')?.textContent?.trim()).toBe('Nothing to show yet.');
  });

  it('renders the icon as decorative when provided', () => {
    expect(el.querySelector('lc-icon')).toBeNull();
    fixture.componentRef.setInput('icon', 'chart-bar');
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.directive(IconComponent)).componentInstance as IconComponent;
    expect(icon.name()).toBe('chart-bar');
    expect(icon.decorative()).toBe(true);
  });
});
