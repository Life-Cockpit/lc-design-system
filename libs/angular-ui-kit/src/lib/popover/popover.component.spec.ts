import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PopoverComponent, PopoverPosition, PopoverTrigger } from './popover.component';
import { OverlayStackService } from '../shared/overlay-stack.service';

@Component({
  standalone: true,
  imports: [PopoverComponent],
  template: `
    <lc-popover [position]="position" [trigger]="trigger" [showArrow]="showArrow" (openChange)="onOpenChange($event)">
      <button popover-trigger>Click me</button>
      <div popover-content class="test-content">
        <p>Popover body</p>
        <button type="button" class="inside">Inside</button>
      </div>
    </lc-popover>
    <button type="button" class="outside">Outside</button>
  `,
})
class TestHostComponent {
  position: PopoverPosition = 'bottom';
  trigger: PopoverTrigger = 'click';
  showArrow = true;
  lastOpen: boolean | null = null;

  onOpenChange(open: boolean): void {
    this.lastOpen = open;
  }
}

describe('PopoverComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(PopoverComponent))).toBeTruthy();
  });

  it('should not show panel by default', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeNull();
  });

  it('should open on trigger click', () => {
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.popover__trigger'));
    trigger.nativeElement.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeTruthy();
    expect(host.lastOpen).toBe(true);
  });

  it('should close on second click', () => {
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.popover__trigger'));
    trigger.nativeElement.click();
    fixture.detectChanges();
    trigger.nativeElement.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeNull();
    expect(host.lastOpen).toBe(false);
  });

  it('should apply position class', () => {
    host.position = 'top';
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.popover__trigger'));
    trigger.nativeElement.click();
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.css('.popover__panel'));
    expect(panel.nativeElement.classList).toContain('popover__panel--top');
  });

  it('should show arrow by default', () => {
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.popover__trigger'));
    trigger.nativeElement.click();
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.css('.popover__panel'));
    expect(panel.nativeElement.classList).toContain('popover__panel--arrow');
  });

  it('should hide arrow when showArrow is false', () => {
    host.showArrow = false;
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.popover__trigger'));
    trigger.nativeElement.click();
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.css('.popover__panel'));
    expect(panel.nativeElement.classList).not.toContain('popover__panel--arrow');
  });

  it('should close on Escape key', () => {
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.popover__trigger'));
    trigger.nativeElement.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeNull();
  });

  it('should render projected content', () => {
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.popover__trigger'));
    trigger.nativeElement.click();
    fixture.detectChanges();
    const content = fixture.debugElement.query(By.css('.test-content'));
    expect(content).toBeTruthy();
    expect(content.nativeElement.textContent).toContain('Popover body');
  });

  it('should have role dialog', () => {
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.popover__trigger'));
    trigger.nativeElement.click();
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.css('[role="dialog"]'));
    expect(panel).toBeTruthy();
  });

  it('should close on click outside but not on a click inside the panel', () => {
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.popover__trigger')).nativeElement.click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.inside') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeTruthy();

    (fixture.nativeElement.querySelector('.outside') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeNull();
    expect(host.lastOpen).toBe(false);
  });

  describe('ARIA on the projected trigger', () => {
    it('should mark the trigger as controlling a dialog and mirror the open state', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('[popover-trigger]') as HTMLButtonElement;
      expect(button.getAttribute('aria-haspopup')).toBe('dialog');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.hasAttribute('aria-controls')).toBe(false);

      button.click();
      fixture.detectChanges();
      const panel = fixture.nativeElement.querySelector('.popover__panel') as HTMLElement;
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(panel.id).toBeTruthy();
      expect(button.getAttribute('aria-controls')).toBe(panel.id);

      button.click();
      fixture.detectChanges();
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.hasAttribute('aria-controls')).toBe(false);
    });
  });

  describe('overlay stacking', () => {
    it('should stop the Escape from propagating when it handles it', () => {
      fixture.detectChanges();
      fixture.debugElement.query(By.css('.popover__trigger')).nativeElement.click();
      fixture.detectChanges();
      const reachedWindow = jest.fn();
      window.addEventListener('keydown', reachedWindow);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeNull();
      expect(reachedWindow).not.toHaveBeenCalled();
      window.removeEventListener('keydown', reachedWindow);
    });

    it('should leave Escape and outside clicks to an overlay on top of it', () => {
      const stack = TestBed.inject(OverlayStackService);
      fixture.detectChanges();
      fixture.debugElement.query(By.css('.popover__trigger')).nativeElement.click();
      fixture.detectChanges();
      stack.push('modal-opened-from-the-popover');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      (fixture.nativeElement.querySelector('.outside') as HTMLElement).click();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeTruthy();
      stack.remove('modal-opened-from-the-popover');
    });

    it('should unregister itself when destroyed while open', () => {
      const stack = TestBed.inject(OverlayStackService);
      fixture.detectChanges();
      fixture.debugElement.query(By.css('.popover__trigger')).nativeElement.click();
      fixture.detectChanges();

      fixture.destroy();

      stack.push('probe');
      expect(stack.isTop('probe')).toBe(true);
      stack.remove('probe');
    });
  });

  describe('focus', () => {
    it('should return focus to the trigger when closed via Escape while focus is inside the panel', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('[popover-trigger]') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.inside') as HTMLElement).focus();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(document.activeElement).toBe(button);
    });

    it('should not steal focus when closed by a click elsewhere', () => {
      fixture.detectChanges();
      fixture.debugElement.query(By.css('.popover__trigger')).nativeElement.click();
      fixture.detectChanges();
      const outside = fixture.nativeElement.querySelector('.outside') as HTMLButtonElement;
      outside.focus();
      outside.click();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeNull();
      expect(document.activeElement).toBe(outside);
    });
  });

  describe('hover trigger', () => {
    beforeEach(() => {
      host.trigger = 'hover';
    });

    it('should open on mouseenter', () => {
      fixture.detectChanges();
      const popover = fixture.debugElement.query(By.css('.popover'));
      popover.nativeElement.dispatchEvent(new Event('mouseenter'));
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeTruthy();
    });

    it('should close on mouseleave', () => {
      fixture.detectChanges();
      const popover = fixture.debugElement.query(By.css('.popover'));
      popover.nativeElement.dispatchEvent(new Event('mouseenter'));
      fixture.detectChanges();
      popover.nativeElement.dispatchEvent(new Event('mouseleave'));
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.popover__panel'))).toBeNull();
    });
  });
});
