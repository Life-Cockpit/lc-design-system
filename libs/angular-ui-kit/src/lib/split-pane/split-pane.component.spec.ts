import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { SplitPaneComponent } from './split-pane.component';

@Component({
  standalone: true,
  imports: [SplitPaneComponent],
  template: `
    <lc-split-pane
      [initialSize]="360"
      [minSize]="280"
      [maxSize]="maxSize()"
      [step]="20"
      [storageKey]="storageKey()"
      [stackBelow]="stackBelow()"
      (sizeChange)="sizes.push($event)"
    >
      <div slot="start" class="start-content">Start</div>
      <div slot="end" class="end-content">End</div>
    </lc-split-pane>
  `,
})
class TestHost {
  maxSize = signal<number | string | null>(480);
  storageKey = signal<string | undefined>(undefined);
  stackBelow = signal(0);
  sizes: number[] = [];
}

/** Minimal stand-in for PointerEvent, which jsdom does not implement. */
function pointerEvent(
  type: string,
  init: { pointerId: number; clientX: number },
): PointerEvent {
  const event = new MouseEvent(type, {
    clientX: init.clientX,
    bubbles: true,
  }) as unknown as PointerEvent & { pointerId: number };
  Object.defineProperty(event, 'pointerId', { value: init.pointerId });
  return event;
}

describe('SplitPaneComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  function create(): void {
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function startPane(): HTMLElement {
    return el.querySelector('.lc-split-pane__pane--start') as HTMLElement;
  }

  function separator(): HTMLElement {
    return el.querySelector('.lc-split-pane__separator') as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    localStorage.clear();
  });

  it('projects both panes and applies the initial size', () => {
    create();
    expect(el.querySelector('.start-content')?.textContent).toContain('Start');
    expect(el.querySelector('.end-content')?.textContent).toContain('End');
    expect(startPane().style.flexBasis).toBe('360px');
  });

  it('exposes separator semantics for assistive tech', () => {
    create();
    const sep = separator();
    expect(sep.getAttribute('role')).toBe('separator');
    expect(sep.getAttribute('aria-orientation')).toBe('vertical');
    expect(sep.getAttribute('tabindex')).toBe('0');
    expect(sep.getAttribute('aria-valuenow')).toBe('360');
    expect(sep.getAttribute('aria-valuemin')).toBe('280');
    expect(sep.getAttribute('aria-valuemax')).toBe('480');
  });

  it('resizes by pointer drag within min/max bounds', () => {
    create();
    const sep = separator();

    sep.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 100 }));
    sep.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 160 }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('420px');
    expect(host.sizes).toEqual([420]);

    // beyond max → clamped
    sep.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 400 }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('480px');

    // below min → clamped
    sep.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: -400 }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('280px');

    sep.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: -400 }));
  });

  it('ignores moves of other pointers', () => {
    create();
    const sep = separator();
    sep.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 100 }));
    sep.dispatchEvent(pointerEvent('pointermove', { pointerId: 2, clientX: 999 }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('360px');
  });

  it('restores the initial size on double-click', () => {
    create();
    const sep = separator();
    sep.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 0 }));
    sep.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 80 }));
    sep.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 80 }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('440px');

    sep.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('360px');
  });

  it('resizes via keyboard and respects bounds', () => {
    create();
    const sep = separator();

    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('380px');

    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('360px');

    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('480px');

    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('280px');

    // at min, ArrowLeft must not go further
    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('280px');
  });

  it('persists the width under storageKey and restores it on next init', () => {
    localStorage.setItem('lc-split-pane:test-pane', '400');

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    host.storageKey.set('test-pane');
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('400px');

    const sep = separator();
    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(localStorage.getItem('lc-split-pane:test-pane')).toBe('420');
  });

  it('does not persist without storageKey', () => {
    create();
    separator().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(localStorage.length).toBe(0);
  });

  it('stacks panes and disables the resizer below the breakpoint', () => {
    const originalMatchMedia = window.matchMedia;
    const listeners: Array<(e: { matches: boolean }) => void> = [];
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({
        matches: true,
        addEventListener: (_: string, cb: (e: { matches: boolean }) => void) =>
          listeners.push(cb),
        removeEventListener: jest.fn(),
      }),
    });

    try {
      create();
      expect(el.querySelector('.lc-split-pane--stacked')).toBeNull();

      host.stackBelow.set(768);
      fixture.detectChanges();
      expect(el.querySelector('.lc-split-pane--stacked')).toBeTruthy();
      expect(separator()).toBeNull();
      expect(startPane().style.flexBasis).toBe('');

      // viewport grows past the breakpoint again
      listeners.forEach((cb) => cb({ matches: false }));
      fixture.detectChanges();
      expect(el.querySelector('.lc-split-pane--stacked')).toBeNull();
      expect(separator()).toBeTruthy();
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
    }
  });

  it('resolves percentage maxSize against the container width', () => {
    create();
    const component = fixture.debugElement.children[0].componentInstance as SplitPaneComponent;
    // jsdom has no layout — feed the container width directly.
    (component as unknown as { containerWidth: { set(v: number): void } })
      .containerWidth.set(1000);
    host.maxSize.set('40%');
    fixture.detectChanges();

    const sep = separator();
    sep.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 0 }));
    sep.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 500 }));
    fixture.detectChanges();
    expect(startPane().style.flexBasis).toBe('400px');
    expect(sep.getAttribute('aria-valuemax')).toBe('400');
  });
});
