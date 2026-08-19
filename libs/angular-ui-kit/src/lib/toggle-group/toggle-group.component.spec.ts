import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToggleGroupComponent, ToggleOption } from './toggle-group.component';
import { Component, signal } from '@angular/core';

@Component({
  standalone: true,
  imports: [ToggleGroupComponent],
  template: `
    <lc-toggle-group
      [options]="options()"
      [(selected)]="selected"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      (selectionChange)="onSelectionChange($event)"
    ></lc-toggle-group>
  `,
})
class TestHostComponent {
  options = signal<ToggleOption[]>([
    { value: '1D', label: '1D' },
    { value: '1h', label: '1H' },
    { value: '15m', label: '15M' },
    { value: 'disabled', label: 'Off', disabled: true },
  ]);
  selected = signal('1D');
  lastChanged = '';
  ariaLabel = signal<string | undefined>('Interval');
  ariaLabelledBy = signal<string | undefined>(undefined);

  onSelectionChange(value: string): void {
    this.lastChanged = value;
  }
}

describe('ToggleGroupComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(
      fixture.nativeElement.querySelector('.lc-toggle-group')
    ).toBeTruthy();
  });

  it('should render all options as buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    expect(buttons.length).toBe(4);
    expect(buttons[0].textContent.trim()).toBe('1D');
    expect(buttons[1].textContent.trim()).toBe('1H');
    expect(buttons[2].textContent.trim()).toBe('15M');
  });

  it('should mark initial selection as active', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    expect(buttons[0].classList).toContain('lc-toggle-group__btn--active');
    expect(buttons[1].classList).not.toContain('lc-toggle-group__btn--active');
  });

  it('should change selection on click', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    buttons[1].click();
    fixture.detectChanges();

    expect(host.selected()).toBe('1h');
    expect(host.lastChanged).toBe('1h');
    expect(buttons[1].classList).toContain('lc-toggle-group__btn--active');
    expect(buttons[0].classList).not.toContain('lc-toggle-group__btn--active');
  });

  it('should not change selection for disabled option', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    buttons[3].click();
    fixture.detectChanges();

    expect(host.selected()).toBe('1D');
    expect(buttons[3].classList).toContain('lc-toggle-group__btn--disabled');
  });

  describe('radiogroup semantics', () => {
    const buttons = (): HTMLButtonElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('.lc-toggle-group__btn'));

    it('should expose the container as a labelled radiogroup', () => {
      const group: HTMLElement = fixture.nativeElement.querySelector('.lc-toggle-group');
      expect(group.getAttribute('role')).toBe('radiogroup');
      expect(group.getAttribute('aria-label')).toBe('Interval');

      host.ariaLabelledBy.set('ext-label');
      fixture.detectChanges();
      expect(group.getAttribute('aria-labelledby')).toBe('ext-label');
      expect(group.hasAttribute('aria-label')).toBe(false);
    });

    it('should expose options as radios with aria-checked', () => {
      const btns = buttons();
      expect(btns.every((b) => b.getAttribute('role') === 'radio')).toBe(true);
      expect(btns.map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false']);
      expect(btns.some((b) => b.hasAttribute('aria-pressed'))).toBe(false);
    });

    it('should use a roving tabindex with the selected option as the tab stop', () => {
      expect(buttons().map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);
      buttons()[2].click();
      fixture.detectChanges();
      expect(buttons().map((b) => b.tabIndex)).toEqual([-1, -1, 0, -1]);
    });

    it('should fall back to the first enabled option as tab stop when nothing is selected', () => {
      host.options.set([
        { value: 'off', label: 'Off', disabled: true },
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]);
      host.selected.set('nope');
      fixture.detectChanges();
      expect(buttons().map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    });

    it('should move selection and focus with ArrowRight / ArrowLeft, skipping disabled options', () => {
      const btns = buttons();
      btns[0].focus();
      btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(host.selected()).toBe('1h');
      expect(document.activeElement).toBe(btns[1]);

      // 15m -> (disabled skipped, wraps) -> 1D
      btns[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      btns[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(host.selected()).toBe('1D');
      expect(document.activeElement).toBe(btns[0]);

      btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(host.selected()).toBe('15m');
      expect(document.activeElement).toBe(btns[2]);
    });

    it('should jump to the first / last enabled option with Home / End', () => {
      const btns = buttons();
      btns[1].click();
      fixture.detectChanges();

      btns[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();
      expect(host.selected()).toBe('15m');
      expect(document.activeElement).toBe(btns[2]);

      btns[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      fixture.detectChanges();
      expect(host.selected()).toBe('1D');
      expect(document.activeElement).toBe(btns[0]);
    });

    it('should prevent default scrolling for handled keys and ignore other keys', () => {
      const btns = buttons();
      const arrow = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      btns[0].dispatchEvent(arrow);
      expect(arrow.defaultPrevented).toBe(true);

      const other = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      btns[0].dispatchEvent(other);
      fixture.detectChanges();
      expect(other.defaultPrevented).toBe(false);
      expect(host.selected()).toBe('1h');
    });
  });

  describe('dot indicator', () => {
    it('should not render a dot by default', () => {
      expect(
        fixture.nativeElement.querySelector('.lc-toggle-group__dot')
      ).toBeNull();
    });

    it('should render a warning dot for dot: true', () => {
      host.options.set([
        { value: 'a', label: 'A', dot: true },
        { value: 'b', label: 'B' },
      ]);
      fixture.detectChanges();

      const dots = fixture.nativeElement.querySelectorAll(
        '.lc-toggle-group__dot'
      );
      expect(dots.length).toBe(1);
      expect(dots[0].classList).toContain('lc-toggle-group__dot--warning');
      expect(dots[0].getAttribute('aria-hidden')).toBe('true');
    });

    it('should render the requested semantic tone', () => {
      host.options.set([
        { value: 'a', label: 'A', dot: 'error' },
        { value: 'b', label: 'B', dot: 'success' },
      ]);
      fixture.detectChanges();

      const dots = fixture.nativeElement.querySelectorAll(
        '.lc-toggle-group__dot'
      );
      expect(dots[0].classList).toContain('lc-toggle-group__dot--error');
      expect(dots[1].classList).toContain('lc-toggle-group__dot--success');
    });
  });
});
