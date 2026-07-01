import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { AccordionGroupComponent } from './accordion-group.component';
import { AccordionComponent } from './accordion.component';

@Component({
  standalone: true,
  imports: [AccordionGroupComponent, AccordionComponent],
  template: `
    <lc-accordion-group [multi]="multi">
      <lc-accordion title="One"></lc-accordion>
      <lc-accordion title="Two"></lc-accordion>
      <lc-accordion title="Three"></lc-accordion>
    </lc-accordion-group>
  `,
})
class TestHostComponent {
  multi = false;
}

describe('AccordionGroupComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let group: AccordionGroupComponent;

  function clickAccordion(index: number): void {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-accordion__header'
    ) as NodeListOf<HTMLButtonElement>;
    buttons[index].click();
    TestBed.flushEffects();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.autoDetectChanges();
    group = fixture.debugElement.children[0].componentInstance as AccordionGroupComponent;
  });

  it('should create', () => {
    expect(group).toBeTruthy();
  });

  it('should have all accordion children', () => {
    expect(group.accordions().length).toBe(3);
  });

  describe('single-expand mode (multi=false)', () => {
    it('should allow one accordion to be expanded', () => {
      clickAccordion(0);

      const accordions = group.accordions();
      expect(accordions[0].expanded()).toBe(true);
      expect(accordions[1].expanded()).toBe(false);
      expect(accordions[2].expanded()).toBe(false);
    });

    it('should close others when a new one is expanded', () => {
      clickAccordion(0);
      clickAccordion(1);

      const accordions = group.accordions();
      expect(accordions[0].expanded()).toBe(false);
      expect(accordions[1].expanded()).toBe(true);
    });

    it('should allow toggling closed', () => {
      clickAccordion(0);
      clickAccordion(0);

      const accordions = group.accordions();
      expect(accordions[0].expanded()).toBe(false);
    });
  });

  describe('multi-expand mode (multi=true)', () => {
    beforeEach(() => {
      host.multi = true;
    });

    it('should allow multiple accordions to be expanded', () => {
      clickAccordion(0);
      clickAccordion(1);

      const accordions = group.accordions();
      expect(accordions[0].expanded()).toBe(true);
      expect(accordions[1].expanded()).toBe(true);
    });
  });

  describe('programmatic API', () => {
    it('collapseAll should close all accordions', () => {
      host.multi = true;
      clickAccordion(0);
      clickAccordion(1);

      group.collapseAll();
      TestBed.flushEffects();

      const accordions = group.accordions();
      expect(accordions.every((a) => !a.expanded())).toBe(true);
    });

    it('expandAll should open all non-disabled accordions', () => {
      host.multi = true;

      group.expandAll();

      const accordions = group.accordions();
      expect(accordions.every((a) => a.expanded())).toBe(true);
    });
  });
});

@Component({
  standalone: true,
  imports: [AccordionGroupComponent, AccordionComponent],
  template: `
    <lc-accordion-group [multi]="false">
      @for (item of items(); track item) {
        <lc-accordion [title]="item"></lc-accordion>
      }
    </lc-accordion-group>
  `,
})
class DynamicHostComponent {
  items = signal(['One', 'Two', 'Three']);
}

describe('AccordionGroupComponent — dynamic @for children', () => {
  let fixture: ComponentFixture<DynamicHostComponent>;
  let host: DynamicHostComponent;
  let group: AccordionGroupComponent;

  function headers(): NodeListOf<HTMLButtonElement> {
    return fixture.nativeElement.querySelectorAll('.lc-accordion__header');
  }

  function click(index: number): void {
    headers()[index].click();
    TestBed.flushEffects();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicHostComponent);
    host = fixture.componentInstance;
    fixture.autoDetectChanges();
    group = fixture.debugElement.children[0]
      .componentInstance as AccordionGroupComponent;
  });

  it('tracks children projected through @for', () => {
    expect(group.accordions().length).toBe(3);
  });

  it('keeps single-open when opening across the dynamic list', () => {
    click(0);
    click(2);

    const accordions = group.accordions();
    expect(accordions[0].expanded()).toBe(false);
    expect(accordions[2].expanded()).toBe(true);
  });

  it('keeps single-open after the list changes (items added)', () => {
    click(1);
    expect(group.accordions()[1].expanded()).toBe(true);

    host.items.set(['One', 'Two', 'Three', 'Four', 'Five']);
    fixture.autoDetectChanges();
    TestBed.flushEffects();

    // Newly added row opens; the previously open one must close.
    click(4);

    const accordions = group.accordions();
    expect(accordions.length).toBe(5);
    expect(accordions[4].expanded()).toBe(true);
    expect(accordions.filter((a) => a.expanded()).length).toBe(1);
  });
});
