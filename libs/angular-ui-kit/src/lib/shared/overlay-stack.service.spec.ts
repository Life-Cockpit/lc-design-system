import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { OverlayStackService } from './overlay-stack.service';
import { ModalComponent } from '../modal/modal.component';
import { PopoverComponent } from '../popover/popover.component';
import { DrawerComponent } from '../drawer/drawer.component';
import { MenuComponent } from '../menu/menu.component';

const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

describe('OverlayStackService', () => {
  let stack: OverlayStackService;

  beforeEach(() => {
    stack = new OverlayStackService();
  });

  it('treats the most recently pushed id as top-most', () => {
    stack.push('a');
    stack.push('b');
    expect(stack.isTop('b')).toBe(true);
    expect(stack.isTop('a')).toBe(false);

    stack.remove('b');
    expect(stack.isTop('a')).toBe(true);
  });

  it('moves an id to the top when it is pushed again', () => {
    stack.push('a');
    stack.push('b');
    stack.push('a');
    expect(stack.isTop('a')).toBe(true);
    stack.remove('a');
    expect(stack.isTop('b')).toBe(true);
    expect(stack.isTop('a')).toBe(false);
  });

  it('is empty-safe', () => {
    expect(stack.isTop('a')).toBe(false);
    expect(() => stack.remove('missing')).not.toThrow();
  });

  it('lets only the top-most overlay claim an event, and only once', () => {
    stack.push('lower');
    stack.push('top');
    const event = new Event('keydown');

    expect(stack.claim('lower', event)).toBe(false);
    expect(stack.claim('top', event)).toBe(true);
    stack.remove('top'); // the top closed itself in response …
    expect(stack.isTop('lower')).toBe(true);
    // … but the same event must not now be claimed by the overlay that became top
    expect(stack.claim('lower', event)).toBe(false);
    expect(stack.claim('lower', new Event('keydown'))).toBe(true);
  });
});

describe('Escape with stacked overlays', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('closes only the popover inside a modal, then the modal on the next Escape', () => {
    @Component({
      standalone: true,
      imports: [ModalComponent, PopoverComponent],
      template: `
        <lc-modal [open]="modalOpen()" (openChange)="modalOpen.set($event)">
          <div slot="body">
            <lc-popover (openChange)="popoverOpen.set($event)">
              <button popover-trigger type="button" class="popover-trigger">More</button>
              <div popover-content>Popover content</div>
            </lc-popover>
          </div>
        </lc-modal>
      `,
    })
    class HostComponent {
      readonly modalOpen = signal(true);
      readonly popoverOpen = signal(false);
    }

    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.popover-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.popoverOpen()).toBe(true);

    escape();
    fixture.detectChanges();
    expect(host.popoverOpen()).toBe(false);
    expect(host.modalOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('.lc-modal')).toBeTruthy();

    escape();
    fixture.detectChanges();
    expect(host.modalOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.lc-modal')).toBeNull();
  });

  it('closes only the menu inside a drawer, then the drawer on the next Escape', () => {
    @Component({
      standalone: true,
      imports: [DrawerComponent, MenuComponent],
      template: `
        <lc-drawer [open]="drawerOpen()" heading="Panel" (closed)="drawerOpen.set(false)">
          <lc-menu [items]="items" [isOpen]="menuOpen()" (closed)="menuOpen.set(false)">
            <button trigger type="button" (click)="menuOpen.set(true)">Actions</button>
          </lc-menu>
        </lc-drawer>
      `,
    })
    class HostComponent {
      readonly drawerOpen = signal(true);
      readonly menuOpen = signal(false);
      readonly items = [{ id: 'one', label: 'One' }];
    }

    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    host.menuOpen.set(true);
    fixture.detectChanges();

    escape();
    fixture.detectChanges();
    expect(host.menuOpen()).toBe(false);
    expect(host.drawerOpen()).toBe(true);

    escape();
    fixture.detectChanges();
    expect(host.drawerOpen()).toBe(false);
  });
});
