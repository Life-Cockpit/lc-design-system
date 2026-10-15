import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { compile } from 'sass';
import { join } from 'path';
import {
  NextStepCardActionSize,
  NextStepCardActionsLayout,
  NextStepCardComponent,
  NextStepCardTitleTag,
  NextStepCardTone,
  NextStepCardVariant,
} from './next-step-card.component';

@Component({
  standalone: true,
  imports: [NextStepCardComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-next-step-card
      [tone]="tone"
      [variant]="variant"
      [titleTag]="titleTag"
      [actionsLayout]="actionsLayout"
      [actionSize]="actionSize"
      [linkTarget]="linkTarget"
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
      @if (withBody) {
        <label slot="body" class="projected-body">Name <input /></label>
      }
    </lc-next-step-card>
  `,
})
class TestHostComponent {
  tone: NextStepCardTone = 'neutral';
  variant: NextStepCardVariant = 'default';
  titleTag: NextStepCardTitleTag = 'div';
  actionsLayout: NextStepCardActionsLayout = 'inline';
  actionSize: NextStepCardActionSize = 'sm';
  linkTarget: '_blank' | '_self' = '_blank';
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
  withBody = false;
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
      providers: [provideHttpClient(withXhr())],
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

  describe('3.3: soft variant, narrow layout, title tag, action size (TD-1, TD-2, LK-4, G-12)', () => {
    const actions = (): HTMLElement =>
      fixture.nativeElement.querySelector('.lc-next-step-card__actions');

    it('keeps the 3.2 look by default: no soft or stacked modifier', () => {
      fixture.detectChanges();
      expect(card().classList).not.toContain('lc-next-step-card--soft');
      expect(card().classList).not.toContain('lc-next-step-card--actions-stacked');
    });

    it('applies the soft variant together with the tone', () => {
      host.variant = 'soft';
      host.tone = 'primary';
      fixture.detectChanges();
      expect(card().classList).toContain('lc-next-step-card--soft');
      expect(card().classList).toContain('lc-next-step-card--primary');
    });

    it('applies the stacked actions layout as a modifier', () => {
      host.actionsLayout = 'stacked';
      host.withActions = true;
      fixture.detectChanges();
      expect(card().classList).toContain('lc-next-step-card--actions-stacked');
    });

    it.each<[NextStepCardTitleTag, string]>([
      ['div', 'DIV'],
      ['h2', 'H2'],
      ['h3', 'H3'],
    ])('renders the title as %s and keeps the live region on it', (tag, nodeName) => {
      host.titleTag = tag;
      host.announce = true;
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.lc-next-step-card__title') as HTMLElement;
      expect(title.nodeName).toBe(nodeName);
      expect(title.textContent?.trim()).toBe('Titelzeile');
      expect(title.getAttribute('aria-live')).toBe('polite');
      // The region keeps its name whatever the tag.
      expect(card().getAttribute('aria-label')).toBe('Titelzeile');
    });

    it('projects [slot=body] outside the message box, so fields keep their own text styles', () => {
      host.withBody = true;
      fixture.detectChanges();
      const body = fixture.nativeElement.querySelector('.lc-next-step-card__content');
      expect(body.querySelector('.projected-body input')).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('.lc-next-step-card__custom-message .projected-body'),
      ).toBeNull();
    });

    it.each<NextStepCardActionSize>(['sm', 'md', 'lg'])(
      'renders the built-in actions in size %s',
      (size) => {
        host.actionSize = size;
        host.primaryLabel = 'Bestätigen';
        host.secondaryLabel = 'Später';
        fixture.detectChanges();
        const buttons = fixture.nativeElement.querySelectorAll('.lc-next-step-card__actions .btn');
        expect(buttons.length).toBe(2);
        buttons.forEach((b: HTMLElement) => expect(b.classList).toContain(`btn-${size}`));
      },
    );

    it('sizes the external link with actionSize and opens it in the same tab on request', () => {
      host.linkLabel = 'Verweis';
      host.linkHref = '/intern';
      host.actionSize = 'lg';
      host.linkTarget = '_self';
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a.lc-next-step-card__link');
      expect(link.classList).toContain('btn-lg');
      expect(link.getAttribute('target')).toBe('_self');
      expect(link.getAttribute('rel')).toBeNull();
    });

    it('hides the actions box when there is no action, and shows it for projected ones', () => {
      fixture.detectChanges();
      expect(actions().classList).toContain('lc-next-step-card__actions--empty');

      host.withActions = true;
      fixture.changeDetectorRef.detectChanges();
      fixture.detectChanges();
      expect(actions().classList).not.toContain('lc-next-step-card__actions--empty');
    });

    it('shows the actions box for a built-in action', () => {
      host.primaryLabel = 'Los';
      fixture.detectChanges();
      expect(actions().classList).not.toContain('lc-next-step-card__actions--empty');
    });
  });

  // jsdom applies no stylesheets and knows no container queries, so the layout
  // contract is read from the compiled CSS.
  describe('3.3: layout contract in the stylesheet', () => {
    const css = compile(join(__dirname, 'next-step-card.component.scss')).css;
    const block = (start: string): string => {
      const at = css.indexOf(start);
      expect(at).toBeGreaterThan(-1);
      // Up to the next top-level at-rule (or the end).
      const next = css.indexOf('\n@', at + 1);
      return css.slice(at, next === -1 ? undefined : next);
    };

    it('makes the host a size container that takes the full inline size', () => {
      expect(css).toMatch(/:host\s*{[^}]*inline-size:\s*100%[^}]*container:\s*lc-next-step-card\s*\/\s*inline-size/);
    });

    it('switches to the narrow layout below 480 px of card width (TD-1)', () => {
      const narrow = block('@container lc-next-step-card (width < 30rem)');
      // (a) icon beside the title, the rest full width
      expect(narrow).toMatch(/grid-template-columns:\s*auto minmax\(0, 1fr\)/);
      expect(narrow).toMatch(/\.lc-next-step-card__body\s*{\s*display:\s*contents/);
      expect(narrow).toMatch(/\.lc-next-step-card__actions\s*{[^}]*grid-column:\s*1\s*\/\s*-1/);
      // (b) the actions stretch, an lc-button's inner button fills its host
      expect(narrow).toMatch(/\.lc-next-step-card__actions > \*[^{]*{[^}]*flex:\s*1 1 auto/);
      expect(narrow).toMatch(/lc-button > \.btn[^{]*{[^}]*width:\s*100%/);
      // (c) inline padding drops to padding-md
      expect(narrow).toMatch(/padding:\s*var\(--lc-density-padding-md/);
    });

    it('gives a projected fullWidth action its own row at every width', () => {
      expect(css).toMatch(/\.lc-next-step-card__actions:has\(\.btn-full-width\)\s*{[^}]*flex:\s*1 1 100%/);
    });

    it('stacks actions one per line in the stacked layout, 8 px apart', () => {
      expect(css).toMatch(
        /\.lc-next-step-card--actions-stacked \.lc-next-step-card__actions\s*{[^}]*flex-direction:\s*column[^}]*gap:\s*0\.5rem/,
      );
    });

    it('draws the soft card without rail, border or shadow, on the Weite tokens', () => {
      const soft = css.slice(css.indexOf('.lc-next-step-card--soft {'));
      expect(soft).toMatch(/border:\s*0/);
      expect(soft).toMatch(/box-shadow:\s*none/);
      expect(soft).toMatch(/border-radius:\s*1\.5rem/);
      expect(css).toMatch(/--lc-nsc-fill:\s*var\(--color-next-step-soft-neutral/);
      expect(css).toMatch(/--lc-nsc-fill:\s*var\(--color-next-step-soft-primary/);
      expect(css).toMatch(/--lc-nsc-bubble:\s*var\(--color-bubble,/);
      expect(css).toMatch(/--lc-nsc-ring:\s*var\(--color-bubble-ring,/);
      expect(css).toMatch(/--lc-nsc-ink:\s*var\(--color-bubble-icon,/);
    });

    it('uses radius 28 and the desktop geometry only for wide soft cards on desktop viewports', () => {
      const wide = block('@container lc-next-step-card (width >= 30rem)');
      expect(wide).toMatch(/@media \(min-width: 64rem\)[\s\S]*border-radius:\s*1\.75rem/);
      expect(wide).toMatch(/@media \(min-width: 90rem\)[\s\S]*padding:\s*2\.25rem 2\.5rem/);
    });
  });
});

