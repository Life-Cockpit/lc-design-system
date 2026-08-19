import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { DrawerComponent } from './drawer.component';
import { OverlayStackService } from '../shared/overlay-stack.service';

@Component({
  standalone: true,
  imports: [DrawerComponent],
  template: `
    <button type="button" class="opener" (click)="open.set(true)">Open</button>
    <lc-drawer
      [open]="open()"
      [heading]="heading()"
      [position]="position()"
      [size]="size()"
      [hasOverlay]="hasOverlay()"
      (closed)="onClosed()"
    >
      <p>Drawer content</p>
      <button type="button" class="inside">Inside</button>
    </lc-drawer>
  `,
})
class TestHostComponent {
  open = signal(false);
  heading = signal('Test Heading');
  position = signal<'left' | 'right'>('right');
  size = signal<'sm' | 'md' | 'lg' | 'xl'>('md');
  hasOverlay = signal(true);
  closedCount = 0;
  onClosed() {
    this.closedCount++;
  }
}

/** jsdom has no layout, so the CDK would consider nothing tabbable. */
const FOCUSABLE = 'button, input, [tabindex]';
const interactivityCheckerStub = {
  isFocusable: (el: Element) => el.matches(FOCUSABLE),
  isTabbable: (el: Element) => el.matches(FOCUSABLE),
};

describe('DrawerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: InteractivityChecker, useValue: interactivityCheckerStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.style.overflow = '';
  });

  it('should not render content when closed', () => {
    expect(fixture.nativeElement.querySelector('.lc-drawer')).toBeNull();
  });

  it('should render content when open', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const drawer = fixture.nativeElement.querySelector('.lc-drawer');
    expect(drawer).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-drawer__heading')?.textContent?.trim()).toBe(
      'Test Heading',
    );
  });

  it('should project child content', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.lc-drawer__body p')?.textContent?.trim()).toBe(
      'Drawer content',
    );
  });

  it('should apply position class', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.lc-drawer__panel--right')).toBeTruthy();
  });

  it('should emit closed on close button click', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const closeBtn = fixture.nativeElement.querySelector('.lc-drawer__close');
    closeBtn?.click();
    fixture.detectChanges();

    expect(host.closedCount).toBe(1);
  });

  it('should emit closed on overlay click', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const overlay = fixture.nativeElement.querySelector('.lc-drawer__overlay');
    overlay?.click();
    fixture.detectChanges();

    expect(host.closedCount).toBe(1);
  });

  it('should emit closed on Escape key', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(host.closedCount).toBe(1);
  });

  it('should have correct width for size md', async () => {
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = fixture.nativeElement.querySelector('.lc-drawer__panel') as HTMLElement;
    expect(panel.style.width).toBe('400px');
  });

  describe('scroll lock', () => {
    it('should lock body scroll while open and restore the previous value after the close animation', () => {
      jest.useFakeTimers();
      document.body.style.overflow = 'auto';

      host.open.set(true);
      fixture.detectChanges();
      expect(document.body.style.overflow).toBe('hidden');

      host.open.set(false);
      fixture.detectChanges();
      expect(document.body.style.overflow).toBe('hidden'); // still animating out
      jest.advanceTimersByTime(250);
      fixture.detectChanges();
      expect(document.body.style.overflow).toBe('auto');
      expect(fixture.nativeElement.querySelector('.lc-drawer')).toBeNull();
    });

    it('should cancel the pending hide when re-opened during the close animation', () => {
      jest.useFakeTimers();
      host.open.set(true);
      fixture.detectChanges();
      host.open.set(false);
      fixture.detectChanges();
      jest.advanceTimersByTime(100);

      host.open.set(true);
      fixture.detectChanges();
      jest.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.lc-drawer')).toBeTruthy();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when destroyed while open', () => {
      host.open.set(true);
      fixture.detectChanges();
      expect(document.body.style.overflow).toBe('hidden');

      fixture.destroy();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('overlay stacking', () => {
    it('should stop the Escape from propagating when it handles it', () => {
      host.open.set(true);
      fixture.detectChanges();
      const reachedWindow = jest.fn();
      window.addEventListener('keydown', reachedWindow);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(host.closedCount).toBe(1);
      expect(reachedWindow).not.toHaveBeenCalled();
      window.removeEventListener('keydown', reachedWindow);
    });

    it('should leave Escape and overlay clicks to an overlay on top of it', () => {
      const stack = TestBed.inject(OverlayStackService);
      host.open.set(true);
      fixture.detectChanges();
      stack.push('menu-inside-the-drawer');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      (fixture.nativeElement.querySelector('.lc-drawer__overlay') as HTMLElement).click();

      expect(host.closedCount).toBe(0);
      stack.remove('menu-inside-the-drawer');
    });

    it('should unregister itself as soon as it starts closing', () => {
      const stack = TestBed.inject(OverlayStackService);
      host.open.set(true);
      fixture.detectChanges();
      host.open.set(false);
      fixture.detectChanges();

      stack.push('probe');
      expect(stack.isTop('probe')).toBe(true);
      stack.remove('probe');
      // and does not react to Escape any more even though it is still animating out
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(host.closedCount).toBe(0);
    });
  });

  describe('focus management', () => {
    it('should be a modal dialog with a focus trap only while it has an overlay', () => {
      host.open.set(true);
      fixture.detectChanges();
      const panel = () => fixture.nativeElement.querySelector('.lc-drawer__panel') as HTMLElement;
      expect(panel().getAttribute('aria-modal')).toBe('true');

      host.hasOverlay.set(false);
      fixture.detectChanges();
      expect(panel().hasAttribute('aria-modal')).toBe(false);
    });

    it('should move focus into the drawer on open and back to the opener on close', async () => {
      jest.useFakeTimers();
      const opener = fixture.nativeElement.querySelector('.opener') as HTMLButtonElement;
      opener.focus();

      opener.click();
      fixture.detectChanges();
      await fixture.whenStable();
      const panel = fixture.nativeElement.querySelector('.lc-drawer__panel') as HTMLElement;
      expect(panel.contains(document.activeElement)).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      host.open.set(false);
      fixture.detectChanges();
      jest.advanceTimersByTime(250);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.lc-drawer')).toBeNull();
      expect(document.activeElement).toBe(opener);
    });
  });
});
