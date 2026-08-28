import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { NextStepCardComponent, NextStepCardTone } from './next-step-card.component';

@Component({
  standalone: true,
  imports: [NextStepCardComponent],
  template: `
    <lc-next-step-card
      [tone]="tone"
      [icon]="icon"
      [cardTitle]="cardTitle"
      [message]="message"
      [primaryLabel]="primaryLabel"
      [primaryLoading]="primaryLoading"
      [primaryDisabled]="primaryDisabled"
      [primaryDisabledReason]="primaryDisabledReason"
      [secondaryLabel]="secondaryLabel"
      [linkLabel]="linkLabel"
      [linkHref]="linkHref"
      [announce]="announce"
      (primaryClick)="primaryClicks = primaryClicks + 1"
      (secondaryClick)="secondaryClicks = secondaryClicks + 1"
    >
      <!-- One @if per row: a control-flow block only forwards its projection
           slot when it has a single root element. -->
      @if (withBlockers) {
        <span slot="blockers">Erster Blocker</span>
      }
      @if (withBlockers) {
        <span slot="blockers">Zweiter Blocker</span>
      }
      @if (withMeta) {
        <span slot="meta">Eine Meta-Zeile</span>
      }
      @if (withActions) {
        <button slot="actions" class="projected-action" type="button">Eigene Aktion</button>
      }
    </lc-next-step-card>
  `,
})
class TestHostComponent {
  tone: NextStepCardTone = 'neutral';
  icon = 'information-circle';
  cardTitle = 'Titelzeile';
  message: string | undefined = undefined;
  primaryLabel: string | undefined = undefined;
  primaryLoading = false;
  primaryDisabled = false;
  primaryDisabledReason = '';
  secondaryLabel: string | undefined = undefined;
  linkLabel: string | undefined = undefined;
  linkHref: string | undefined = undefined;
  announce = false;
  withBlockers = false;
  withMeta = false;
  withActions = false;
  primaryClicks = 0;
  secondaryClicks = 0;
}

describe('NextStepCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const card = (): HTMLElement => fixture.nativeElement.querySelector('.lc-next-step-card');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('renders as a labelled region with the neutral tone by default', () => {
    fixture.detectChanges();
    expect(card().getAttribute('role')).toBe('region');
    expect(card().getAttribute('aria-label')).toBe('Titelzeile');
    expect(card().classList).toContain('lc-next-step-card--neutral');
  });

  it('applies every tone as a modifier class', () => {
    const tones: NextStepCardTone[] = ['neutral', 'primary', 'success', 'warning', 'info'];
    for (const tone of tones) {
      host.tone = tone;
      fixture.changeDetectorRef.detectChanges();
      expect(card().classList).toContain(`lc-next-step-card--${tone}`);
    }
  });

  it('renders message text when given', () => {
    host.message = 'Eine Botschaft.';
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.lc-next-step-card__message').textContent.trim(),
    ).toBe('Eine Botschaft.');
  });

  it('emits primaryClick and secondaryClick from the built-in buttons', () => {
    host.primaryLabel = 'Bestätigen';
    host.secondaryLabel = 'Zurückstellen';
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.lc-next-step-card__actions button');
    expect(buttons.length).toBe(2);
    (buttons[0] as HTMLButtonElement).click(); // secondary renders first
    (buttons[1] as HTMLButtonElement).click();
    expect(host.secondaryClicks).toBe(1);
    expect(host.primaryClicks).toBe(1);
  });

  it('does not emit primaryClick while disabled', () => {
    host.primaryLabel = 'Bestätigen';
    host.primaryDisabled = true;
    host.primaryDisabledReason = 'Noch nicht bereit';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector(
      '.lc-next-step-card__actions button',
    ) as HTMLButtonElement;
    btn.click();
    expect(host.primaryClicks).toBe(0);
    expect(btn.getAttribute('title')).toBe('Noch nicht bereit');
  });

  it('warns in dev mode when primaryDisabled has no primaryDisabledReason', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    host.primaryLabel = 'Bestätigen';
    host.primaryDisabled = true;
    fixture.detectChanges();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('primaryDisabledReason'));
    warnSpy.mockRestore();
  });

  it('does not warn when the disabled primary carries a reason', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    host.primaryLabel = 'Bestätigen';
    host.primaryDisabled = true;
    host.primaryDisabledReason = 'Begründung';
    fixture.detectChanges();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('renders an external link instead of the primary button', () => {
    host.primaryLabel = 'Bestätigen';
    host.linkLabel = 'Verweis öffnen';
    host.linkHref = 'https://example.com/';
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a.lc-next-step-card__link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('https://example.com/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.textContent).toContain('Verweis öffnen');
    // Kein Primärbutton mehr:
    expect(fixture.nativeElement.querySelector('.lc-next-step-card__actions lc-button')).toBeNull();
  });

  it('projects blockers and meta rows', () => {
    host.withBlockers = true;
    host.withMeta = true;
    fixture.detectChanges();

    const blockers = fixture.nativeElement.querySelector('.lc-next-step-card__blockers');
    expect(blockers.textContent).toContain('Erster Blocker');
    expect(blockers.textContent).toContain('Zweiter Blocker');
    // Each projected element is its own row (gets its own dot prefix).
    expect(blockers.childElementCount).toBe(2);
    const meta = fixture.nativeElement.querySelector('.lc-next-step-card__meta');
    expect(meta.textContent).toContain('Eine Meta-Zeile');
  });

  it('replaces built-in buttons entirely with projected [slot=actions] content', () => {
    host.primaryLabel = 'Bestätigen';
    host.secondaryLabel = 'Zurückstellen';
    host.withActions = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.projected-action')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-next-step-card__actions lc-button')).toBeNull();
  });

  it('sets aria-live on the title only when announce is enabled', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.lc-next-step-card__title');
    expect(title.getAttribute('aria-live')).toBeNull();

    host.announce = true;
    fixture.changeDetectorRef.detectChanges();
    expect(title.getAttribute('aria-live')).toBe('polite');
  });
});
