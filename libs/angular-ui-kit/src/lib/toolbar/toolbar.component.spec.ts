import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ToolbarComponent } from './toolbar.component';

@Component({
  standalone: true,
  imports: [ToolbarComponent],
  template: `
    <lc-toolbar>
      <span slot="start">Title</span>
      <button slot="end">Action</button>
    </lc-toolbar>
  `,
})
class SlotsHostComponent {}

@Component({
  standalone: true,
  imports: [ToolbarComponent],
  template: `
    <lc-toolbar aria-label="Table filters">
      <button slot="start" id="b1">One</button>
      <button slot="start" id="b2" [disabled]="secondDisabled()">Two</button>
      <input id="search" type="search" aria-label="Search" />
      <a slot="end" id="link" href="#">Link</a>
      <button slot="end" id="b3">Three</button>
    </lc-toolbar>
    <button id="outside">Outside</button>
  `,
})
class KeyboardHostComponent {
  readonly secondDisabled = signal(false);
}

describe('ToolbarComponent', () => {
  describe('inputs (direct fixture)', () => {
    let fixture: ComponentFixture<ToolbarComponent>;
    let toolbarEl: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [ToolbarComponent] }).compileComponents();
      fixture = TestBed.createComponent(ToolbarComponent);
      fixture.detectChanges();
      toolbarEl = fixture.nativeElement as HTMLElement;
    });

    it('creates the toolbar with default classes', () => {
      expect(toolbarEl.classList).toContain('lc-toolbar');
      expect(toolbarEl.classList).toContain('lc-toolbar--density-cosy');
      expect(toolbarEl.classList).toContain('lc-toolbar--bg-transparent');
      expect(toolbarEl.classList).toContain('lc-toolbar--border-none');
      expect(toolbarEl.classList).toContain('lc-toolbar--align-center');
      expect(toolbarEl.classList).toContain('lc-toolbar--wrap');
      expect(toolbarEl.getAttribute('role')).toBe('toolbar');
    });

    it('reflects density / background / border inputs', () => {
      fixture.componentRef.setInput('density', 'compact');
      fixture.componentRef.setInput('background', 'surface');
      fixture.componentRef.setInput('border', 'bottom');
      fixture.detectChanges();

      expect(toolbarEl.classList).toContain('lc-toolbar--density-compact');
      expect(toolbarEl.classList).toContain('lc-toolbar--bg-surface');
      expect(toolbarEl.classList).toContain('lc-toolbar--border-bottom');
    });

    it('toggles wrap and sticky', () => {
      fixture.componentRef.setInput('wrap', false);
      fixture.componentRef.setInput('sticky', true);
      fixture.detectChanges();

      expect(toolbarEl.classList).not.toContain('lc-toolbar--wrap');
      expect(toolbarEl.classList).toContain('lc-toolbar--sticky');
    });
  });

  describe('content projection (host wrapper)', () => {
    let fixture: ComponentFixture<SlotsHostComponent>;
    let toolbarEl: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SlotsHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(SlotsHostComponent);
      fixture.detectChanges();
      toolbarEl = fixture.nativeElement.querySelector('lc-toolbar') as HTMLElement;
    });

    it('projects start and end slots', () => {
      const start = toolbarEl.querySelector('.lc-toolbar__start');
      const end = toolbarEl.querySelector('.lc-toolbar__end');
      expect(start?.textContent).toContain('Title');
      expect(end?.textContent).toContain('Action');
    });
  });

  describe('keyboard navigation (role="toolbar")', () => {
    let fixture: ComponentFixture<KeyboardHostComponent>;
    const el = (id: string) => document.getElementById(id) as HTMLElement;
    const press = (target: HTMLElement, key: string) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [KeyboardHostComponent] }).compileComponents();
      fixture = TestBed.createComponent(KeyboardHostComponent);
      fixture.detectChanges();
    });

    it('moves focus to the next control on ArrowRight', () => {
      el('b1').focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      el('b1').dispatchEvent(event);
      expect(document.activeElement).toBe(el('b2'));
      expect(event.defaultPrevented).toBe(true);
    });

    it('moves focus to the previous control on ArrowLeft', () => {
      el('b3').focus();
      press(el('b3'), 'ArrowLeft');
      expect(document.activeElement).toBe(el('link'));
    });

    it('jumps to the first / last control on Home / End', () => {
      el('link').focus();
      press(el('link'), 'Home');
      expect(document.activeElement).toBe(el('b1'));
      press(el('b1'), 'End');
      expect(document.activeElement).toBe(el('b3'));
    });

    it('does not wrap past the ends', () => {
      el('b3').focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      el('b3').dispatchEvent(event);
      expect(document.activeElement).toBe(el('b3'));
      expect(event.defaultPrevented).toBe(false);
    });

    it('skips disabled controls', () => {
      fixture.componentInstance.secondDisabled.set(true);
      fixture.detectChanges();
      el('b1').focus();
      press(el('b1'), 'ArrowRight');
      expect(document.activeElement).toBe(el('search'));
    });

    it('leaves arrow keys alone inside a text field', () => {
      el('search').focus();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      el('search').dispatchEvent(event);
      expect(document.activeElement).toBe(el('search'));
      expect(event.defaultPrevented).toBe(false);
    });

    it('ignores keys from outside the toolbar', () => {
      el('outside').focus();
      press(el('outside'), 'ArrowLeft');
      expect(document.activeElement).toBe(el('outside'));
    });

    it('keeps every control reachable via Tab (no roving tabindex)', () => {
      const controls = ['b1', 'b2', 'search', 'link', 'b3'].map(el);
      controls.forEach((c) => expect(c.tabIndex).toBe(0));
    });
  });
});
