import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsComponent, TabComponent } from './tabs.component';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'fs';
import { join } from 'path';

@Component({
  selector: 'lc-test-tabs',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: `
    <lc-tabs [orientation]="orientation()" [selectedIndexInput]="selectedIndex()">
      <lc-tab label="Tab 1">Content 1</lc-tab>
      <lc-tab label="Tab 2" [disabled]="disableTab2()">Content 2</lc-tab>
      <lc-tab label="Tab 3">Content 3</lc-tab>
    </lc-tabs>
  `,
})
class TestTabsComponent {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly selectedIndex = signal(0);
  readonly disableTab2 = signal(false);
}

@Component({
  selector: 'lc-test-tabs-disabled',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: `
    <lc-tabs>
      <lc-tab label="Tab 1">Content 1</lc-tab>
      <lc-tab label="Tab 2" [disabled]="true">Content 2</lc-tab>
      <lc-tab label="Tab 3">Content 3</lc-tab>
    </lc-tabs>
  `,
})
class TestTabsDisabledComponent {}

@Component({
  selector: 'lc-test-tabs-vertical',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: `
    <lc-tabs orientation="vertical">
      <lc-tab label="Tab 1">Content 1</lc-tab>
      <lc-tab label="Tab 2">Content 2</lc-tab>
      <lc-tab label="Tab 3">Content 3</lc-tab>
    </lc-tabs>
  `,
})
class TestTabsVerticalComponent {}

@Component({
  selector: 'lc-test-tabs-dynamic',
  standalone: true,
  imports: [TabsComponent, TabComponent],
  template: `
    <lc-tabs [(selectedIndex)]="selected">
      @for (label of labels(); track label) {
        <lc-tab [label]="label">Content {{ label }}</lc-tab>
      }
    </lc-tabs>
  `,
})
class TestTabsDynamicComponent {
  readonly labels = signal(['A', 'B']);
  readonly selected = signal(0);
}

describe('TabsComponent - Basic Tests', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent, TabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Orientation', () => {
    it('should default to horizontal orientation', () => {
      expect(component.orientation()).toBe('horizontal');
    });

    it('should apply horizontal orientation class', () => {
      fixture.componentRef.setInput('orientation', 'horizontal');
      fixture.detectChanges();
      const tabList = fixture.debugElement.query(By.css('[role="tablist"]'));
      expect(tabList.nativeElement.classList.contains('lc-tabs--horizontal')).toBe(true);
    });

    it('should apply vertical orientation class', () => {
      fixture.componentRef.setInput('orientation', 'vertical');
      fixture.detectChanges();
      const tabList = fixture.debugElement.query(By.css('[role="tablist"]'));
      expect(tabList.nativeElement.classList.contains('lc-tabs--vertical')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on tab list', () => {
      const tabList = fixture.debugElement.query(By.css('[role="tablist"]'));
      expect(tabList.nativeElement.getAttribute('role')).toBe('tablist');
    });

    it('should have correct ARIA orientation', () => {
      fixture.componentRef.setInput('orientation', 'vertical');
      fixture.detectChanges();
      const tabList = fixture.debugElement.query(By.css('[role="tablist"]'));
      expect(tabList.nativeElement.getAttribute('aria-orientation')).toBe('vertical');
    });
  });
});

describe('TabsComponent - With Tab Children', () => {
  let testFixture: ComponentFixture<TestTabsComponent>;
  let tabsComponent: TabsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTabsComponent],
    }).compileComponents();

    testFixture = TestBed.createComponent(TestTabsComponent);
    testFixture.detectChanges();

    const tabsDebug = testFixture.debugElement.query(By.directive(TabsComponent));
    tabsComponent = tabsDebug.componentInstance;
  });

  describe('Tab Selection', () => {
    it('should select first tab by default', () => {
      expect(tabsComponent.selectedIndex()).toBe(0);
    });

    it('should emit selectedIndexChange when tab is selected', () => {
      const emitted: number[] = [];
      tabsComponent.selectedIndex.subscribe((index) => emitted.push(index));
      tabsComponent.selectTab(1);
      testFixture.detectChanges();
      expect(emitted).toEqual([1]);
    });

    it('should not emit selectedIndexChange during initialisation', () => {
      const emitted: number[] = [];
      const fixture = TestBed.createComponent(TestTabsComponent);
      const tabs = fixture.debugElement.query(By.directive(TabsComponent))
        .componentInstance as TabsComponent;
      tabs.selectedIndex.subscribe((index) => emitted.push(index));
      fixture.detectChanges();
      expect(emitted).toEqual([]);
    });

    it('should update activeTab when selectedIndex changes', () => {
      tabsComponent.selectedIndex.set(1);
      testFixture.detectChanges();
      expect(tabsComponent.selectedIndex()).toBe(1);
    });

    it('should follow the legacy selectedIndexInput binding', () => {
      testFixture.componentInstance.selectedIndex.set(2);
      testFixture.detectChanges();
      expect(tabsComponent.selectedIndex()).toBe(2);
      const buttons = testFixture.debugElement.queryAll(By.css('button[role="tab"]'));
      expect(buttons[2]?.nativeElement.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should move to next tab on ArrowRight in horizontal mode', () => {
      tabsComponent.selectedIndex.set(0);
      tabsComponent.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(tabsComponent.selectedIndex()).toBe(1);
    });

    it('should move to previous tab on ArrowLeft in horizontal mode', () => {
      tabsComponent.selectedIndex.set(1);
      tabsComponent.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      expect(tabsComponent.selectedIndex()).toBe(0);
    });

    it('should move to next tab on ArrowDown in vertical mode', async () => {
      const vertFixture = TestBed.createComponent(TestTabsVerticalComponent);
      vertFixture.detectChanges();
      const vertTabs = vertFixture.debugElement.query(By.directive(TabsComponent)).componentInstance as TabsComponent;
      vertTabs.selectedIndex.set(0);
      vertTabs.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(vertTabs.selectedIndex()).toBe(1);
    });

    it('should move to previous tab on ArrowUp in vertical mode', async () => {
      const vertFixture = TestBed.createComponent(TestTabsVerticalComponent);
      vertFixture.detectChanges();
      const vertTabs = vertFixture.debugElement.query(By.directive(TabsComponent)).componentInstance as TabsComponent;
      vertTabs.selectedIndex.set(1);
      vertTabs.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(vertTabs.selectedIndex()).toBe(0);
    });

    it('should wrap to first tab when at end', () => {
      tabsComponent.selectedIndex.set(2);
      tabsComponent.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(tabsComponent.selectedIndex()).toBe(0);
    });

    it('should wrap to last tab when at beginning', () => {
      tabsComponent.selectedIndex.set(0);
      tabsComponent.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      expect(tabsComponent.selectedIndex()).toBe(2);
    });

    it('should move to first tab on Home key', () => {
      tabsComponent.selectedIndex.set(2);
      tabsComponent.handleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }));
      expect(tabsComponent.selectedIndex()).toBe(0);
    });

    it('should move to last tab on End key', () => {
      tabsComponent.selectedIndex.set(0);
      tabsComponent.handleKeyDown(new KeyboardEvent('keydown', { key: 'End' }));
      expect(tabsComponent.selectedIndex()).toBe(2);
    });

    it('should move DOM focus to the newly selected tab on ArrowRight', () => {
      const buttons = testFixture.debugElement.queryAll(By.css('button[role="tab"]'));
      buttons[0]?.nativeElement.focus();
      expect(document.activeElement).toBe(buttons[0]?.nativeElement);

      buttons[0]?.nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      testFixture.detectChanges();

      expect(document.activeElement).toBe(buttons[1]?.nativeElement);
      expect(buttons[1]?.nativeElement.getAttribute('tabindex')).toBe('0');
      expect(buttons[0]?.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    it('should move DOM focus to the last tab on End', () => {
      const buttons = testFixture.debugElement.queryAll(By.css('button[role="tab"]'));
      buttons[0]?.nativeElement.focus();
      buttons[0]?.nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
      );
      testFixture.detectChanges();
      expect(document.activeElement).toBe(buttons[2]?.nativeElement);
    });
  });
});

describe('TabsComponent - Dynamic tabs', () => {
  let fixture: ComponentFixture<TestTabsDynamicComponent>;

  const tabButtons = () =>
    fixture.debugElement
      .queryAll(By.css('button[role="tab"]'))
      .map((b) => (b.nativeElement as HTMLElement).textContent?.trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTabsDynamicComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestTabsDynamicComponent);
    fixture.detectChanges();
  });

  it('should render a tab button for tabs added after init', () => {
    expect(tabButtons()).toEqual(['A', 'B']);

    fixture.componentInstance.labels.set(['A', 'B', 'C']);
    fixture.detectChanges();

    expect(tabButtons()).toEqual(['A', 'B', 'C']);
    const panels = fixture.debugElement.queryAll(By.css('[role="tabpanel"]'));
    expect(panels.length).toBe(3);
  });

  it('should drop the tab button for tabs removed after init', () => {
    fixture.componentInstance.labels.set(['B']);
    fixture.detectChanges();
    expect(tabButtons()).toEqual(['B']);
  });

  it('should keep the selection in range when the selected tab is removed', () => {
    fixture.componentInstance.labels.set(['A', 'B', 'C']);
    fixture.detectChanges();
    fixture.componentInstance.selected.set(2);
    fixture.detectChanges();

    fixture.componentInstance.labels.set(['A', 'B']);
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toBe(1);
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    expect(buttons[1]?.nativeElement.getAttribute('aria-selected')).toBe('true');
  });

  it('should support two-way binding via [(selectedIndex)]', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    buttons[1]?.nativeElement.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe(1);

    fixture.componentInstance.selected.set(0);
    fixture.detectChanges();
    expect(buttons[0]?.nativeElement.getAttribute('aria-selected')).toBe('true');
  });
});

describe('TabComponent', () => {
  @Component({
    template: `
      <lc-tabs>
        <lc-tab label="Tab 1">Content 1</lc-tab>
        <lc-tab label="Tab 2" [disabled]="true">Content 2</lc-tab>
        <lc-tab label="Tab 3">Content 3</lc-tab>
      </lc-tabs>
    `,
    standalone: true,
    imports: [TabsComponent, TabComponent],
  })
  class TestHostComponent {}

  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render tab labels', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    expect(buttons.length).toBe(3);
    expect(buttons[0]?.nativeElement.textContent.trim()).toBe('Tab 1');
    expect(buttons[1]?.nativeElement.textContent.trim()).toBe('Tab 2');
    expect(buttons[2]?.nativeElement.textContent.trim()).toBe('Tab 3');
  });

  it('should show first tab content by default', () => {
    const panels = fixture.debugElement.queryAll(By.css('[role="tabpanel"]'));
    expect(panels[0]?.nativeElement.textContent.trim()).toBe('Content 1');
    expect(panels[0]?.nativeElement.hasAttribute('hidden')).toBe(false);
  });

  it('should mark first tab as selected', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    expect(buttons[0]?.nativeElement.getAttribute('aria-selected')).toBe('true');
    expect(buttons[1]?.nativeElement.getAttribute('aria-selected')).toBe('false');
  });

  it('should link tabs and panels via aria-controls / aria-labelledby', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    const panels = fixture.debugElement.queryAll(By.css('[role="tabpanel"]'));
    buttons.forEach((button, i) => {
      const tab = button.nativeElement as HTMLElement;
      const panel = panels[i]?.nativeElement as HTMLElement;
      expect(tab.id).toBeTruthy();
      expect(panel.id).toBeTruthy();
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    });
  });

  it('should mark disabled tab', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    expect(buttons[1]?.nativeElement.disabled).toBe(true);
    expect(buttons[1]?.nativeElement.getAttribute('aria-disabled')).toBe('true');
  });

  it('should switch tabs on click', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    buttons[2]?.nativeElement.click();
    fixture.detectChanges();

    const panels = fixture.debugElement.queryAll(By.css('[role="tabpanel"]'));
    expect(buttons[2]?.nativeElement.getAttribute('aria-selected')).toBe('true');
    expect(panels[2]?.nativeElement.hasAttribute('hidden')).toBe(false);
    expect(panels[0]?.nativeElement.hasAttribute('hidden')).toBe(true);
  });
});

describe('TabsComponent - Badges', () => {
  @Component({
    selector: 'lc-test-tabs-badges',
    standalone: true,
    imports: [TabsComponent, TabComponent],
    template: `
      <lc-tabs>
        <lc-tab label="Inbox" [badge]="inboxCount()" badgeVariant="primary">Content 1</lc-tab>
        <lc-tab label="Spam" [badge]="0" badgeVariant="error">Content 2</lc-tab>
        <lc-tab label="Archive">Content 3</lc-tab>
      </lc-tabs>
    `,
  })
  class TestTabsBadgesComponent {
    inboxCount = signal<number | undefined>(12);
  }

  let fixture: ComponentFixture<TestTabsBadgesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTabsBadgesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestTabsBadgesComponent);
    fixture.detectChanges();
  });

  it('should render badge content inside the tab button', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    const badge = buttons[0]?.query(By.css('.lc-tabs__badge'));
    expect(badge).toBeTruthy();
    expect(badge?.nativeElement.textContent.trim()).toBe('12');
  });

  it('should apply the badge variant class', () => {
    const badge = fixture.debugElement.query(By.css('.lc-tabs__badge .lc-badge'));
    expect(badge.nativeElement.classList.contains('lc-badge--primary')).toBe(true);
  });

  it('should render a badge for the value 0', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    const badge = buttons[1]?.query(By.css('.lc-tabs__badge'));
    expect(badge).toBeTruthy();
    expect(badge?.nativeElement.textContent.trim()).toBe('0');
  });

  it('should not render a badge when none is set', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    expect(buttons[2]?.query(By.css('.lc-tabs__badge'))).toBeNull();
  });

  it('should remove the badge when it becomes undefined', () => {
    fixture.componentInstance.inboxCount.set(undefined);
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button[role="tab"]'));
    expect(buttons[0]?.query(By.css('.lc-tabs__badge'))).toBeNull();
  });
});

describe('TabsComponent - Disabled State', () => {
  let fixture: ComponentFixture<TestTabsDisabledComponent>;
  let tabsComponent: TabsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTabsDisabledComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestTabsDisabledComponent);
    fixture.detectChanges();

    const tabsDebug = fixture.debugElement.query(By.directive(TabsComponent));
    tabsComponent = tabsDebug.componentInstance;
  });

  it('should not select disabled tab', () => {
    const initialIndex = tabsComponent.selectedIndex();
    tabsComponent.selectTab(1);
    fixture.detectChanges();
    expect(tabsComponent.selectedIndex()).toBe(initialIndex);
  });

  it('should skip disabled tabs when navigating', () => {
    tabsComponent.selectedIndex.set(0);
    tabsComponent.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(tabsComponent.selectedIndex()).toBe(2);
  });
});

describe('TabsComponent - Stylesheet', () => {
  it('should not reference undefined transition tokens', () => {
    const scss = readFileSync(join(__dirname, 'tabs.component.scss'), 'utf8');
    expect(scss).not.toMatch(/--transition-(fast|normal|slow)/);
    expect(scss).toContain('var(--animation-duration-base)');
  });
});
