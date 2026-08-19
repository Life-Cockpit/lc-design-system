import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RatingComponent, RatingSize } from './rating.component';
import { provideHttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [RatingComponent],
  template: `
    <lc-rating
      [max]="max()"
      [size]="size()"
      [readonly]="readonly()"
      [disabled]="disabled()"
      [allowHalf]="allowHalf()"
      [label]="label()"
      [showValue]="showValue()"
      (ratingChange)="onRating($event)"
    />
  `,
})
class TestHostComponent {
  max = signal(5);
  size = signal<RatingSize>('md');
  readonly = signal(false);
  disabled = signal(false);
  allowHalf = signal(false);
  label = signal('');
  showValue = signal(false);
  lastRating: number | null = null;
  ratings: number[] = [];
  onRating(val: number) {
    this.lastRating = val;
    this.ratings.push(val);
  }
}

@Component({
  standalone: true,
  imports: [RatingComponent, ReactiveFormsModule],
  template: `<lc-rating label="Score" [formControl]="control" />`,
})
class FormHostComponent {
  control = new FormControl<number>(2, { nonNullable: true });
}

describe('RatingComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const stars = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('.rating__star'));
  const group = (): HTMLElement => fixture.nativeElement.querySelector('.rating__stars');

  function press(key: string, target: HTMLElement = group()): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  /** Clicks `star` at a horizontal position (0..1) inside a 20px wide button. */
  function clickAt(star: HTMLButtonElement, fraction: number): void {
    jest.spyOn(star, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 0, width: 20, height: 20, right: 120, bottom: 20, x: 100, y: 0, toJSON: () => ({}),
    } as DOMRect);
    star.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100 + 20 * fraction, detail: 1 }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, FormHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render 5 stars by default', () => {
    fixture.detectChanges();
    expect(stars().length).toBe(5);
  });

  it('should render custom number of stars', () => {
    host.max.set(10);
    fixture.detectChanges();
    expect(stars().length).toBe(10);
  });

  it('should emit rating on click', () => {
    fixture.detectChanges();
    stars()[2].click();
    fixture.detectChanges();
    expect(host.lastRating).toBe(3);
  });

  it('should not emit when readonly', () => {
    host.readonly.set(true);
    fixture.detectChanges();
    stars()[2].click();
    expect(host.lastRating).toBeNull();
  });

  it('should not emit when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    stars()[2].click();
    expect(host.lastRating).toBeNull();
  });

  it('should apply readonly class', () => {
    host.readonly.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rating').classList).toContain('rating--readonly');
  });

  it('should apply disabled class', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rating').classList).toContain('rating--disabled');
  });

  it('should render label', () => {
    host.label.set('Your rating');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.rating__label');
    expect(label.textContent.trim()).toBe('Your rating');
  });

  it('should show value when enabled', () => {
    host.showValue.set(true);
    fixture.detectChanges();
    const valueEl = fixture.nativeElement.querySelector('.rating__value');
    expect(valueEl).toBeTruthy();
    expect(valueEl.textContent).toContain('0/5');
  });

  it('should apply size class', () => {
    host.size.set('lg');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rating').classList).toContain('rating--lg');
  });

  it('should fill stars up to selected value', () => {
    fixture.detectChanges();
    stars()[3].click(); // rate 4
    fixture.detectChanges();
    const filledIcons = fixture.nativeElement.querySelectorAll('.rating__icon--filled');
    expect(filledIcons.length).toBe(4);
  });

  describe('radio semantics', () => {
    it('should expose stars as radios with aria-checked on the selected one', () => {
      host.label.set('Quality');
      fixture.detectChanges();
      const g = group();
      expect(g.getAttribute('role')).toBe('radiogroup');
      expect(g.getAttribute('aria-labelledby')).toBe(fixture.nativeElement.querySelector('.rating__label').id);
      for (const s of stars()) {
        expect(s.getAttribute('role')).toBe('radio');
        expect(s.getAttribute('aria-checked')).toBe('false');
      }
      expect(stars()[2].getAttribute('aria-label')).toBe('3 of 5 stars');

      stars()[2].click();
      fixture.detectChanges();
      expect(stars().map(s => s.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true', 'false', 'false']);
    });

    it('should keep a single tab stop that follows the checked star', () => {
      fixture.detectChanges();
      expect(stars().map(s => s.tabIndex)).toEqual([0, -1, -1, -1, -1]);
      stars()[3].click();
      fixture.detectChanges();
      expect(stars().map(s => s.tabIndex)).toEqual([-1, -1, -1, 0, -1]);
    });
  });

  describe('keyboard', () => {
    it('should step with the arrow keys and jump with Home/End', () => {
      fixture.detectChanges();
      stars()[0].focus();
      const right = press('ArrowRight', stars()[0]);
      expect(right.defaultPrevented).toBe(true);
      expect(host.lastRating).toBe(1);
      expect(document.activeElement).toBe(stars()[0]);

      press('ArrowRight', stars()[0]);
      expect(host.lastRating).toBe(2);
      expect(document.activeElement).toBe(stars()[1]);
      press('ArrowUp', stars()[1]);
      expect(host.lastRating).toBe(3);
      press('ArrowLeft', stars()[2]);
      expect(host.lastRating).toBe(2);
      press('ArrowDown', stars()[1]);
      expect(host.lastRating).toBe(1);
      press('ArrowLeft', stars()[0]);
      expect(host.lastRating).toBe(1);

      press('End', stars()[0]);
      expect(host.lastRating).toBe(5);
      expect(document.activeElement).toBe(stars()[4]);
      press('Home', stars()[4]);
      expect(host.lastRating).toBe(1);
    });

    it('should step by halves when allowHalf is on', () => {
      host.allowHalf.set(true);
      fixture.detectChanges();
      press('ArrowRight');
      expect(host.lastRating).toBe(0.5);
      press('ArrowRight');
      expect(host.lastRating).toBe(1);
      press('ArrowRight');
      expect(host.lastRating).toBe(1.5);
      expect(stars()[1].getAttribute('aria-checked')).toBe('true');
      expect(stars()[1].getAttribute('aria-label')).toBe('1.5 of 5 stars');
      expect(fixture.nativeElement.querySelectorAll('.rating__icon--filled').length).toBe(1);
      expect(fixture.nativeElement.querySelectorAll('.rating__icon--half').length).toBe(1);
      press('End');
      expect(host.lastRating).toBe(5);
    });

    it('should ignore keys when readonly or disabled', () => {
      host.readonly.set(true);
      fixture.detectChanges();
      press('ArrowRight');
      expect(host.lastRating).toBeNull();
      host.readonly.set(false);
      host.disabled.set(true);
      fixture.detectChanges();
      press('ArrowRight');
      expect(host.lastRating).toBeNull();
    });
  });

  describe('half selection', () => {
    it('should select n-0.5 on the left half and n on the right half of a star', () => {
      host.allowHalf.set(true);
      fixture.detectChanges();
      clickAt(stars()[2], 0.25);
      expect(host.lastRating).toBe(2.5);
      clickAt(stars()[2], 0.75);
      expect(host.lastRating).toBe(3);
    });

    it('should always select whole stars when allowHalf is off', () => {
      fixture.detectChanges();
      clickAt(stars()[2], 0.25);
      expect(host.lastRating).toBe(3);
    });
  });

  describe('readonly', () => {
    it('should stay focusable and announce aria-readonly without disabling the stars', () => {
      host.readonly.set(true);
      fixture.detectChanges();
      expect(group().getAttribute('aria-readonly')).toBe('true');
      for (const s of stars()) expect(s.disabled).toBe(false);
      expect(stars().some(s => s.tabIndex === 0)).toBe(true);
    });

    it('should disable the stars when disabled', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      for (const s of stars()) expect(s.disabled).toBe(true);
    });
  });

  describe('forms integration', () => {
    it('should show the control value, follow disable() and mark touched after a click and on focus out', () => {
      const formFixture = TestBed.createComponent(FormHostComponent);
      formFixture.detectChanges();
      const root: HTMLElement = formFixture.nativeElement;
      const btns = Array.from(root.querySelectorAll('.rating__star')) as HTMLButtonElement[];
      expect(btns[1].getAttribute('aria-checked')).toBe('true');
      expect(root.querySelectorAll('.rating__icon--filled').length).toBe(2);

      const control = formFixture.componentInstance.control;
      expect(control.touched).toBe(false);
      btns[3].click();
      formFixture.detectChanges();
      expect(control.value).toBe(4);
      expect(control.touched).toBe(true);

      control.markAsUntouched();
      const g = root.querySelector('.rating__stars') as HTMLElement;
      // Focus moving between stars does not count as leaving the group…
      g.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: btns[0] }));
      expect(control.touched).toBe(false);
      // …leaving it does.
      g.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      expect(control.touched).toBe(true);

      control.disable();
      formFixture.detectChanges();
      for (const b of btns) expect(b.disabled).toBe(true);
    });
  });
});
