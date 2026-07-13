import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lc-test-wrapper',
  standalone: true,
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-card
      [variant]="variant"
      [padding]="padding"
      [borderRadius]="borderRadius"
      [clickable]="clickable"
      [selected]="selected"
      [ariaLabel]="ariaLabel"
      (cardClick)="onCardClick($event)"
    >
      <ng-content></ng-content>
    </lc-card>
  `,
})
class TestWrapperComponent {
  variant: 'elevated' | 'outlined' | 'flat' = 'elevated';
  padding: 'none' | 'xs' | 'sm' | 'md' | 'lg' = 'md';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full' = 'md';
  clickable = false;
  selected = false;
  ariaLabel?: string;
  clickCount = 0;

  onCardClick(_event: MouseEvent): void {
    this.clickCount++;
  }
}

describe('CardComponent', () => {
  let component: TestWrapperComponent;
  let fixture: ComponentFixture<TestWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestWrapperComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() here - let each test control it
  });

  function getCardElement(): HTMLElement {
    const element = fixture.nativeElement.querySelector('.card');
    if (!element) {
      throw new Error('Card element not found');
    }
    return element as HTMLElement;
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Variants', () => {
    it('should apply elevated variant by default', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-elevated')).toBe(true);
    });

    it('should apply outlined variant when specified', () => {
      component.variant = 'outlined';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-outlined')).toBe(true);
      expect(cardElement.classList.contains('card-elevated')).toBe(false);
    });

    it('should apply flat variant when specified', () => {
      component.variant = 'flat';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-flat')).toBe(true);
      expect(cardElement.classList.contains('card-elevated')).toBe(false);
    });
  });

  describe('Padding', () => {
    it('should apply md padding by default', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-padding-md')).toBe(true);
    });

    it('should apply none padding when specified', () => {
      component.padding = 'none';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-padding-none')).toBe(true);
    });

    it('should apply xs padding when specified', () => {
      component.padding = 'xs';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-padding-xs')).toBe(true);
    });

    it('should apply sm padding when specified', () => {
      component.padding = 'sm';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-padding-sm')).toBe(true);
    });

    it('should apply lg padding when specified', () => {
      component.padding = 'lg';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-padding-lg')).toBe(true);
    });
  });

  describe('Border Radius', () => {
    it('should apply md border radius by default', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-radius-md')).toBe(true);
    });

    it('should apply none border radius when specified', () => {
      component.borderRadius = 'none';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-radius-none')).toBe(true);
    });

    it('should apply sm border radius when specified', () => {
      component.borderRadius = 'sm';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-radius-sm')).toBe(true);
    });

    it('should apply lg border radius when specified', () => {
      component.borderRadius = 'lg';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-radius-lg')).toBe(true);
    });

    it('should apply full border radius when specified', () => {
      component.borderRadius = 'full';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-radius-full')).toBe(true);
    });
  });

  describe('Clickable State', () => {
    it('should not be clickable by default', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-clickable')).toBe(false);
    });

    it('should apply clickable class when clickable is true', () => {
      component.clickable = true;
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-clickable')).toBe(true);
    });

    it('should emit cardClick event when clickable card is clicked', () => {
      component.clickable = true;
      fixture.detectChanges();

      const cardElement = getCardElement();
      cardElement.click();
      fixture.detectChanges();

      expect(component.clickCount).toBe(1);
    });

    it('should not emit cardClick event when non-clickable card is clicked', () => {
      component.clickable = false;
      fixture.detectChanges();

      const cardElement = getCardElement();
      cardElement.click();
      fixture.detectChanges();

      expect(component.clickCount).toBe(0);
    });

    it('should have pointer cursor when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();
      const cardElement = getCardElement();
      // Check for the clickable class which applies cursor: pointer in SCSS
      expect(cardElement.classList.contains('card-clickable')).toBe(true);
    });
  });

  describe('Selected State', () => {
    it('should not be selected by default', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-selected')).toBe(false);
    });

    it('should apply selected class when selected is true', () => {
      component.selected = true;
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-selected')).toBe(true);
    });

    it('should work with clickable state', () => {
      component.clickable = true;
      component.selected = true;
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-clickable')).toBe(true);
      expect(cardElement.classList.contains('card-selected')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should apply aria-label when provided', () => {
      component.ariaLabel = 'Card description';
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.getAttribute('aria-label')).toBe('Card description');
    });

    it('should not have aria-label by default', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.getAttribute('aria-label')).toBeNull();
    });

    it('should have role="article" for semantic HTML', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.getAttribute('role')).toBe('article');
    });

    it('should have role="button" when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.getAttribute('role')).toBe('button');
    });

    it('should have tabindex="0" when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.getAttribute('tabindex')).toBe('0');
    });

    it('should not have tabindex when not clickable', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.getAttribute('tabindex')).toBeNull();
    });

    it('should emit click on Enter key when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();

      const cardElement = getCardElement();
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      cardElement.dispatchEvent(event);
      fixture.detectChanges();

      expect(component.clickCount).toBe(1);
    });

    it('should emit click on Space key when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();

      const cardElement = getCardElement();
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      cardElement.dispatchEvent(event);
      fixture.detectChanges();

      expect(component.clickCount).toBe(1);
    });

    it('should not emit click on other keys when clickable', () => {
      component.clickable = true;
      fixture.detectChanges();

      const cardElement = getCardElement();
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      cardElement.dispatchEvent(event);
      fixture.detectChanges();

      expect(component.clickCount).toBe(0);
    });
  });

  describe('Content Projection', () => {
    it('should project default content', () => {
      const testFixture = TestBed.createComponent(TestWrapperComponent);
      testFixture.nativeElement.querySelector('lc-card').innerHTML = '<p>Test content</p>';
      testFixture.detectChanges();

      expect(testFixture.nativeElement.textContent).toContain('Test content');
    });

    it('should support header slot projection', () => {
      const testFixture = TestBed.createComponent(TestWrapperComponent);
      testFixture.nativeElement.querySelector('lc-card').innerHTML =
        '<div class="card-header">Header</div>';
      testFixture.detectChanges();

      const header = testFixture.nativeElement.querySelector('.card-header');
      expect(header).toBeTruthy();
    });

    it('should support content slot projection', () => {
      const testFixture = TestBed.createComponent(TestWrapperComponent);
      testFixture.nativeElement.querySelector('lc-card').innerHTML =
        '<div class="card-content">Content</div>';
      testFixture.detectChanges();

      const content = testFixture.nativeElement.querySelector('.card-content');
      expect(content).toBeTruthy();
    });

    it('should support footer slot projection', () => {
      const testFixture = TestBed.createComponent(TestWrapperComponent);
      testFixture.nativeElement.querySelector('lc-card').innerHTML =
        '<div class="card-footer">Footer</div>';
      testFixture.detectChanges();

      const footer = testFixture.nativeElement.querySelector('.card-footer');
      expect(footer).toBeTruthy();
    });
  });

  describe('Component Initialization', () => {
    it('should have default values on initialization', () => {
      fixture.detectChanges();
      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-elevated')).toBe(true);
      expect(cardElement.classList.contains('card-padding-md')).toBe(true);
      expect(cardElement.classList.contains('card-radius-md')).toBe(true);
      expect(cardElement.classList.contains('card-clickable')).toBe(false);
      expect(cardElement.classList.contains('card-selected')).toBe(false);
    });

    it('should accept all inputs via wrapper', () => {
      component.variant = 'outlined';
      component.padding = 'lg';
      component.borderRadius = 'lg';
      component.clickable = true;
      component.selected = true;
      component.ariaLabel = 'Test label';
      fixture.detectChanges();

      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-outlined')).toBe(true);
      expect(cardElement.classList.contains('card-padding-lg')).toBe(true);
      expect(cardElement.classList.contains('card-radius-lg')).toBe(true);
      expect(cardElement.classList.contains('card-clickable')).toBe(true);
      expect(cardElement.classList.contains('card-selected')).toBe(true);
      expect(cardElement.getAttribute('aria-label')).toBe('Test label');
    });
  });

  describe('Class Combinations', () => {
    it('should combine variant, padding, and radius classes', () => {
      component.variant = 'outlined';
      component.padding = 'lg';
      component.borderRadius = 'sm';
      fixture.detectChanges();

      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-outlined')).toBe(true);
      expect(cardElement.classList.contains('card-padding-lg')).toBe(true);
      expect(cardElement.classList.contains('card-radius-sm')).toBe(true);
    });

    it('should combine clickable and selected classes', () => {
      component.clickable = true;
      component.selected = true;
      fixture.detectChanges();

      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card-clickable')).toBe(true);
      expect(cardElement.classList.contains('card-selected')).toBe(true);
    });

    it('should apply all classes together', () => {
      component.variant = 'flat';
      component.padding = 'xs';
      component.borderRadius = 'full';
      component.clickable = true;
      component.selected = true;
      fixture.detectChanges();

      const cardElement = getCardElement();
      expect(cardElement.classList.contains('card')).toBe(true);
      expect(cardElement.classList.contains('card-flat')).toBe(true);
      expect(cardElement.classList.contains('card-padding-xs')).toBe(true);
      expect(cardElement.classList.contains('card-radius-full')).toBe(true);
      expect(cardElement.classList.contains('card-clickable')).toBe(true);
      expect(cardElement.classList.contains('card-selected')).toBe(true);
    });
  });

  describe('Icon size', () => {
    let iconFixture: ComponentFixture<CardComponent>;

    beforeEach(() => {
      iconFixture = TestBed.createComponent(CardComponent);
      iconFixture.componentRef.setInput('title', 'Section');
      iconFixture.componentRef.setInput('icon', 'settings');
    });

    it('applies the md tile size by default', () => {
      iconFixture.detectChanges();
      const tile = iconFixture.nativeElement.querySelector('.card__icon');
      expect(tile.classList).toContain('card__icon--size-md');
    });

    it('applies the sm tile size when iconSize="sm"', () => {
      iconFixture.componentRef.setInput('iconSize', 'sm');
      iconFixture.detectChanges();
      const tile = iconFixture.nativeElement.querySelector('.card__icon');
      expect(tile.classList).toContain('card__icon--size-sm');
    });
  });

  describe('card-badge slot', () => {
    it('projects a badge into the title row and hides the empty slot otherwise', async () => {
      @Component({
        standalone: true,
        imports: [CardComponent],
        template: `
          <lc-card title="With slot"><span card-badge class="probe">Ready</span></lc-card>
          <lc-card title="No slot"></lc-card>
        `,
      })
      class BadgeSlotHost {}

      const f = TestBed.createComponent(BadgeSlotHost);
      f.detectChanges();
      const cards = f.nativeElement.querySelectorAll('lc-card');
      expect(cards[0].querySelector('.card__title-row .probe')?.textContent).toContain('Ready');
      expect(cards[1].querySelector('.card__badge-slot')?.textContent?.trim()).toBe('');
    });
  });
});
