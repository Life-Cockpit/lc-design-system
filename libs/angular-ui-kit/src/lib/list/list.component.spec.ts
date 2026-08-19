import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ListComponent, ListItem } from './list.component';
import { ListItemTemplateDirective } from './list-item-template.directive';
import { IconComponent } from '../icon/icon.component';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

const MOCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let listElement: HTMLElement;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    listElement = fixture.nativeElement;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
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

  describe('Component Structure', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render with lc-list class', () => {
      const list = listElement.querySelector('.lc-list');
      expect(list).toBeTruthy();
    });
  });

  describe('Items Rendering', () => {
    it('should render list items', () => {
      const items = [{ label: 'Item 1' }, { label: 'Item 2' }, { label: 'Item 3' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const listItems = listElement.querySelectorAll('.lc-list__item');
      expect(listItems.length).toBe(3);
      expect(listItems[0].textContent?.trim()).toContain('Item 1');
      expect(listItems[1].textContent?.trim()).toContain('Item 2');
      expect(listItems[2].textContent?.trim()).toContain('Item 3');
    });

    it('should render empty list when no items provided', () => {
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();

      const listItems = listElement.querySelectorAll('.lc-list__item');
      expect(listItems.length).toBe(0);
    });

    it('should handle undefined items', () => {
      fixture.componentRef.setInput('items', undefined);
      fixture.detectChanges();

      const listItems = listElement.querySelectorAll('.lc-list__item');
      expect(listItems.length).toBe(0);
    });
  });

  describe('Orientation', () => {
    it('should have vertical orientation by default', () => {
      const list = listElement.querySelector('.lc-list');
      expect(list?.className).toContain('lc-list--vertical');
    });

    it('should apply vertical orientation class', () => {
      fixture.componentRef.setInput('orientation', 'vertical');
      fixture.detectChanges();

      const list = listElement.querySelector('.lc-list');
      expect(list?.className).toContain('lc-list--vertical');
    });

    it('should apply horizontal orientation class', () => {
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();

      const list = listElement.querySelector('.lc-list');
      expect(list?.className).toContain('lc-list--horizontal');
    });
  });

  describe('Dividers', () => {
    it('should not show dividers by default', () => {
      const items = [{ label: 'Item 1' }, { label: 'Item 2' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const list = listElement.querySelector('.lc-list');
      expect(list?.className).not.toContain('lc-list--with-dividers');
    });

    it('should show dividers when enabled', () => {
      const items = [{ label: 'Item 1' }, { label: 'Item 2' }];
      fixture.componentRef.setInput('items', items);
      fixture.componentRef.setInput('showDividers', true);
      fixture.detectChanges();

      const list = listElement.querySelector('.lc-list');
      expect(list?.className).toContain('lc-list--with-dividers');
    });
  });

  describe('Icons', () => {
    it('should render items without icons by default', () => {
      const items = [{ label: 'Item 1' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const icon = listElement.querySelector('.lc-list__icon');
      expect(icon).toBeFalsy();
    });

    it('should render icon when provided in item', () => {
      const items = [{ label: 'Item 1', icon: 'user' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const icon = listElement.querySelector('lc-icon.lc-list__icon');
      expect(icon).toBeTruthy();
    });

    it('should mark item icons as decorative', () => {
      fixture.componentRef.setInput('items', [{ label: 'Item 1', icon: 'user' }]);
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.directive(IconComponent)).componentInstance as IconComponent;
      expect(icon.decorative()).toBe(true);
    });

    it('should render multiple items with different icons', () => {
      const items = [
        { label: 'Profile', icon: 'user' },
        { label: 'Settings', icon: 'cog-6-tooth' },
        { label: 'Logout', icon: 'arrow-right-on-rectangle' },
      ];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const icons = listElement.querySelectorAll('lc-icon.lc-list__icon');
      expect(icons.length).toBe(3);
    });
  });

  describe('Actions', () => {
    it('should not render action buttons by default', () => {
      const items = [{ label: 'Item 1' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const action = listElement.querySelector('.lc-list__action');
      expect(action).toBeFalsy();
    });

    it('should render action when provided in item', () => {
      const items = [{ label: 'Item 1', action: 'Delete' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const action = listElement.querySelector('.lc-list__action');
      expect(action).toBeTruthy();
      expect(action?.textContent?.trim()).toBe('Delete');
    });

    it('should trigger item click event', () => {
      const items = [{ label: 'Item 1', id: '1' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      let clickedItem: any;
      component.itemClick.subscribe((item) => (clickedItem = item));

      const listItem = listElement.querySelector('.lc-list__item') as HTMLElement;
      listItem.click();

      expect(clickedItem).toEqual({ label: 'Item 1', id: '1' });
    });

    it('should trigger action click event', () => {
      const items = [{ label: 'Item 1', action: 'Delete', id: '1' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      let actionClickedItem: any;
      component.actionClick.subscribe((item) => (actionClickedItem = item));

      const actionButton = listElement.querySelector('lc-button.lc-list__action');
      expect(actionButton).toBeTruthy();

      // Trigger the button's clicked event
      const buttonElement = actionButton?.querySelector('button');
      buttonElement?.click();

      expect(actionClickedItem).toEqual({ label: 'Item 1', action: 'Delete', id: '1' });
    });

    it('should not emit itemClick when the action button is clicked', () => {
      const items = [{ label: 'Item 1', action: 'Delete', id: '1' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const itemClicks: unknown[] = [];
      const actionClicks: unknown[] = [];
      component.itemClick.subscribe((item) => itemClicks.push(item));
      component.actionClick.subscribe((item) => actionClicks.push(item));

      const buttonElement = listElement.querySelector('lc-button.lc-list__action button') as HTMLElement;
      buttonElement.click();

      expect(actionClicks.length).toBe(1);
      expect(itemClicks.length).toBe(0);
    });
  });

  describe('Clickable rows (keyboard)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', [
        { label: 'Item 1', id: '1' },
        { label: 'Item 2', id: '2', disabled: true },
      ]);
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();
    });

    it('renders focusable button rows inside listitems', () => {
      const wrappers = listElement.querySelectorAll('[role="listitem"]');
      expect(wrappers.length).toBe(2);
      const rows = listElement.querySelectorAll('.lc-list__item');
      expect(rows[0].getAttribute('role')).toBe('button');
      expect(rows[0].getAttribute('tabindex')).toBe('0');
      expect(rows[1].getAttribute('tabindex')).toBe('-1');
      expect(rows[1].getAttribute('aria-disabled')).toBe('true');
    });

    it('emits itemClick on Enter and Space', () => {
      const clicks: unknown[] = [];
      component.itemClick.subscribe((item) => clicks.push(item));
      const row = listElement.querySelector('.lc-list__item') as HTMLElement;

      const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      row.dispatchEvent(enter);
      row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));

      expect(enter.defaultPrevented).toBe(true);
      expect(clicks).toEqual([{ label: 'Item 1', id: '1' }, { label: 'Item 1', id: '1' }]);
    });

    it('does not emit for disabled rows or for keys from nested controls', () => {
      const clicks: unknown[] = [];
      component.itemClick.subscribe((item) => clicks.push(item));
      const disabledRow = listElement.querySelectorAll('.lc-list__item')[1] as HTMLElement;
      disabledRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const label = listElement.querySelector('.lc-list__label') as HTMLElement;
      label.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(clicks.length).toBe(0);
    });

    it('keeps plain listitems when not clickable', () => {
      fixture.componentRef.setInput('clickable', false);
      fixture.detectChanges();
      const row = listElement.querySelector('.lc-list__item');
      expect(row?.getAttribute('role')).toBe('listitem');
      expect(row?.hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled class to disabled items', () => {
      const items = [{ label: 'Item 1', disabled: true }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const listItem = listElement.querySelector('.lc-list__item');
      expect(listItem?.className).toContain('lc-list__item--disabled');
    });

    it('should not trigger click on disabled items', () => {
      const items = [{ label: 'Item 1', disabled: true }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      let clicked = false;
      component.itemClick.subscribe(() => (clicked = true));

      const listItem = listElement.querySelector('.lc-list__item') as HTMLElement;
      listItem.click();

      expect(clicked).toBe(false);
    });
  });

  describe('CSS Classes Computed', () => {
    it('should combine orientation and dividers classes', () => {
      const items = [{ label: 'Item 1' }];
      fixture.componentRef.setInput('items', items);
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.componentRef.setInput('showDividers', true);
      fixture.detectChanges();

      const list = listElement.querySelector('.lc-list');
      expect(list?.className).toContain('lc-list--horizontal');
      expect(list?.className).toContain('lc-list--with-dividers');
    });
  });

  describe('Accessibility', () => {
    it('should have list role', () => {
      const items = [{ label: 'Item 1' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const list = listElement.querySelector('.lc-list');
      expect(list?.getAttribute('role')).toBe('list');
    });

    it('should have listitem role for items', () => {
      const items = [{ label: 'Item 1' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const listItem = listElement.querySelector('.lc-list__item');
      expect(listItem?.getAttribute('role')).toBe('listitem');
    });

    it('should have aria-disabled for disabled items', () => {
      const items = [{ label: 'Item 1', disabled: true }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const listItem = listElement.querySelector('.lc-list__item');
      expect(listItem?.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Subtitles', () => {
    it('should render subtitle when provided', () => {
      const items = [{ label: 'Title', subtitle: 'Subtitle text' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const subtitle = listElement.querySelector('.lc-list__subtitle');
      expect(subtitle).toBeTruthy();
      expect(subtitle?.textContent?.trim()).toBe('Subtitle text');
    });

    it('should not render subtitle when not provided', () => {
      const items = [{ label: 'Title' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const subtitle = listElement.querySelector('.lc-list__subtitle');
      expect(subtitle).toBeFalsy();
    });
  });

  describe('Description', () => {
    it('should render description when provided', () => {
      const items = [{ label: 'Title', description: 'Description text' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const description = listElement.querySelector('.lc-list__description');
      expect(description).toBeTruthy();
      expect(description?.textContent?.trim()).toBe('Description text');
    });

    it('should not render description when not provided', () => {
      const items = [{ label: 'Title' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const description = listElement.querySelector('.lc-list__description');
      expect(description).toBeFalsy();
    });
  });

  describe('Avatar', () => {
    it('should render avatar initials when provided as text', () => {
      const items = [{ label: 'Anna Schmidt', avatar: 'AS' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const avatar = listElement.querySelector('.lc-list__avatar');
      expect(avatar).toBeTruthy();
      const initials = listElement.querySelector('.lc-list__avatar-initials');
      expect(initials).toBeTruthy();
      expect(initials?.textContent?.trim()).toBe('AS');
    });

    it('should render avatar image when URL provided', () => {
      const items = [{ label: 'User', avatar: 'https://example.com/photo.jpg' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const img = listElement.querySelector('.lc-list__avatar-img') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toBe('https://example.com/photo.jpg');
    });

    it('should render avatar image for data URLs', () => {
      const items = [{ label: 'User', avatar: 'data:image/png;base64,abc' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const img = listElement.querySelector('.lc-list__avatar-img');
      expect(img).toBeTruthy();
    });

    it('should prefer avatar over icon', () => {
      const items = [{ label: 'User', avatar: 'AB', icon: 'user' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const avatar = listElement.querySelector('.lc-list__avatar');
      const icon = listElement.querySelector('.lc-list__icon');
      expect(avatar).toBeTruthy();
      expect(icon).toBeFalsy();
    });
  });

  describe('Badge', () => {
    it('should render badge when provided', () => {
      const items = [{ label: 'Inbox', badge: '24' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const badge = listElement.querySelector('.lc-list__badge');
      expect(badge).toBeTruthy();
      expect(badge?.textContent?.trim()).toBe('24');
    });

    it('should apply default badge variant', () => {
      const items = [{ label: 'Item', badge: '5' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const badge = listElement.querySelector('.lc-list__badge');
      expect(badge?.className).toContain('lc-list__badge--default');
    });

    it('should apply specified badge variant', () => {
      const items = [
        { label: 'Item', badge: 'Error', badgeVariant: 'error' as const },
      ];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const badge = listElement.querySelector('.lc-list__badge');
      expect(badge?.className).toContain('lc-list__badge--error');
    });

    it('should not render badge when not provided', () => {
      const items = [{ label: 'Item' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const badge = listElement.querySelector('.lc-list__badge');
      expect(badge).toBeFalsy();
    });
  });

  describe('Metadata', () => {
    it('should render metadata when provided', () => {
      const items = [{ label: 'File.pdf', metadata: '2.4 MB' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const metadata = listElement.querySelector('.lc-list__metadata');
      expect(metadata).toBeTruthy();
      expect(metadata?.textContent?.trim()).toBe('2.4 MB');
    });

    it('should not render metadata when not provided', () => {
      const items = [{ label: 'Item' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const metadata = listElement.querySelector('.lc-list__metadata');
      expect(metadata).toBeFalsy();
    });
  });

  describe('Selected State', () => {
    it('should apply selected class', () => {
      const items = [{ label: 'Item 1', selected: true }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const listItem = listElement.querySelector('.lc-list__item');
      expect(listItem?.className).toContain('lc-list__item--selected');
    });

    it('should not apply selected class when false', () => {
      const items = [{ label: 'Item 1', selected: false }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const listItem = listElement.querySelector('.lc-list__item');
      expect(listItem?.className).not.toContain('lc-list__item--selected');
    });
  });

  describe('Size', () => {
    it('should default to md size', () => {
      const list = listElement.querySelector('.lc-list');
      expect(list?.className).toContain('lc-list--md');
    });

    it('should apply sm size class', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();

      const list = listElement.querySelector('.lc-list');
      expect(list?.className).toContain('lc-list--sm');
    });

    it('should apply lg size class', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      const list = listElement.querySelector('.lc-list');
      expect(list?.className).toContain('lc-list--lg');
    });
  });

  describe('Content Section', () => {
    it('should render content wrapper for label', () => {
      const items = [{ label: 'Item' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const content = listElement.querySelector('.lc-list__content');
      expect(content).toBeTruthy();
    });

    it('should render all three text lines together', () => {
      const items = [{
        label: 'Title',
        subtitle: 'Sub',
        description: 'Desc',
      }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const content = listElement.querySelector('.lc-list__content');
      expect(content?.querySelector('.lc-list__label')).toBeTruthy();
      expect(content?.querySelector('.lc-list__subtitle')).toBeTruthy();
      expect(content?.querySelector('.lc-list__description')).toBeTruthy();
    });
  });

  describe('Trailing Section', () => {
    it('should render trailing section with badge and metadata', () => {
      const items = [{ label: 'Item', badge: '3', metadata: 'Today' }];
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();

      const trailing = listElement.querySelector('.lc-list__trailing');
      expect(trailing?.querySelector('.lc-list__badge')).toBeTruthy();
      expect(trailing?.querySelector('.lc-list__metadata')).toBeTruthy();
    });
  });

  describe('Custom item template (lcListItem)', () => {
    @Component({
      standalone: true,
      imports: [ListComponent, ListItemTemplateDirective],
      template: `
        <lc-list [items]="items()" [clickable]="clickable()">
          <ng-template lcListItem let-item>
            <span class="custom-row">{{ item.label }} / {{ item.extra }}</span>
          </ng-template>
        </lc-list>
      `,
    })
    class TemplateHost {
      items = signal<ListItem[]>([{ label: 'A', extra: 'x' }, { label: 'B', extra: 'y' }]);
      clickable = signal(false);
    }

    it('renders the projected template for every row (plain and clickable)', () => {
      const hostFixture = TestBed.createComponent(TemplateHost);
      hostFixture.detectChanges();
      let rows = hostFixture.nativeElement.querySelectorAll('.custom-row');
      expect(rows.length).toBe(2);
      expect(rows[1].textContent?.trim()).toBe('B / y');
      expect(hostFixture.nativeElement.querySelector('.lc-list__label')).toBeNull();

      hostFixture.componentInstance.clickable.set(true);
      hostFixture.detectChanges();
      rows = hostFixture.nativeElement.querySelectorAll('.lc-list__item[role="button"] .custom-row');
      expect(rows.length).toBe(2);
    });
  });
});
