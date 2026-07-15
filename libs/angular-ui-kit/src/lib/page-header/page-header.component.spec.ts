import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PageHeaderComponent } from './page-header.component';

@Component({
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <lc-page-header title="Reports" subtitle="Compare metrics">
      <span slot="breadcrumbs">Home / Reports</span>
      <button slot="actions">New</button>
      <span slot="meta">12 active</span>
      <p>Description text</p>
    </lc-page-header>
  `,
})
class SlotsHostComponent {}

describe('PageHeaderComponent', () => {
  describe('inputs (direct fixture)', () => {
    let fixture: ComponentFixture<PageHeaderComponent>;
    let rootEl: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [PageHeaderComponent] }).compileComponents();
      fixture = TestBed.createComponent(PageHeaderComponent);
      fixture.componentRef.setInput('title', 'Reports');
      fixture.componentRef.setInput('subtitle', 'Compare metrics');
      fixture.detectChanges();
      rootEl = fixture.nativeElement as HTMLElement;
    });

    it('creates with default classes', () => {
      expect(rootEl.classList).toContain('lc-page-header');
      expect(rootEl.classList).toContain('lc-page-header--size-default');
      expect(rootEl.classList).not.toContain('lc-page-header--divided');
      expect(rootEl.classList).not.toContain('lc-page-header--flush-x');
    });

    it('applies flush-x class when noPaddingX is true', () => {
      fixture.componentRef.setInput('noPaddingX', true);
      fixture.detectChanges();
      expect(rootEl.classList).toContain('lc-page-header--flush-x');
    });

    it('does not render an icon tile by default', () => {
      expect(rootEl.querySelector('.lc-page-header__icon')).toBeNull();
    });

    it('renders a leading icon tile with variant and size modifiers', () => {
      fixture.componentRef.setInput('icon', 'git-branch');
      fixture.componentRef.setInput('iconVariant', 'subtle');
      fixture.componentRef.setInput('iconSize', 'sm');
      fixture.detectChanges();
      const tile = rootEl.querySelector('.lc-page-header__icon');
      expect(tile).toBeTruthy();
      expect(tile?.classList).toContain('lc-page-header__icon--subtle');
      expect(tile?.classList).toContain('lc-page-header__icon--size-sm');
      expect(tile?.querySelector('lc-icon')).toBeTruthy();
    });

    it('renders title at requested level', () => {
      fixture.componentRef.setInput('level', 2);
      fixture.detectChanges();
      expect(rootEl.querySelector('h2.lc-page-header__title')?.textContent).toContain('Reports');

      fixture.componentRef.setInput('level', 3);
      fixture.detectChanges();
      expect(rootEl.querySelector('h3.lc-page-header__title')?.textContent).toContain('Reports');
    });

    it('renders subtitle when provided', () => {
      expect(rootEl.querySelector('.lc-page-header__subtitle')?.textContent).toContain(
        'Compare metrics',
      );
    });

    it('renders badge inside title when provided', () => {
      fixture.componentRef.setInput('badge', 'Beta');
      fixture.detectChanges();
      expect(rootEl.querySelector('.lc-page-header__badge')?.textContent).toContain('Beta');
    });

    it('omits title block when title is empty', () => {
      fixture.componentRef.setInput('title', undefined);
      fixture.detectChanges();
      expect(rootEl.querySelector('.lc-page-header__title')).toBeNull();
    });

    it('applies divider class when showDivider is true', () => {
      fixture.componentRef.setInput('showDivider', true);
      fixture.detectChanges();
      expect(rootEl.classList).toContain('lc-page-header--divided');
    });

    it('applies size variant', () => {
      fixture.componentRef.setInput('size', 'compact');
      fixture.detectChanges();
      expect(rootEl.classList).toContain('lc-page-header--size-compact');
    });
  });

  describe('content projection (host wrapper)', () => {
    let fixture: ComponentFixture<SlotsHostComponent>;
    let rootEl: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SlotsHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(SlotsHostComponent);
      fixture.detectChanges();
      rootEl = fixture.nativeElement.querySelector('lc-page-header') as HTMLElement;
    });

    it('projects breadcrumbs / actions / meta / default slots', () => {
      expect(rootEl.querySelector('.lc-page-header__breadcrumbs')?.textContent).toContain(
        'Home / Reports',
      );
      expect(rootEl.querySelector('.lc-page-header__actions')?.textContent).toContain('New');
      expect(rootEl.querySelector('.lc-page-header__meta')?.textContent).toContain('12 active');
      expect(rootEl.querySelector('.lc-page-header__body')?.textContent).toContain('Description');
    });

    // The actions only centre on the title's line box while they share a row
    // with the title and the subtitle stays out of that row. jsdom can't verify
    // the resulting geometry, so pin the structure the CSS depends on instead.
    it('puts the title and the actions in a shared title row', () => {
      const titleRow = rootEl.querySelector('.lc-page-header__title-row');
      expect(titleRow).toBeTruthy();
      expect(titleRow?.querySelector('.lc-page-header__title')).toBeTruthy();
      expect(titleRow?.querySelector('.lc-page-header__actions')).toBeTruthy();
    });

    it('keeps the subtitle out of the title row so it cannot drag the actions down', () => {
      const titleRow = rootEl.querySelector('.lc-page-header__title-row');
      expect(titleRow?.querySelector('.lc-page-header__subtitle')).toBeNull();

      // …but still inside __titles, so it stays indented past an optional icon.
      const subtitle = rootEl.querySelector('.lc-page-header__subtitle');
      expect(subtitle?.parentElement?.classList).toContain('lc-page-header__titles');
    });
  });
});
