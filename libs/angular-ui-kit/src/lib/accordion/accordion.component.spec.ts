import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, OnInit, signal } from '@angular/core';
import { AccordionComponent } from './accordion.component';
import { AccordionHeaderDirective } from './accordion-header.directive';
import { AccordionContentDirective } from './accordion-content.directive';

/** Probe whose ngOnInit we spy on to prove lazy instantiation. */
@Component({
  selector: 'lc-test-probe',
  standalone: true,
  template: '<span class="probe">probe</span>',
})
class ProbeComponent implements OnInit {
  static initCount = 0;
  ngOnInit(): void {
    ProbeComponent.initCount++;
  }
}

describe('AccordionComponent', () => {
  function header(fixture: ComponentFixture<unknown>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.lc-accordion__header');
  }

  describe('plain title (backward compatible)', () => {
    @Component({
      standalone: true,
      imports: [AccordionComponent],
      template: `
        <lc-accordion [title]="title" [(expanded)]="open">
          <p class="body-text">Body content</p>
        </lc-accordion>
      `,
    })
    class Host {
      title = 'Section Title';
      open = false;
    }

    let fixture: ComponentFixture<Host>;

    beforeEach(() => {
      fixture = TestBed.createComponent(Host);
      fixture.autoDetectChanges();
    });

    it('renders the title string in the header', () => {
      expect(header(fixture).textContent).toContain('Section Title');
    });

    it('projects <ng-content> body eagerly', () => {
      expect(fixture.nativeElement.querySelector('.body-text')).toBeTruthy();
    });

    it('toggles expanded on click and syncs two-way binding', () => {
      header(fixture).click();
      TestBed.flushEffects();
      expect(fixture.componentInstance.open).toBe(true);
    });

    it('exposes aria-expanded and aria-controls wiring', () => {
      const btn = header(fixture);
      const panel = fixture.nativeElement.querySelector('.lc-accordion__panel');
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(btn.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(btn.id);
    });
  });

  describe('rich header (lcAccordionHeader)', () => {
    @Component({
      standalone: true,
      imports: [AccordionComponent, AccordionHeaderDirective],
      template: `
        <lc-accordion title="fallback-label">
          <ng-template lcAccordionHeader>
            <span class="rich-title">Rich Header</span>
            <span class="rich-time" style="margin-left: auto;">12:04</span>
          </ng-template>
        </lc-accordion>
      `,
    })
    class Host {}

    let fixture: ComponentFixture<Host>;

    beforeEach(() => {
      fixture = TestBed.createComponent(Host);
      fixture.autoDetectChanges();
    });

    it('renders projected header content instead of the title', () => {
      expect(fixture.nativeElement.querySelector('.rich-title')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.rich-time')).toBeTruthy();
      // The plain title span is not rendered when a header template is present.
      expect(fixture.nativeElement.querySelector('.lc-accordion__title')).toBeNull();
    });

    it('keeps the title as the accessible label fallback', () => {
      expect(header(fixture).getAttribute('aria-label')).toBe('fallback-label');
    });
  });

  describe('chevron position', () => {
    @Component({
      standalone: true,
      imports: [AccordionComponent],
      template: `<lc-accordion title="x" [chevronPosition]="pos"></lc-accordion>`,
    })
    class Host {
      pos: 'leading' | 'trailing' = 'trailing';
    }

    it('defaults to trailing', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.autoDetectChanges();
      expect(
        fixture.nativeElement.querySelector('.lc-accordion--chevron-trailing')
      ).toBeTruthy();
    });

    it('applies the leading modifier when requested', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.pos = 'leading';
      fixture.autoDetectChanges();
      expect(
        fixture.nativeElement.querySelector('.lc-accordion--chevron-leading')
      ).toBeTruthy();
    });
  });

  describe('lazy body (lcAccordionContent + [lazy])', () => {
    @Component({
      standalone: true,
      imports: [AccordionComponent, AccordionContentDirective, ProbeComponent],
      template: `
        <lc-accordion title="x" [lazy]="true">
          <ng-template lcAccordionContent>
            <lc-test-probe />
          </ng-template>
        </lc-accordion>
      `,
    })
    class Host {}

    let fixture: ComponentFixture<Host>;

    beforeEach(() => {
      ProbeComponent.initCount = 0;
      fixture = TestBed.createComponent(Host);
      fixture.autoDetectChanges();
    });

    it('does not instantiate the body before the first open', () => {
      expect(fixture.nativeElement.querySelector('.probe')).toBeNull();
      expect(ProbeComponent.initCount).toBe(0);
    });

    it('instantiates the body on first open and keeps it on close', () => {
      header(fixture).click();
      TestBed.flushEffects();

      expect(fixture.nativeElement.querySelector('.probe')).toBeTruthy();
      expect(ProbeComponent.initCount).toBe(1);

      // Collapse — body stays in the DOM, not re-created.
      header(fixture).click();
      TestBed.flushEffects();

      expect(fixture.nativeElement.querySelector('.probe')).toBeTruthy();
      expect(ProbeComponent.initCount).toBe(1);
    });
  });

  describe('destroyOnClose body', () => {
    @Component({
      standalone: true,
      imports: [AccordionComponent, AccordionContentDirective, ProbeComponent],
      template: `
        <lc-accordion title="x" [destroyOnClose]="true">
          <ng-template lcAccordionContent>
            <lc-test-probe />
          </ng-template>
        </lc-accordion>
      `,
    })
    class Host {}

    let fixture: ComponentFixture<Host>;

    beforeEach(() => {
      ProbeComponent.initCount = 0;
      fixture = TestBed.createComponent(Host);
      fixture.autoDetectChanges();
    });

    it('discards the body on collapse and recreates it on reopen', () => {
      expect(fixture.nativeElement.querySelector('.probe')).toBeNull();

      header(fixture).click();
      TestBed.flushEffects();
      expect(fixture.nativeElement.querySelector('.probe')).toBeTruthy();
      expect(ProbeComponent.initCount).toBe(1);

      header(fixture).click();
      TestBed.flushEffects();
      expect(fixture.nativeElement.querySelector('.probe')).toBeNull();

      header(fixture).click();
      TestBed.flushEffects();
      expect(fixture.nativeElement.querySelector('.probe')).toBeTruthy();
      expect(ProbeComponent.initCount).toBe(2);
    });
  });

  describe('expandedChange + keyboard', () => {
    @Component({
      standalone: true,
      imports: [AccordionComponent],
      template: `
        <lc-accordion title="x" (expandedChange)="events.push($event)"></lc-accordion>
      `,
    })
    class Host {
      events: boolean[] = [];
    }

    it('emits on mouse toggle', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.autoDetectChanges();
      header(fixture).click();
      TestBed.flushEffects();
      expect(fixture.componentInstance.events).toEqual([true]);
    });

    it('emits on keyboard toggle (Enter and Space)', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.autoDetectChanges();

      header(fixture).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
      TestBed.flushEffects();
      header(fixture).dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      );
      TestBed.flushEffects();

      expect(fixture.componentInstance.events).toEqual([true, false]);
    });
  });

  describe('lazy over a dynamic @for list', () => {
    @Component({
      standalone: true,
      imports: [AccordionComponent, AccordionContentDirective, ProbeComponent],
      template: `
        @for (id of ids(); track id) {
          <lc-accordion [title]="id" [lazy]="true">
            <ng-template lcAccordionContent><lc-test-probe /></ng-template>
          </lc-accordion>
        }
      `,
    })
    class Host {
      ids = signal(['a', 'b']);
    }

    it('keeps bodies lazy per-row', () => {
      ProbeComponent.initCount = 0;
      const fixture = TestBed.createComponent(Host);
      fixture.autoDetectChanges();

      expect(ProbeComponent.initCount).toBe(0);

      const first = fixture.nativeElement.querySelector('.lc-accordion__header');
      first.click();
      TestBed.flushEffects();

      // Only the opened row's body is instantiated.
      expect(ProbeComponent.initCount).toBe(1);
    });
  });
});
