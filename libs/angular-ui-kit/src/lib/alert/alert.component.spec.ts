import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AlertComponent } from './alert.component';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

const MOCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;
  let alertElement: HTMLElement;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    alertElement = fixture.nativeElement;
  });

  afterEach(() => {
    const pendingRequests = httpMock.match(() => true);
    pendingRequests.forEach((req) => {
      if (!req.cancelled) {
        req.flush(MOCK_SVG);
      }
    });
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Variants', () => {
    it('should render info variant by default', () => {
      expect(alertElement.classList).toContain('lc-alert--info');
    });

    it('should render success variant', () => {
      fixture.componentRef.setInput('variant', 'success');
      fixture.detectChanges();
      expect(alertElement.classList).toContain('lc-alert--success');
    });

    it('should render error variant', () => {
      fixture.componentRef.setInput('variant', 'error');
      fixture.detectChanges();
      expect(alertElement.classList).toContain('lc-alert--error');
    });

    it('should render warning variant', () => {
      fixture.componentRef.setInput('variant', 'warning');
      fixture.detectChanges();
      expect(alertElement.classList).toContain('lc-alert--warning');
    });
  });

  describe('Icons', () => {
    it('should render default icon based on variant (info)', () => {
      const icon = fixture.debugElement.query(By.css('.lc-alert__icon'));
      expect(icon).toBeTruthy();
    });

    it('should render default icon based on variant (success)', () => {
      fixture.componentRef.setInput('variant', 'success');
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.lc-alert__icon'));
      expect(icon).toBeTruthy();
    });

    it('should render default icon based on variant (error)', () => {
      fixture.componentRef.setInput('variant', 'error');
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.lc-alert__icon'));
      expect(icon).toBeTruthy();
    });

    it('should render default icon based on variant (warning)', () => {
      fixture.componentRef.setInput('variant', 'warning');
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.lc-alert__icon'));
      expect(icon).toBeTruthy();
    });

    it('should allow custom icon', () => {
      fixture.componentRef.setInput('icon', 'heart');
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('lc-icon'));
      expect(icon).toBeTruthy();
    });

    it('should hide icon when showIcon is false', () => {
      fixture.componentRef.setInput('showIcon', false);
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.lc-alert__icon'));
      expect(icon).toBeFalsy();
    });
  });

  describe('Dismissible', () => {
    it('should not show close button by default', () => {
      const closeBtn = fixture.debugElement.query(By.css('.lc-alert__close'));
      expect(closeBtn).toBeFalsy();
    });

    it('should show close button when dismissible is true', () => {
      fixture.componentRef.setInput('dismissible', true);
      fixture.detectChanges();
      const closeBtn = fixture.debugElement.query(By.css('.lc-alert__close'));
      expect(closeBtn).toBeTruthy();
    });

    it('should emit dismissed event when close button clicked', () => {
      fixture.componentRef.setInput('dismissible', true);
      fixture.detectChanges();

      let dismissed = false;
      component.dismissed.subscribe(() => (dismissed = true));

      const closeBtn = fixture.debugElement.query(By.css('.lc-alert__close'));
      closeBtn.nativeElement.click();

      expect(dismissed).toBe(true);
    });

    it('should hide alert when dismissed', () => {
      fixture.componentRef.setInput('dismissible', true);
      fixture.detectChanges();

      const closeBtn = fixture.debugElement.query(By.css('.lc-alert__close'));
      closeBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component.visible()).toBe(false);
    });
  });

  describe('Title', () => {
    it('should not render title by default', () => {
      const title = fixture.debugElement.query(By.css('.lc-alert__title'));
      expect(title).toBeFalsy();
    });

    it('should render title when provided', () => {
      fixture.componentRef.setInput('title', 'Important Alert');
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('.lc-alert__title'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent).toContain('Important Alert');
    });
  });

  describe('Content', () => {
    it('should render content from input', () => {
      fixture.componentRef.setInput('message', 'This is an alert message');
      fixture.detectChanges();
      const content = fixture.debugElement.query(By.css('.lc-alert__content'));
      expect(content).toBeTruthy();
      expect(content.nativeElement.textContent).toContain('This is an alert message');
    });

    it('should render projected content', () => {
      @Component({
        standalone: true,
        imports: [AlertComponent],
        template: `<lc-alert>Projected content</lc-alert>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {}

      const testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();
      const content = testFixture.debugElement.query(By.css('.lc-alert__content'));
      expect(content.nativeElement.textContent).toContain('Projected content');
    });
  });

  describe('Action Slot', () => {
    it('should project slot="action" content into the action area', () => {
      @Component({
        standalone: true,
        imports: [AlertComponent],
        template: `<lc-alert variant="error" message="Loading failed">
          <button slot="action" type="button">Retry</button>
        </lc-alert>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {}

      const testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();
      const action = testFixture.debugElement.query(By.css('.lc-alert__action button'));
      expect(action).toBeTruthy();
      expect(action.nativeElement.textContent.trim()).toBe('Retry');
    });

    it('should leave the action area empty when nothing is projected', () => {
      @Component({
        standalone: true,
        imports: [AlertComponent],
        template: `<lc-alert message="No action here" />`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class TestComponent {}

      const testFixture = TestBed.createComponent(TestComponent);
      testFixture.detectChanges();
      const action = testFixture.debugElement.query(By.css('.lc-alert__action'));
      expect(action.nativeElement.childNodes.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for info / success and role="alert" for error / warning', () => {
      expect(alertElement.getAttribute('role')).toBe('status');
      fixture.componentRef.setInput('variant', 'success');
      fixture.detectChanges();
      expect(alertElement.getAttribute('role')).toBe('status');
      fixture.componentRef.setInput('variant', 'warning');
      fixture.detectChanges();
      expect(alertElement.getAttribute('role')).toBe('alert');
      fixture.componentRef.setInput('variant', 'error');
      fixture.detectChanges();
      expect(alertElement.getAttribute('role')).toBe('alert');
    });

    it('can be shown again via the visible model after being dismissed', () => {
      component.dismiss();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.lc-alert__container')).toBeNull();

      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();
      expect(component.visible()).toBe(true);
      expect(fixture.nativeElement.querySelector('.lc-alert__container')).toBeTruthy();
    });

    it('labels the variant icon and hides the close icon from AT', () => {
      fixture.componentRef.setInput('variant', 'error');
      fixture.componentRef.setInput('dismissible', true);
      fixture.detectChanges();
      const icons = fixture.debugElement.queryAll(By.css('lc-icon')).map(d => d.componentInstance);
      expect(icons[0].ariaLabel()).toBe('Error');
      expect(icons[1].decorative()).toBe(true);
    });

    it('should have aria-live="polite" for info/success', () => {
      expect(alertElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-live="assertive" for error/warning', () => {
      fixture.componentRef.setInput('variant', 'error');
      fixture.detectChanges();
      expect(alertElement.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have aria-label when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'Custom alert label');
      fixture.detectChanges();
      expect(alertElement.getAttribute('aria-label')).toBe('Custom alert label');
    });

    it('should close button have aria-label', () => {
      fixture.componentRef.setInput('dismissible', true);
      fixture.detectChanges();
      const closeBtn = fixture.debugElement.query(By.css('.lc-alert__close'));
      expect(closeBtn.nativeElement.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Methods', () => {
    it('should dismiss alert programmatically', () => {
      component.dismiss();
      fixture.detectChanges();
      expect(component.visible()).toBe(false);
    });

    it('should emit dismissed event when dismissed programmatically', () => {
      let dismissed = false;
      component.dismissed.subscribe(() => (dismissed = true));
      component.dismiss();
      expect(dismissed).toBe(true);
    });
  });
});
