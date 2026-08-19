import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ChipComponent } from './chip.component';
import { IconComponent } from '../icon/icon.component';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

const MOCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>';

describe('ChipComponent', () => {
  let component: ChipComponent;
  let fixture: ComponentFixture<ChipComponent>;
  let chipElement: HTMLElement;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ChipComponent);
    component = fixture.componentInstance;
    chipElement = fixture.nativeElement;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    const pendingRequests = httpMock.match(() => true);
    pendingRequests.forEach((req) => {
      if (!req.cancelled) {
        req.flush(MOCK_SVG);
      }
    });
    httpMock.verify();
  });

  describe('Component Structure', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render with lc-chip class', () => {
      const chip = chipElement.querySelector('.lc-chip');
      expect(chip).toBeTruthy();
    });

    it('should project content', () => {
      @Component({
        template: `<lc-chip>Test Content</lc-chip>`,
        standalone: true,
        imports: [ChipComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {}

      const testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();

      const content = testFixture.nativeElement.textContent;
      expect(content).toContain('Test Content');
    });
  });

  describe('Variant Input', () => {
    it('should have default variant', () => {
      expect(component.variant()).toBe('default');
      const chip = chipElement.querySelector('.lc-chip--default');
      expect(chip).toBeTruthy();
    });

    it('should apply primary variant', () => {
      fixture.componentRef.setInput('variant', 'primary');
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--primary');
      expect(chip).toBeTruthy();
    });

    it('should apply success variant', () => {
      fixture.componentRef.setInput('variant', 'success');
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--success');
      expect(chip).toBeTruthy();
    });

    it('should apply warning variant', () => {
      fixture.componentRef.setInput('variant', 'warning');
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--warning');
      expect(chip).toBeTruthy();
    });

    it('should apply error variant', () => {
      fixture.componentRef.setInput('variant', 'error');
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--error');
      expect(chip).toBeTruthy();
    });

    it('should apply info variant', () => {
      fixture.componentRef.setInput('variant', 'info');
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--info');
      expect(chip).toBeTruthy();
    });
  });

  describe('Size Input', () => {
    it('should have md size by default', () => {
      expect(component.size()).toBe('md');
      const chip = chipElement.querySelector('.lc-chip--md');
      expect(chip).toBeTruthy();
    });

    it('should apply sm size', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--sm');
      expect(chip).toBeTruthy();
    });

    it('should apply lg size', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--lg');
      expect(chip).toBeTruthy();
    });
  });

  describe('Removable Functionality', () => {
    it('should not show delete button by default', () => {
      const deleteBtn = chipElement.querySelector('.lc-chip__delete');
      expect(deleteBtn).toBeFalsy();
    });

    it('should show delete button when removable is true', () => {
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const deleteBtn = chipElement.querySelector('.lc-chip__delete');
      expect(deleteBtn).toBeTruthy();
    });

    it('should emit remove event when delete button is clicked', () => {
      const removeSpy = jest.fn();
      component.remove.subscribe(removeSpy);

      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const deleteBtn = chipElement.querySelector('.lc-chip__delete') as HTMLElement;
      deleteBtn.click();

      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it('should apply removable class when removable is true', () => {
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--removable');
      expect(chip).toBeTruthy();
    });
  });

  describe('Icon Support', () => {
    it('should render icon when provided', () => {
      fixture.componentRef.setInput('icon', 'tag');
      fixture.detectChanges();

      const icon = chipElement.querySelector('lc-icon');
      expect(icon).toBeTruthy();
    });

    it('should not render icon when not provided', () => {
      const icon = chipElement.querySelector('lc-icon');
      expect(icon).toBeNull();
    });
  });

  describe('Clickable Functionality', () => {
    it('should render as a span without button wrapper by default', () => {
      const chip = chipElement.querySelector('.lc-chip');
      expect(chip?.tagName.toLowerCase()).toBe('span');
      expect(chipElement.querySelector('button.lc-chip')).toBeNull();
    });

    it('should render as a button when clickable', () => {
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip');
      expect(chip?.tagName.toLowerCase()).toBe('button');
      expect(chip?.getAttribute('type')).toBe('button');
    });

    it('should apply clickable class when clickable', () => {
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();

      expect(chipElement.querySelector('.lc-chip--clickable')).toBeTruthy();
    });

    it('should emit chipClick on click', () => {
      const clickSpy = jest.fn();
      component.chipClick.subscribe(clickSpy);

      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();

      (chipElement.querySelector('.lc-chip') as HTMLElement).click();

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('should not emit chipClick when disabled', () => {
      const clickSpy = jest.fn();
      component.chipClick.subscribe(clickSpy);

      fixture.componentRef.setInput('clickable', true);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip') as HTMLButtonElement;
      chip.click();

      expect(clickSpy).not.toHaveBeenCalled();
      expect(chip.disabled).toBe(true);
      expect(chip.getAttribute('aria-disabled')).toBe('true');
    });

    it('renders clickable + removable as two sibling buttons (no nested controls)', () => {
      fixture.componentRef.setInput('clickable', true);
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip') as HTMLElement;
      expect(chip.tagName.toLowerCase()).toBe('span');
      expect(chip.classList).toContain('lc-chip--split');

      const buttons = chip.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].classList).toContain('lc-chip__action');
      expect(buttons[1].classList).toContain('lc-chip__delete');
      expect(buttons[0].parentElement).toBe(chip);
      expect(buttons[1].parentElement).toBe(chip);
      // Neither button contains another interactive element.
      expect(buttons[0].querySelector('button, [role="button"], [tabindex]')).toBeNull();
      expect(chipElement.querySelector('button button')).toBeNull();
    });

    it('should fire only remove (not chipClick) when the delete button is clicked', () => {
      const clickSpy = jest.fn();
      const removeSpy = jest.fn();
      component.chipClick.subscribe(clickSpy);
      component.remove.subscribe(removeSpy);

      fixture.componentRef.setInput('clickable', true);
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      (chipElement.querySelector('.lc-chip__delete') as HTMLElement).click();

      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('should fire only chipClick (not remove) when the action button is clicked', () => {
      const clickSpy = jest.fn();
      const removeSpy = jest.fn();
      component.chipClick.subscribe(clickSpy);
      component.remove.subscribe(removeSpy);

      fixture.componentRef.setInput('clickable', true);
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      (chipElement.querySelector('.lc-chip__action') as HTMLElement).click();

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('disables both buttons and hides the remove button when disabled', () => {
      fixture.componentRef.setInput('clickable', true);
      fixture.componentRef.setInput('removable', true);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const action = chipElement.querySelector('.lc-chip__action') as HTMLButtonElement;
      expect(action.disabled).toBe(true);
      expect(chipElement.querySelector('.lc-chip__delete')).toBeNull();
      expect(chipElement.querySelector('.lc-chip')?.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      expect(component.disabled()).toBe(false);
    });

    it('should apply disabled class when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip--disabled');
      expect(chip).toBeTruthy();
    });

    it('should not emit remove event when disabled', () => {
      const removeSpy = jest.fn();
      component.remove.subscribe(removeSpy);

      fixture.componentRef.setInput('removable', true);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const deleteBtn = chipElement.querySelector('.lc-chip__delete') as HTMLElement;
      deleteBtn?.click();

      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('does not turn the removable wrapper into a button (only the remove button is interactive)', () => {
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip') as HTMLElement;
      expect(chip.tagName.toLowerCase()).toBe('span');
      expect(chip.hasAttribute('role')).toBe(false);
      expect(chip.hasAttribute('tabindex')).toBe(false);

      const deleteBtn = chipElement.querySelector('.lc-chip__delete') as HTMLButtonElement;
      expect(deleteBtn.tagName.toLowerCase()).toBe('button');
      expect(deleteBtn.getAttribute('type')).toBe('button');
      expect(chipElement.querySelectorAll('button, [role="button"]').length).toBe(1);
    });

    it('should have aria-disabled when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip');
      expect(chip?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should have aria-label on delete button', () => {
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const deleteBtn = chipElement.querySelector('.lc-chip__delete');
      expect(deleteBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('does not remove on Enter / Space pressed on the wrapper', () => {
      const removeSpy = jest.fn();
      component.remove.subscribe(removeSpy);

      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const chip = chipElement.querySelector('.lc-chip') as HTMLElement;
      chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      chip.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('marks the leading icon as decorative', () => {
      fixture.componentRef.setInput('icon', 'tag');
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.directive(IconComponent)).componentInstance as IconComponent;
      expect(icon.decorative()).toBe(true);
    });
  });

  describe('CSS Classes Computed', () => {
    it('should combine multiple classes correctly', () => {
      fixture.componentRef.setInput('variant', 'primary');
      fixture.componentRef.setInput('size', 'lg');
      fixture.componentRef.setInput('removable', true);
      fixture.detectChanges();

      const classes = component.chipClasses();
      expect(classes).toContain('lc-chip');
      expect(classes).toContain('lc-chip--primary');
      expect(classes).toContain('lc-chip--lg');
      expect(classes).toContain('lc-chip--removable');
    });

    it('should include disabled class when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const classes = component.chipClasses();
      expect(classes).toContain('lc-chip--disabled');
    });
  });
});
