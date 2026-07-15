import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import {
  PageLayoutComponent,
  PageLayoutContentWidth,
  PageLayoutFill,
} from './page-layout.component';

@Component({
  standalone: true,
  imports: [PageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-page-layout
      [fill]="fill"
      [scrollBody]="scrollBody"
      [padded]="padded"
      [contentWidth]="contentWidth"
    >
      <header layout-header>Header</header>
      <p>Body content</p>
      <footer layout-footer>Footer</footer>
    </lc-page-layout>
  `,
})
class TestHostComponent {
  fill: PageLayoutFill = 'screen';
  scrollBody = true;
  padded = false;
  contentWidth: PageLayoutContentWidth = 'capped';
}

describe('PageLayoutComponent', () => {
  let component: PageLayoutComponent;
  let fixture: ComponentFixture<PageLayoutComponent>;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageLayoutComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Host classes', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostEl = hostFixture.debugElement.query(By.css('lc-page-layout')).nativeElement;
    });

    it('should always carry the base class', () => {
      hostFixture.detectChanges();
      expect(hostEl.classList).toContain('lc-page-layout');
    });

    it('should fill the screen by default', () => {
      hostFixture.detectChanges();
      expect(hostEl.classList).toContain('fill-screen');
    });

    it('should switch to parent fill', () => {
      hostFixture.componentInstance.fill = 'parent';
      hostFixture.detectChanges();
      expect(hostEl.classList).toContain('fill-parent');
      expect(hostEl.classList).not.toContain('fill-screen');
    });

    it('should mark the body as scrollable by default', () => {
      hostFixture.detectChanges();
      expect(hostEl.classList).toContain('scroll-body');
    });

    it('should drop scroll-body when disabled', () => {
      hostFixture.componentInstance.scrollBody = false;
      hostFixture.detectChanges();
      expect(hostEl.classList).not.toContain('scroll-body');
    });

    it('should not be padded by default', () => {
      hostFixture.detectChanges();
      expect(hostEl.classList).not.toContain('padded');
    });

    // The cap itself is CSS (max-width + auto inline margins on each region),
    // which jsdom can't measure — pin the class the stylesheet keys off instead.
    it('should cap the content width by default', () => {
      hostFixture.detectChanges();
      expect(hostEl.classList).toContain('content-capped');
    });

    it('should drop the cap for full-bleed layouts', () => {
      hostFixture.componentInstance.contentWidth = 'full';
      hostFixture.detectChanges();
      expect(hostEl.classList).not.toContain('content-capped');
    });

    it('should add the padded class when requested', () => {
      hostFixture.componentInstance.padded = true;
      hostFixture.detectChanges();
      expect(hostEl.classList).toContain('padded');
    });
  });

  describe('Content projection', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();
    });

    it('should project header content into the header slot', () => {
      const header = hostFixture.debugElement.query(By.css('.lc-page-layout__header header'));
      expect(header).toBeTruthy();
      expect(header.nativeElement.textContent).toContain('Header');
    });

    it('should project default content into the body slot', () => {
      const body = hostFixture.debugElement.query(By.css('.lc-page-layout__body p'));
      expect(body).toBeTruthy();
      expect(body.nativeElement.textContent).toContain('Body content');
    });

    it('should project footer content into the footer slot', () => {
      const footer = hostFixture.debugElement.query(By.css('.lc-page-layout__footer footer'));
      expect(footer).toBeTruthy();
      expect(footer.nativeElement.textContent).toContain('Footer');
    });
  });
});
