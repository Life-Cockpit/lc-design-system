import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  ChoicePromptComponent,
  ChoicePromptDecision,
  ChoicePromptOption,
  ChoicePromptSecondaryAction,
} from './choice-prompt.component';

@Component({
  standalone: true,
  imports: [ChoicePromptComponent],
  template: `
    <lc-choice-prompt
      [options]="options"
      [allowCustom]="allowCustom"
      [busy]="busy"
      [disabled]="disabled"
      [disabledReason]="disabledReason"
      [secondaryActions]="secondaryActions"
      [size]="size"
      promptLabel="Wie soll es weitergehen?"
      (decided)="decisions.push($event)"
      (secondaryAction)="secondaryIds.push($event)"
    />
  `,
})
class TestHostComponent {
  options: ChoicePromptOption[] = [
    { id: 'a', label: 'Erste Option' },
    { id: 'b', label: 'Zweite Option', recommended: true },
    { id: 'c', label: 'Dritte Option' },
  ];
  allowCustom = true;
  busy = false;
  disabled = false;
  disabledReason = '';
  secondaryActions: ChoicePromptSecondaryAction[] = [];
  size: 'sm' | 'md' = 'md';
  decisions: ChoicePromptDecision[] = [];
  secondaryIds: string[] = [];
}

describe('ChoicePromptComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const optionButtons = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.lc-choice-prompt__option'));
  const toggle = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('.lc-choice-prompt__custom-toggle');
  const customInput = (): HTMLInputElement | null =>
    fixture.nativeElement.querySelector('.lc-choice-prompt__input');
  const submitButton = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('.lc-choice-prompt__custom button.btn');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('renders a labelled group', () => {
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('.lc-choice-prompt');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Wie soll es weitergehen?');
  });

  it('sorts the recommended option first and gives it the badge', () => {
    fixture.detectChanges();
    const buttons = optionButtons();
    expect(buttons[0].dataset['optionId']).toBe('b');
    expect(buttons[0].querySelector('.lc-choice-prompt__badge')?.textContent?.trim()).toBe(
      'Empfehlung',
    );
    expect(buttons[1].querySelector('.lc-choice-prompt__badge')).toBeNull();
  });

  it('emits decided with the optionId on click', () => {
    fixture.detectChanges();
    optionButtons()[1].click();
    expect(host.decisions).toEqual([{ optionId: 'a' }]);
  });

  it('busy: clicked option shows the spinner, all others are disabled', () => {
    fixture.detectChanges();
    optionButtons()[0].click(); // recommended = id 'b'
    host.busy = true;
    fixture.changeDetectorRef.detectChanges();

    const buttons = optionButtons();
    expect(buttons[0].querySelector('.lc-choice-prompt__spinner')).toBeTruthy();
    expect(buttons[0].disabled).toBe(false); // keeps focusability
    expect(buttons[0].getAttribute('aria-disabled')).toBe('true');
    expect(buttons[1].disabled).toBe(true);
    expect(buttons[2].disabled).toBe(true);
    expect(toggle()?.disabled).toBe(true);
  });

  it('busy blocks every further interaction including a second click', () => {
    fixture.detectChanges();
    optionButtons()[0].click();
    host.busy = true;
    fixture.changeDetectorRef.detectChanges();

    optionButtons()[0].click();
    expect(host.decisions.length).toBe(1);
  });

  it('busy blocks Enter in the free-text input', () => {
    fixture.detectChanges();
    toggle()?.click();
    fixture.detectChanges();

    const input = customInput()!;
    input.value = 'Eigener Text';
    input.dispatchEvent(new Event('input'));
    host.busy = true;
    fixture.changeDetectorRef.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.decisions.length).toBe(0);
  });

  it('free text: never submittable while empty, submits trimmed text via Enter', () => {
    fixture.detectChanges();
    toggle()?.click();
    fixture.detectChanges();

    const input = customInput()!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.decisions.length).toBe(0);
    expect(submitButton()?.disabled).toBe(true);

    input.value = '  Eigene Antwort  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(submitButton()?.disabled).toBe(false);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.decisions).toEqual([{ customText: 'Eigene Antwort' }]);
  });

  it('restores focus to the clicked option when busy ends', () => {
    fixture.detectChanges();
    const first = optionButtons()[0];
    first.focus();
    first.click();
    host.busy = true;
    fixture.changeDetectorRef.detectChanges();
    host.busy = false;
    fixture.changeDetectorRef.detectChanges();

    expect(document.activeElement).toBe(optionButtons()[0]);
  });

  it('disabled: everything is blocked and the reason appears as tooltip', () => {
    host.disabled = true;
    host.disabledReason = 'Bereits entschieden';
    fixture.detectChanges();

    for (const button of optionButtons()) {
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('title')).toBe('Bereits entschieden');
    }
    optionButtons()[0].click();
    expect(host.decisions.length).toBe(0);
  });

  it('warns in dev mode when disabled has no disabledReason', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    host.disabled = true;
    fixture.detectChanges();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('disabledReason'));
    warnSpy.mockRestore();
  });

  it('renders secondary actions and emits their id', () => {
    host.secondaryActions = [
      { id: 'solved', label: 'Selbst gelöst', tooltip: 'Ohne Auswahl schließen' },
      { id: 'ignore', label: 'Ignorieren' },
    ];
    fixture.detectChanges();

    const secondaries = Array.from(
      fixture.nativeElement.querySelectorAll('.lc-choice-prompt__secondary'),
    ) as HTMLButtonElement[];
    expect(secondaries.map((b) => b.textContent?.trim())).toEqual(['Selbst gelöst', 'Ignorieren']);
    expect(secondaries[0].getAttribute('title')).toBe('Ohne Auswahl schließen');
    secondaries[1].click();
    expect(host.secondaryIds).toEqual(['ignore']);
  });

  it('hides the free-text lane when allowCustom is false', () => {
    host.allowCustom = false;
    fixture.detectChanges();
    expect(toggle()).toBeNull();
  });

  it('applies the size modifier', () => {
    host.size = 'sm';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-choice-prompt').classList).toContain(
      'lc-choice-prompt--sm',
    );
  });
});
