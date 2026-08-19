import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { StepperComponent, StepperStep } from './stepper.component';

@Component({
  standalone: true,
  imports: [StepperComponent],
  template: `
    <lc-stepper
      [steps]="steps()"
      [(activeStep)]="activeStep"
      [linear]="linear()"
      [optionalLabel]="optionalLabel()"
      (stepChange)="changes.push($event)"
    >
      <p>Body</p>
    </lc-stepper>
  `,
})
class TestHostComponent {
  readonly steps = signal<StepperStep[]>([
    { label: 'Step 1', description: 'First step' },
    { label: 'Step 2', description: 'Second step' },
    { label: 'Step 3', description: 'Third step', optional: true },
    { label: 'Step 4' },
  ]);
  readonly activeStep = signal(1);
  readonly linear = signal(true);
  readonly optionalLabel = signal('Optional');
  readonly changes: number[] = [];
}

describe('StepperComponent', () => {
  let component: StepperComponent;
  let fixture: ComponentFixture<StepperComponent>;

  const mockSteps: StepperStep[] = [
    { label: 'Step 1', description: 'First step' },
    { label: 'Step 2', description: 'Second step' },
    { label: 'Step 3', description: 'Third step', optional: true },
    { label: 'Step 4' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('steps', mockSteps);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 4 total steps', () => {
    expect(component.totalSteps()).toBe(4);
  });

  it('should start at step 0', () => {
    expect(component.activeStep()).toBe(0);
  });

  it('should report first step correctly', () => {
    expect(component.isFirstStep()).toBe(true);
    expect(component.isLastStep()).toBe(false);
  });

  it('should navigate to next step', () => {
    component.next();
    expect(component.activeStep()).toBe(1);
    expect(component.isFirstStep()).toBe(false);
  });

  it('should navigate to previous step', () => {
    component.next();
    component.next();
    component.previous();
    expect(component.activeStep()).toBe(1);
  });

  it('should not go below step 0', () => {
    component.previous();
    expect(component.activeStep()).toBe(0);
  });

  it('should not exceed last step', () => {
    component.next();
    component.next();
    component.next();
    component.next(); // try to go past
    expect(component.activeStep()).toBe(3);
    expect(component.isLastStep()).toBe(true);
  });

  it('should return correct step state', () => {
    component.next();
    expect(component.getStepState(0)).toBe('completed');
    expect(component.getStepState(1)).toBe('active');
    expect(component.getStepState(2)).toBe('pending');
  });

  it('should allow going back in linear mode', () => {
    component.next();
    component.next();
    component.goToStep(0);
    expect(component.activeStep()).toBe(0);
  });

  it('should not allow jumping ahead in linear mode', () => {
    component.goToStep(3);
    expect(component.activeStep()).toBe(0);
  });

  it('should allow jumping ahead in non-linear mode', () => {
    fixture.componentRef.setInput('linear', false);
    fixture.detectChanges();
    component.goToStep(3);
    expect(component.activeStep()).toBe(3);
  });

  it('should emit stepChange on navigation', () => {
    const emitted: number[] = [];
    component.stepChange.subscribe((step) => emitted.push(step));
    component.next();
    component.next();
    component.previous();
    expect(emitted).toEqual([1, 2, 1]);
  });

  it('should not emit stepChange when the active step is re-selected', () => {
    const emitted: number[] = [];
    component.stepChange.subscribe((step) => emitted.push(step));
    component.goToStep(0);
    expect(emitted).toEqual([]);
  });

  describe('Markup & accessibility', () => {
    const stepButtons = () =>
      fixture.debugElement.queryAll(By.css('ol.lc-stepper__header > li > button'));

    it('should render the steps as buttons inside an ordered list', () => {
      const items = fixture.debugElement.queryAll(By.css('ol.lc-stepper__header > li'));
      expect(items.length).toBe(4);
      const buttons = stepButtons();
      expect(buttons.length).toBe(4);
      buttons.forEach((b) => expect(b.nativeElement.getAttribute('type')).toBe('button'));
      // no click-only <div> steps left
      expect(fixture.debugElement.queryAll(By.css('div.lc-stepper__step')).length).toBe(0);
    });

    it('should keep the visual state classes on the step buttons', () => {
      component.next();
      fixture.detectChanges();
      const buttons = stepButtons();
      expect(buttons[0]?.nativeElement.classList).toContain('lc-stepper__step--completed');
      expect(buttons[0]?.nativeElement.classList).toContain('lc-stepper__step--clickable');
      expect(buttons[1]?.nativeElement.classList).toContain('lc-stepper__step--active');
      expect(buttons[2]?.nativeElement.classList).toContain('lc-stepper__step--pending');
    });

    it('should mark the active step with aria-current="step"', () => {
      component.next();
      fixture.detectChanges();
      const buttons = stepButtons();
      expect(buttons[1]?.nativeElement.getAttribute('aria-current')).toBe('step');
      expect(buttons[0]?.nativeElement.hasAttribute('aria-current')).toBe(false);
      expect(buttons[2]?.nativeElement.hasAttribute('aria-current')).toBe(false);
    });

    it('should disable pending steps in linear mode and enable them otherwise', () => {
      component.next();
      fixture.detectChanges();
      let buttons = stepButtons();
      expect(buttons[0]?.nativeElement.disabled).toBe(false); // completed
      expect(buttons[1]?.nativeElement.disabled).toBe(false); // active
      expect(buttons[2]?.nativeElement.disabled).toBe(true); // pending
      expect(buttons[3]?.nativeElement.disabled).toBe(true);

      fixture.componentRef.setInput('linear', false);
      fixture.detectChanges();
      buttons = stepButtons();
      buttons.forEach((b) => expect(b.nativeElement.disabled).toBe(false));
    });

    it('should give every step an accessible name with its position', () => {
      const buttons = stepButtons();
      expect(buttons[0]?.nativeElement.getAttribute('aria-label')).toBe('Step 1 of 4: Step 1');
      expect(buttons[2]?.nativeElement.getAttribute('aria-label')).toBe(
        'Step 3 of 4: Step 3, Optional',
      );
    });

    it('should link the description via aria-describedby', () => {
      const buttons = stepButtons();
      const describedBy = buttons[0]?.nativeElement.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const desc = fixture.nativeElement.querySelector(`#${describedBy}`);
      expect(desc?.textContent?.trim()).toBe('First step');
      // step 4 has no description
      expect(buttons[3]?.nativeElement.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should navigate when a completed step button is clicked', () => {
      component.next();
      component.next();
      fixture.detectChanges();
      const buttons = stepButtons();
      (buttons[0]?.nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(component.activeStep()).toBe(0);
    });

    it('should render steps with duplicate labels', () => {
      fixture.componentRef.setInput('steps', [
        { label: 'Same' },
        { label: 'Same' },
        { label: 'Same' },
      ]);
      fixture.detectChanges();
      expect(stepButtons().length).toBe(3);
    });

    it('should hide the connectors from assistive tech', () => {
      const connectors = fixture.debugElement.queryAll(By.css('.lc-stepper__connector'));
      expect(connectors.length).toBe(3);
      connectors.forEach((c) => expect(c.nativeElement.getAttribute('aria-hidden')).toBe('true'));
    });
  });
});

describe('StepperComponent (host)', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render the optional label from the input', () => {
    expect(fixture.nativeElement.querySelector('.lc-stepper__optional')?.textContent?.trim()).toBe(
      'Optional',
    );

    fixture.componentInstance.optionalLabel.set('Optionaler Schritt');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-stepper__optional')?.textContent?.trim()).toBe(
      'Optionaler Schritt',
    );
    const buttons = fixture.debugElement.queryAll(By.css('button.lc-stepper__step'));
    expect(buttons[2]?.nativeElement.getAttribute('aria-label')).toContain('Optionaler Schritt');
  });

  it('should update the two-way binding and emit stepChange on click', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button.lc-stepper__step'));
    (buttons[0]?.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeStep()).toBe(0);
    expect(fixture.componentInstance.changes).toEqual([0]);
  });

  it('should reflect an outside change of activeStep', () => {
    fixture.componentInstance.activeStep.set(3);
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button.lc-stepper__step'));
    expect(buttons[3]?.nativeElement.getAttribute('aria-current')).toBe('step');
    expect(buttons[0]?.nativeElement.classList).toContain('lc-stepper__step--completed');
  });

  it('should project content', () => {
    expect(fixture.nativeElement.querySelector('.lc-stepper__content p')?.textContent).toBe('Body');
  });
});
