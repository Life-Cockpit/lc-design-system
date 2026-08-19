import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  linkedSignal,
  signal,
  output,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: KanbanLabel[];
  assignee?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface KanbanLabel {
  text: string;
  color?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
  limit?: number;
}

export interface KanbanMoveEvent {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  toIndex: number;
}

@Component({
  selector: 'lc-kanban-board',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent {
  readonly columns = input.required<KanbanColumn[]>();
  readonly showCardCount = input(true);
  readonly showWipLimit = input(true);
  readonly readonly = input(false);

  readonly cardMoved = output<KanbanMoveEvent>();
  readonly cardClick = output<{ card: KanbanCard; columnId: string }>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /**
   * Local working copy of the columns. Re-seeded from the `columns` input
   * whenever the parent provides a new value, while drops / keyboard moves
   * update it locally without waiting for the parent to echo the change back.
   */
  protected internalColumns = linkedSignal<KanbanColumn[]>(() => this.columns());
  protected draggedCard = signal<{ card: KanbanCard; columnId: string } | null>(null);
  protected dropTargetColumn = signal<string | null>(null);
  protected dropTargetIndex = signal<number>(-1);

  protected readonly displayColumns = this.internalColumns.asReadonly();

  protected isOverLimit(col: KanbanColumn): boolean {
    return !!col.limit && col.cards.length > col.limit;
  }

  protected getPriorityIcon(priority?: string): string {
    switch (priority) {
      case 'critical': return 'exclamation-circle';
      case 'high': return 'arrow-up';
      case 'medium': return 'minus';
      case 'low': return 'arrow-down';
      default: return '';
    }
  }

  protected getPriorityColor(priority?: string): string {
    switch (priority) {
      case 'critical': return 'var(--color-error-default)';
      case 'high': return 'var(--color-warning-default)';
      case 'medium': return 'var(--color-info-default)';
      case 'low': return 'var(--color-success-default)';
      default: return '';
    }
  }

  protected onDragStart(event: DragEvent, card: KanbanCard, columnId: string): void {
    if (this.readonly()) { event.preventDefault(); return; }
    this.draggedCard.set({ card, columnId });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.id);
    }
  }

  protected onDragOver(event: DragEvent, columnId: string, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dropTargetColumn.set(columnId);
    this.dropTargetIndex.set(index);
  }

  protected onDragOverColumn(event: DragEvent, columnId: string): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dropTargetColumn.set(columnId);
  }

  protected onDragLeave(): void {
    this.dropTargetColumn.set(null);
    this.dropTargetIndex.set(-1);
  }

  protected onDrop(event: DragEvent, toColumnId: string, toIndex?: number): void {
    event.preventDefault();
    const dragged = this.draggedCard();
    if (!dragged) return;

    this.moveCard(dragged.card.id, dragged.columnId, toColumnId, toIndex);
    this.draggedCard.set(null);
    this.dropTargetColumn.set(null);
    this.dropTargetIndex.set(-1);
  }

  /**
   * Keyboard alternative to drag & drop: Enter / Space activate the card,
   * Alt+ArrowLeft / Alt+ArrowRight move it to the neighbouring column,
   * Alt+ArrowUp / Alt+ArrowDown reorder it within its column. Moves are
   * suppressed in readonly mode, exactly like drag & drop.
   */
  protected onCardKeydown(event: KeyboardEvent, card: KanbanCard, columnId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick(card, columnId);
      return;
    }
    if (!event.altKey || this.readonly()) return;

    const cols = this.displayColumns();
    const colIdx = cols.findIndex(c => c.id === columnId);
    if (colIdx < 0) return;
    const cardIdx = cols[colIdx].cards.findIndex(c => c.id === card.id);
    if (cardIdx < 0) return;

    let toColumnId: string | undefined;
    let toIndex: number | undefined;
    switch (event.key) {
      case 'ArrowLeft':
        if (colIdx > 0) { toColumnId = cols[colIdx - 1].id; toIndex = cols[colIdx - 1].cards.length; }
        break;
      case 'ArrowRight':
        if (colIdx < cols.length - 1) { toColumnId = cols[colIdx + 1].id; toIndex = cols[colIdx + 1].cards.length; }
        break;
      case 'ArrowUp':
        if (cardIdx > 0) { toColumnId = columnId; toIndex = cardIdx - 1; }
        break;
      case 'ArrowDown':
        if (cardIdx < cols[colIdx].cards.length - 1) { toColumnId = columnId; toIndex = cardIdx + 1; }
        break;
      default:
        return;
    }
    event.preventDefault();
    if (toColumnId === undefined) return;

    this.moveCard(card.id, columnId, toColumnId, toIndex);
    // The card element is re-created inside the target column's @for block,
    // so keyboard focus has to be restored explicitly after the next render.
    afterNextRender(
      () => {
        const cards = this.host.nativeElement.querySelectorAll<HTMLElement>('.lc-kanban__card');
        Array.from(cards).find(el => el.dataset['cardId'] === card.id)?.focus();
      },
      { injector: this.injector },
    );
  }

  /** Moves a card between / within columns and emits `cardMoved`. */
  private moveCard(cardId: string, fromColumnId: string, toColumnId: string, toIndex?: number): void {
    const cols = this.displayColumns().map(c => ({ ...c, cards: [...c.cards] }));
    const fromCol = cols.find(c => c.id === fromColumnId);
    const toCol = cols.find(c => c.id === toColumnId);
    if (!fromCol || !toCol) return;

    const cardIdx = fromCol.cards.findIndex(c => c.id === cardId);
    if (cardIdx < 0) return;

    const [card] = fromCol.cards.splice(cardIdx, 1);
    const insertIdx = toIndex ?? toCol.cards.length;
    toCol.cards.splice(insertIdx, 0, card);

    this.internalColumns.set(cols);

    this.cardMoved.emit({
      cardId: card.id,
      fromColumnId,
      toColumnId,
      toIndex: insertIdx,
    });
  }

  protected onDragEnd(): void {
    this.draggedCard.set(null);
    this.dropTargetColumn.set(null);
    this.dropTargetIndex.set(-1);
  }

  protected onCardClick(card: KanbanCard, columnId: string): void {
    this.cardClick.emit({ card, columnId });
  }

}
