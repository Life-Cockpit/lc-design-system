import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { KanbanBoardComponent, KanbanColumn, KanbanMoveEvent, KanbanCard } from './kanban-board.component';

@Component({
  standalone: true,
  imports: [KanbanBoardComponent],
  template: `<lc-kanban-board
    [columns]="columns()"
    [showCardCount]="showCardCount()"
    [showWipLimit]="showWipLimit()"
    [readonly]="readonly()"
    (cardMoved)="lastMove = $event"
    (cardClick)="lastClick = $event"
  />`,
})
class TestHost {
  columns = signal<KanbanColumn[]>([
    {
      id: 'todo', title: 'To Do', color: '#3b82f6',
      cards: [
        { id: '1', title: 'Task 1', priority: 'high' },
        { id: '2', title: 'Task 2', description: 'Desc', labels: [{ text: 'Bug', color: '#ef4444' }] },
      ],
    },
    {
      id: 'progress', title: 'In Progress', color: '#f59e0b', limit: 3,
      cards: [
        { id: '3', title: 'Task 3', assignee: 'Alice' },
      ],
    },
    {
      id: 'done', title: 'Done', color: '#22c55e',
      cards: [],
    },
  ]);
  showCardCount = signal(true);
  showWipLimit = signal(true);
  readonly = signal(false);
  lastMove: KanbanMoveEvent | null = null;
  lastClick: { card: KanbanCard; columnId: string } | null = null;
}

describe('KanbanBoardComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideHttpClient()] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should create', () => {
    expect(el.querySelector('lc-kanban-board')).toBeTruthy();
  });

  it('should render all columns', () => {
    const cols = el.querySelectorAll('.lc-kanban__column');
    expect(cols.length).toBe(3);
  });

  it('should show column titles', () => {
    const titles = el.querySelectorAll('.lc-kanban__column-title');
    expect(titles[0].textContent?.trim()).toBe('To Do');
    expect(titles[1].textContent?.trim()).toBe('In Progress');
    expect(titles[2].textContent?.trim()).toBe('Done');
  });

  it('should render cards', () => {
    const cards = el.querySelectorAll('.lc-kanban__card');
    expect(cards.length).toBe(3);
  });

  it('should show card title', () => {
    const titles = el.querySelectorAll('.lc-kanban__card-title');
    expect(titles[0].textContent?.trim()).toBe('Task 1');
  });

  it('should show card description', () => {
    const desc = el.querySelector('.lc-kanban__card-desc');
    expect(desc?.textContent?.trim()).toBe('Desc');
  });

  it('should show priority icon', () => {
    const priority = el.querySelector('.lc-kanban__card-priority');
    expect(priority).toBeTruthy();
    expect(priority?.tagName.toLowerCase()).toBe('lc-icon');
  });

  it('should show card labels', () => {
    const labels = el.querySelectorAll('.lc-kanban__card-label');
    expect(labels.length).toBe(1);
    expect(labels[0].textContent?.trim()).toBe('Bug');
  });

  it('should show assignee', () => {
    const assignee = el.querySelector('.lc-kanban__card-assignee');
    expect(assignee?.textContent?.trim()).toBe('Alice');
  });

  it('should show card count', () => {
    const counts = el.querySelectorAll('.lc-kanban__column-count');
    expect(counts[0].textContent?.trim()).toBe('2');
    expect(counts[1].textContent?.trim()).toBe('1');
    expect(counts[2].textContent?.trim()).toBe('0');
  });

  it('should show WIP limit', () => {
    const limit = el.querySelector('.lc-kanban__column-limit');
    expect(limit).toBeTruthy();
    expect(limit?.textContent?.trim()).toContain('3');
  });

  it('should show column color dot', () => {
    const dots = el.querySelectorAll('.lc-kanban__column-dot');
    expect(dots.length).toBe(3);
  });

  it('should show empty state for empty column', () => {
    const empty = el.querySelector('.lc-kanban__empty');
    expect(empty?.textContent?.trim()).toBe('Drop here');
  });

  it('should emit cardClick on card click', () => {
    const card = el.querySelector('.lc-kanban__card') as HTMLElement;
    card.click();
    expect(host.lastClick).toBeTruthy();
    expect(host.lastClick!.card.id).toBe('1');
    expect(host.lastClick!.columnId).toBe('todo');
  });

  it('should set cards as draggable', () => {
    const card = el.querySelector('.lc-kanban__card');
    expect(card?.getAttribute('draggable')).toBe('true');
  });

  it('should not be draggable in readonly mode', () => {
    host.readonly.set(true);
    fixture.detectChanges();
    const card = el.querySelector('.lc-kanban__card');
    expect(card?.getAttribute('draggable')).toBe('false');
  });

  it('should hide card count when disabled', () => {
    host.showCardCount.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-kanban__column-count').length).toBe(0);
  });

  it('should hide WIP limit when disabled', () => {
    host.showWipLimit.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-kanban__column-limit').length).toBe(0);
  });

  describe('keyboard operability', () => {
    function key(target: HTMLElement, key: string, altKey = false): KeyboardEvent {
      const ev = new KeyboardEvent('keydown', { key, altKey, bubbles: true, cancelable: true });
      target.dispatchEvent(ev);
      return ev;
    }

    it('renders cards as focusable buttons', () => {
      const card = el.querySelector('.lc-kanban__card') as HTMLElement;
      expect(card.getAttribute('role')).toBe('button');
      expect(card.getAttribute('tabindex')).toBe('0');
    });

    it('emits cardClick on Enter and Space', () => {
      const card = el.querySelector('.lc-kanban__card') as HTMLElement;
      const enter = key(card, 'Enter');
      expect(enter.defaultPrevented).toBe(true);
      expect(host.lastClick?.card.id).toBe('1');

      host.lastClick = null;
      key(card, ' ');
      expect(host.lastClick?.card.id).toBe('1');
    });

    it('moves a card to the next column with Alt+ArrowRight and emits cardMoved like a drop', () => {
      const card = el.querySelector('.lc-kanban__card') as HTMLElement;
      key(card, 'ArrowRight', true);
      fixture.detectChanges();

      expect(host.lastMove).toEqual({ cardId: '1', fromColumnId: 'todo', toColumnId: 'progress', toIndex: 1 });
      const counts = el.querySelectorAll('.lc-kanban__column-count');
      expect(counts[0].textContent?.trim()).toBe('1');
      expect(counts[1].textContent?.trim()).toBe('2');
      // Focus follows the card into its new column.
      const moved = Array.from(el.querySelectorAll<HTMLElement>('.lc-kanban__card')).find(c => c.dataset['cardId'] === '1');
      expect(document.activeElement).toBe(moved);
    });

    it('reorders within the column with Alt+ArrowDown / Alt+ArrowUp', () => {
      const card = el.querySelector('.lc-kanban__card') as HTMLElement;
      key(card, 'ArrowDown', true);
      fixture.detectChanges();
      expect(host.lastMove).toEqual({ cardId: '1', fromColumnId: 'todo', toColumnId: 'todo', toIndex: 1 });
      const titles = el.querySelectorAll('.lc-kanban__card-title');
      expect(titles[0].textContent?.trim()).toBe('Task 2');
      expect(titles[1].textContent?.trim()).toBe('Task 1');

      const movedCard = el.querySelectorAll('.lc-kanban__card')[1] as HTMLElement;
      key(movedCard, 'ArrowUp', true);
      fixture.detectChanges();
      expect(host.lastMove).toEqual({ cardId: '1', fromColumnId: 'todo', toColumnId: 'todo', toIndex: 0 });
    });

    it('does not move at the board edges or without Alt', () => {
      const card = el.querySelector('.lc-kanban__card') as HTMLElement;
      key(card, 'ArrowLeft', true);
      key(card, 'ArrowUp', true);
      key(card, 'ArrowRight', false);
      expect(host.lastMove).toBeNull();
    });

    it('does not move cards in readonly mode', () => {
      host.readonly.set(true);
      fixture.detectChanges();
      const card = el.querySelector('.lc-kanban__card') as HTMLElement;
      key(card, 'ArrowRight', true);
      expect(host.lastMove).toBeNull();
      expect(card.getAttribute('aria-keyshortcuts')).toBeNull();
      // Activation still works on a readonly board.
      key(card, 'Enter');
      expect(host.lastClick?.card.id).toBe('1');
    });
  });

  describe('columns input after a local move', () => {
    it('re-seeds from a later columns update instead of latching the first drop', () => {
      const card = el.querySelector('.lc-kanban__card') as HTMLElement;
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }));
      fixture.detectChanges();
      expect(host.lastMove?.toColumnId).toBe('progress');

      host.columns.set([
        { id: 'todo', title: 'To Do', cards: [{ id: '9', title: 'Fresh' }] },
        { id: 'done', title: 'Done', cards: [] },
      ]);
      fixture.detectChanges();

      expect(el.querySelectorAll('.lc-kanban__column').length).toBe(2);
      const titles = Array.from(el.querySelectorAll('.lc-kanban__card-title')).map(t => t.textContent?.trim());
      expect(titles).toEqual(['Fresh']);
    });
  });
});
