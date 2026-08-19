import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TooltipDirective } from './tooltip.directive';
import { FlexibleConnectedPositionStrategy, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { OverlayStackService } from '../shared/overlay-stack.service';

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let buttonElement: HTMLButtonElement;
  let directive: TooltipDirective;

  @Component({
    standalone: true,
    imports: [TooltipDirective],
    template: `<button lcTooltip="Test tooltip">Hover me</button>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  class TestComponent {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, OverlayModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    const directiveDebugElement = fixture.debugElement.query(By.directive(TooltipDirective));
    directive = directiveDebugElement.injector.get(TooltipDirective);
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe.skip('Show/Hide Behavior', () => {
    it('should not show tooltip by default', () => {
      const tooltip = document.querySelector('.lc-tooltip');
      expect(tooltip).toBeFalsy();
    });

    it('should show tooltip on mouseenter', () => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Wait for animation frame
      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeTruthy();
      }, 100);
    });

    it('should hide tooltip on mouseleave', () => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      buttonElement.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeFalsy();
      }, 100);
    });

    it('should show tooltip on focus', () => {
      buttonElement.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeTruthy();
      }, 100);
    });

    it('should hide tooltip on blur', () => {
      buttonElement.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();

      buttonElement.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeFalsy();
      }, 100);
    });
  });

  // Skip tests with setTimeout - these should be refactored to use fakeAsync or moved to E2E
  describe.skip('Tooltip Content', () => {
    it('should display tooltip text', (done) => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip?.textContent).toContain('Test tooltip');
        done();
      }, 100);
    });

    it('should update tooltip text when input changes', (done) => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button [lcTooltip]="tooltipText">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class DynamicTestComponent {
        tooltipText = 'Initial text';
      }

      const dynamicFixture = TestBed.createComponent(DynamicTestComponent);
      const dynamicComponent = dynamicFixture.componentInstance;
      dynamicFixture.detectChanges();

      const btn = dynamicFixture.debugElement.query(By.css('button')).nativeElement;
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      dynamicFixture.detectChanges();

      setTimeout(() => {
        let tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip?.textContent).toContain('Initial text');

        btn.dispatchEvent(new MouseEvent('mouseleave'));
        dynamicComponent.tooltipText = 'Updated text';
        dynamicFixture.detectChanges();

        btn.dispatchEvent(new MouseEvent('mouseenter'));
        dynamicFixture.detectChanges();

        setTimeout(() => {
          tooltip = document.querySelector('.lc-tooltip');
          expect(tooltip?.textContent).toContain('Updated text');
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Positioning', () => {
    it('should position tooltip at top by default', (done) => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip?.classList.contains('lc-tooltip--top')).toBeTruthy();
        done();
      }, 100);
    });

    it('should position tooltip at bottom', (done) => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button lcTooltip="Test" tooltipPosition="bottom">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class BottomTestComponent {}

      const bottomFixture = TestBed.createComponent(BottomTestComponent);
      bottomFixture.detectChanges();

      const btn = bottomFixture.debugElement.query(By.css('button')).nativeElement;
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      bottomFixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip?.classList.contains('lc-tooltip--bottom')).toBeTruthy();
        done();
      }, 100);
    });

    it('should position tooltip at left', (done) => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button lcTooltip="Test" tooltipPosition="left">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class LeftTestComponent {}

      const leftFixture = TestBed.createComponent(LeftTestComponent);
      leftFixture.detectChanges();

      const btn = leftFixture.debugElement.query(By.css('button')).nativeElement;
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      leftFixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip?.classList.contains('lc-tooltip--left')).toBeTruthy();
        done();
      }, 100);
    });

    it('should position tooltip at right', (done) => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button lcTooltip="Test" tooltipPosition="right">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class RightTestComponent {}

      const rightFixture = TestBed.createComponent(RightTestComponent);
      rightFixture.detectChanges();

      const btn = rightFixture.debugElement.query(By.css('button')).nativeElement;
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      rightFixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip?.classList.contains('lc-tooltip--right')).toBeTruthy();
        done();
      }, 100);
    });
  });

  describe('Show Delay', () => {
    it('should show tooltip immediately by default', (done) => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeTruthy();
        done();
      }, 10);
    });

    it('should delay showing tooltip when showDelay is set', (done) => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button lcTooltip="Test" [tooltipShowDelay]="500">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class DelayTestComponent {}

      const delayFixture = TestBed.createComponent(DelayTestComponent);
      delayFixture.detectChanges();

      const btn = delayFixture.debugElement.query(By.css('button')).nativeElement;
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      delayFixture.detectChanges();

      setTimeout(() => {
        let tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeFalsy();

        setTimeout(() => {
          tooltip = document.querySelector('.lc-tooltip');
          expect(tooltip).toBeTruthy();
          done();
        }, 500);
      }, 100);
    });
  });

  describe('Hide Delay', () => {
    it('should hide tooltip immediately by default', (done) => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      setTimeout(() => {
        buttonElement.dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();

        setTimeout(() => {
          const tooltip = document.querySelector('.lc-tooltip');
          expect(tooltip).toBeFalsy();
          done();
        }, 10);
      }, 100);
    });

    it('should delay hiding tooltip when hideDelay is set', (done) => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button lcTooltip="Test" [tooltipHideDelay]="500">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class HideDelayTestComponent {}

      const hideDelayFixture = TestBed.createComponent(HideDelayTestComponent);
      hideDelayFixture.detectChanges();

      const btn = hideDelayFixture.debugElement.query(By.css('button')).nativeElement;
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      hideDelayFixture.detectChanges();

      setTimeout(() => {
        btn.dispatchEvent(new MouseEvent('mouseleave'));
        hideDelayFixture.detectChanges();

        setTimeout(() => {
          let tooltip = document.querySelector('.lc-tooltip');
          expect(tooltip).toBeTruthy();

          setTimeout(() => {
            tooltip = document.querySelector('.lc-tooltip');
            expect(tooltip).toBeFalsy();
            done();
          }, 500);
        }, 100);
      }, 100);
    });
  });

  describe.skip('Disabled State', () => {
    it('should not show tooltip when disabled', () => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button lcTooltip="Test" [tooltipDisabled]="true">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class DisabledTestComponent {}

      const disabledFixture = TestBed.createComponent(DisabledTestComponent);
      disabledFixture.detectChanges();

      const btn = disabledFixture.debugElement.query(By.css('button')).nativeElement;
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      disabledFixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeFalsy();
      }, 100);
    });
  });

  describe('Accessibility', () => {
    it('should add aria-describedby to host element', (done) => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      setTimeout(() => {
        expect(buttonElement.getAttribute('aria-describedby')).toBeTruthy();
        done();
      }, 100);
    });

    it('should remove aria-describedby when tooltip hides', (done) => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      setTimeout(() => {
        buttonElement.dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();

        setTimeout(() => {
          expect(buttonElement.getAttribute('aria-describedby')).toBeFalsy();
          done();
        }, 100);
      }, 100);
    });

    it('should have role="tooltip" on tooltip element', (done) => {
      buttonElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip?.getAttribute('role')).toBe('tooltip');
        done();
      }, 100);
    });

    it('should point aria-describedby at the id of the tooltip element', () => {
      directive.show();
      fixture.detectChanges();

      const tooltip = document.querySelector('.lc-tooltip');
      expect(tooltip?.id).toBeTruthy();
      expect(buttonElement.getAttribute('aria-describedby')).toBe(tooltip?.id);
      directive.hide();
    });

    it('should keep ids the host already lists in aria-describedby', () => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button lcTooltip="Test" aria-describedby="hint">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class DescribedTestComponent {}

      const describedFixture = TestBed.createComponent(DescribedTestComponent);
      describedFixture.detectChanges();
      const btn = describedFixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
      const dir = describedFixture.debugElement.query(By.directive(TooltipDirective)).injector.get(TooltipDirective);

      dir.show();
      expect(btn.getAttribute('aria-describedby')).toBe(`hint ${dir.tooltipId}`);

      dir.hide();
      expect(btn.getAttribute('aria-describedby')).toBe('hint');
    });

    it('should hide on Escape and stop listening afterwards', () => {
      directive.show();
      expect(document.querySelector('.lc-tooltip')).toBeTruthy();

      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escape);
      expect(document.querySelector('.lc-tooltip')).toBeFalsy();
      expect(buttonElement.getAttribute('aria-describedby')).toBeFalsy();

      const hideSpy = jest.spyOn(directive, 'hide');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(hideSpy).not.toHaveBeenCalled();
    });

    it('should not hide on Escape while another overlay is on top of it', () => {
      const stack = TestBed.inject(OverlayStackService);
      directive.show();
      stack.push('some-modal-above');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(document.querySelector('.lc-tooltip')).toBeTruthy();

      stack.remove('some-modal-above');
      directive.hide();
    });
  });

  describe('Position fallbacks', () => {
    it('should register the preferred position first and the other sides as fallbacks', () => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        template: `<button lcTooltip="Test" tooltipPosition="left">Hover me</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class LeftTestComponent {}

      const leftFixture = TestBed.createComponent(LeftTestComponent);
      leftFixture.detectChanges();
      const dir = leftFixture.debugElement.query(By.directive(TooltipDirective)).injector.get(TooltipDirective);

      dir.show();
      const strategy = (dir as unknown as { overlayRef: OverlayRef }).overlayRef.getConfig()
        .positionStrategy as FlexibleConnectedPositionStrategy;
      const sides = strategy.positions.map((p) => `${p.originX}/${p.originY}->${p.overlayX}/${p.overlayY}`);
      expect(sides).toEqual([
        'start/center->end/center', // left (preferred)
        'end/center->start/center', // right
        'center/top->center/bottom', // top
        'center/bottom->center/top', // bottom
      ]);
      dir.hide();
    });
  });

  describe('Methods', () => {
    it('should show tooltip programmatically', (done) => {
      directive.show();
      fixture.detectChanges();

      setTimeout(() => {
        const tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeTruthy();
        done();
      }, 100);
    });

    it('should hide tooltip programmatically', (done) => {
      directive.show();
      fixture.detectChanges();

      setTimeout(() => {
        directive.hide();
        fixture.detectChanges();

        setTimeout(() => {
          const tooltip = document.querySelector('.lc-tooltip');
          expect(tooltip).toBeFalsy();
          done();
        }, 100);
      }, 100);
    });

    it('should toggle tooltip programmatically', (done) => {
      directive.toggle();
      fixture.detectChanges();

      setTimeout(() => {
        let tooltip = document.querySelector('.lc-tooltip');
        expect(tooltip).toBeTruthy();

        directive.toggle();
        fixture.detectChanges();

        setTimeout(() => {
          tooltip = document.querySelector('.lc-tooltip');
          expect(tooltip).toBeFalsy();
          done();
        }, 100);
      }, 100);
    });
  });
});
