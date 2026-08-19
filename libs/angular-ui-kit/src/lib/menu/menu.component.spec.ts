import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MenuComponent, MenuItem } from './menu.component';

@Component({
  standalone: true,
  imports: [MenuComponent],
  template: `
    <lc-menu [items]="items()" [isOpen]="isOpen()" (itemClick)="clicked.push($event)" (closed)="onClosed()">
      <button trigger type="button" class="trigger" (click)="isOpen.set(!isOpen())">Open</button>
      <div header class="header">Header</div>
    </lc-menu>
    <button type="button" class="outside">Outside</button>
  `,
})
class TestHostComponent {
  readonly items = signal<MenuItem[]>([
    { id: 'first', label: 'First item', icon: 'user' },
    { id: 'second', label: 'Second item', disabled: true },
    { id: 'link', label: 'Link item', href: '#link' },
    { id: 'last', label: 'Last item', variant: 'danger' },
  ]);
  readonly isOpen = signal(false);
  readonly clicked: MenuItem[] = [];
  closedCount = 0;

  onClosed(): void {
    this.closedCount++;
    this.isOpen.set(false);
  }
}

describe('MenuComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let el: HTMLElement;

  const trigger = () => el.querySelector<HTMLButtonElement>('.trigger')!;
  const panel = () => el.querySelector<HTMLElement>('[role="menu"]');
  const menuItems = () => Array.from(el.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  const keydown = (target: Element, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };
  const open = () => {
    host.isOpen.set(true);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.focus();
  });

  describe('open / close', () => {
    it('renders nothing but the trigger while closed', () => {
      expect(panel()).toBeNull();
      expect(trigger()).toBeTruthy();
    });

    it('renders the items when open', () => {
      open();
      expect(panel()).toBeTruthy();
      expect(menuItems().length).toBe(4);
      expect(el.querySelector('.header')).toBeTruthy();
    });

    it('emits itemClick for enabled button items and not for disabled ones', () => {
      open();
      menuItems()[0].click();
      expect(host.clicked.map((i) => i.id)).toEqual(['first']);

      menuItems()[1].click();
      expect(host.clicked.length).toBe(1);
    });

    it('closes on click outside', () => {
      open();
      el.querySelector<HTMLButtonElement>('.outside')!.click();
      fixture.detectChanges();
      expect(host.closedCount).toBe(1);
      expect(panel()).toBeNull();
    });

    it('does not close on a click inside the panel', () => {
      open();
      menuItems()[0].click();
      fixture.detectChanges();
      expect(host.closedCount).toBe(0);
      expect(panel()).toBeTruthy();
    });
  });

  describe('ARIA', () => {
    it('marks the trigger as a menu button and mirrors the open state', () => {
      expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(trigger().hasAttribute('aria-controls')).toBe(false);

      open();
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(trigger().getAttribute('aria-controls')).toBe(panel()!.id);
      expect(panel()!.id).toBeTruthy();
    });

    it('uses menu / menuitem roles and marks disabled links', () => {
      open();
      expect(panel()!.getAttribute('role')).toBe('menu');
      const items = menuItems();
      expect(items[0].tagName).toBe('BUTTON');
      expect(items[2].tagName).toBe('A');
      expect((items[1] as HTMLButtonElement).disabled).toBe(true);
    });

    it('keeps the header slot outside the menu role', () => {
      open();
      expect(panel()!.querySelector('.header')).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus to the first enabled item on open (roving tabindex)', () => {
      open();
      const items = menuItems();
      expect(document.activeElement).toBe(items[0]);
      expect(items[0].getAttribute('tabindex')).toBe('0');
      expect(items[2].getAttribute('tabindex')).toBe('-1');
      expect(items[3].getAttribute('tabindex')).toBe('-1');
    });

    it('ArrowDown / ArrowUp skip disabled items and wrap around', () => {
      open();
      const items = menuItems();

      expect(keydown(panel()!, 'ArrowDown').defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(items[2]); // item 1 is disabled

      keydown(panel()!, 'ArrowDown');
      expect(document.activeElement).toBe(items[3]);

      keydown(panel()!, 'ArrowDown');
      expect(document.activeElement).toBe(items[0]); // wraps

      keydown(panel()!, 'ArrowUp');
      expect(document.activeElement).toBe(items[3]); // wraps backwards
    });

    it('Home / End jump to the first / last enabled item', () => {
      open();
      const items = menuItems();

      keydown(panel()!, 'End');
      expect(document.activeElement).toBe(items[3]);

      keydown(panel()!, 'Home');
      expect(document.activeElement).toBe(items[0]);
    });

    it('updates the roving tabindex to the focused item', () => {
      open();
      keydown(panel()!, 'ArrowDown');
      fixture.detectChanges();
      const items = menuItems();
      expect(items[0].getAttribute('tabindex')).toBe('-1');
      expect(items[2].getAttribute('tabindex')).toBe('0');
    });

    it('Space activates a link item', () => {
      open();
      const link = menuItems()[2];
      link.focus();
      const clickSpy = jest.spyOn(link, 'click');
      const event = keydown(link, ' ');
      expect(event.defaultPrevented).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
      expect(host.clicked.map((i) => i.id)).toEqual(['link']);
    });

    it('Escape closes the menu and returns focus to the trigger', () => {
      open();
      expect(document.activeElement).not.toBe(trigger());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(host.closedCount).toBe(1);
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('Tab closes the menu', () => {
      open();
      keydown(panel()!, 'Tab');
      fixture.detectChanges();
      expect(host.closedCount).toBe(1);
    });

    it('returns focus to the trigger when the menu is closed while an item has focus', () => {
      open();
      expect(document.activeElement).toBe(menuItems()[0]);

      host.isOpen.set(false);
      fixture.detectChanges();

      expect(document.activeElement).toBe(trigger());
    });
  });
});
