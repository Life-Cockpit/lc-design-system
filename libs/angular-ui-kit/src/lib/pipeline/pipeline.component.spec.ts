import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PipelineComponent,
  PipelineStep,
  PipelineOrientation,
} from './pipeline.component';

@Component({
  standalone: true,
  imports: [PipelineComponent],
  template: `
    <lc-pipeline
      [steps]="steps()"
      [orientation]="orientation()"
      [clickable]="clickable()"
      (stepClick)="onStepClick($event)"
    />
  `,
})
class TestHost {
  readonly steps = signal<PipelineStep[]>([
    { label: 'Connect', caption: 'Token valid', status: 'complete', id: 'connect' },
    { label: 'Checkout', status: 'complete' },
    { label: 'Analyze', caption: 'Running', status: 'current' },
    { label: 'Graph', caption: 'Out of date', status: 'warning' },
    { label: 'Publish', status: 'pending' },
  ]);
  readonly orientation = signal<PipelineOrientation>('horizontal');
  readonly clickable = signal(false);

  readonly onStepClick = jest.fn<(step: PipelineStep) => void>();
}

describe('PipelineComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let hostElement: HTMLElement;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    hostElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders one node per step with labels in order', () => {
    const labels = Array.from(hostElement.querySelectorAll('.lc-pipeline__label')).map((el) =>
      el.textContent?.trim(),
    );
    expect(labels).toEqual(['Connect', 'Checkout', 'Analyze', 'Graph', 'Publish']);
  });

  it('applies a status modifier class per step', () => {
    const steps = hostElement.querySelectorAll('.lc-pipeline__step');
    expect(steps[0].classList).toContain('lc-pipeline__step--complete');
    expect(steps[2].classList).toContain('lc-pipeline__step--current');
    expect(steps[3].classList).toContain('lc-pipeline__step--warning');
    expect(steps[4].classList).toContain('lc-pipeline__step--pending');
  });

  it('marks the last step so its connector can be hidden', () => {
    const steps = hostElement.querySelectorAll('.lc-pipeline__step');
    expect(steps[steps.length - 1].classList).toContain('lc-pipeline__step--last');
    expect(steps[0].classList).not.toContain('lc-pipeline__step--last');
  });

  it('only renders captions when provided', () => {
    const captions = Array.from(hostElement.querySelectorAll('.lc-pipeline__caption')).map((el) =>
      el.textContent?.trim(),
    );
    expect(captions).toEqual(['Token valid', 'Running', 'Out of date']);
  });

  it('does not render interactive buttons when not clickable', () => {
    expect(hostElement.querySelectorAll('.lc-pipeline__hit').length).toBe(0);
  });

  it('emits stepClick with the node payload when clickable', () => {
    host.clickable.set(true);
    fixture.detectChanges();

    const firstButton = hostElement.querySelector<HTMLButtonElement>('.lc-pipeline__hit');
    firstButton?.click();

    expect(host.onStepClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'connect', label: 'Connect' }),
    );
  });

  it('switches to the vertical layout modifier', () => {
    host.orientation.set('vertical');
    fixture.detectChanges();
    expect(hostElement.querySelector('.lc-pipeline')?.classList).toContain('lc-pipeline--vertical');
  });
});
