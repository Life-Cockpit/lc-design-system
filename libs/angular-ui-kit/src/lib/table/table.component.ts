import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  input,
  output,
  computed,
  signal,
  linkedSignal,
  viewChildren,
  ContentChildren,
  QueryList,
} from '@angular/core';
import { NgStyle, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableCellDirective } from './table-cell.directive';
import { InputComponent } from '../input/input.component';
import { SelectComponent } from '../select/select.component';
import { ButtonComponent, ButtonVariant } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

type TableCellClass = string | ((
  value: unknown,
  row: Record<string, unknown>,
  column: TableColumn,
  rowIndex: number
) => string);

type TableCellStyle = Record<string, string> | ((
  value: unknown,
  row: Record<string, unknown>,
  column: TableColumn,
  rowIndex: number
) => Record<string, string>);

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  width?: string;
  /** Optional CSS class(es) applied to both th and td cells */
  cssClass?: string;
  /** Optional CSS class(es) for td cells only (string or resolver callback) */
  cellClass?: TableCellClass;
  /** Optional inline styles for td cells only (object or resolver callback) */
  cellStyle?: TableCellStyle;
  /** Optional tooltip shown on hover over the column header */
  tooltip?: string;
  /** Optional formatter for cell output when no custom template is used */
  formatter?: (
    value: unknown,
    row: Record<string, unknown>,
    column: TableColumn,
    rowIndex: number
  ) => unknown;
  /** Input type for inline editing (default: text) */
  editType?: 'text' | 'number' | 'select';
  /** Options for select edit type */
  editOptions?: string[];
}

/**
 * A row-level action rendered in the table's actions column (e.g. Freigeben, Ablehnen).
 * Action button clicks never trigger the row's `rowClick` output.
 */
export interface TableAction {
  /** Unique identifier emitted with the {@link ActionClickEvent} */
  key: string;
  /** Visible button label (omit for icon-only buttons when an `icon` is set) */
  label?: string;
  /** Optional icon name rendered before the label */
  icon?: string;
  /** Button variant (default: 'ghost') */
  variant?: ButtonVariant;
  /** Optional tooltip / aria-label, useful for icon-only actions */
  tooltip?: string;
  /** Hide this action for specific rows */
  hidden?: (row: Record<string, unknown>, rowIndex: number) => boolean;
  /** Disable this action for specific rows */
  disabled?: (row: Record<string, unknown>, rowIndex: number) => boolean;
}

export type TableActionsAlign = 'start' | 'center' | 'end';

export interface ActionClickEvent {
  action: string;
  row: Record<string, unknown>;
  rowIndex: number;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

export interface CellEditEvent {
  row: Record<string, unknown>;
  column: string;
  oldValue: unknown;
  newValue: unknown;
  /** Index of `row` in the `data` input (not its position on screen). */
  rowIndex: number;
}

export interface SelectionChangeEvent {
  selected: Record<string, unknown>[];
  allSelected: boolean;
}

/** Emitted when a parent (group) row is expanded or collapsed in tree mode. */
export interface RowToggleEvent {
  id: string;
  expanded: boolean;
  row: Record<string, unknown>;
}

/**
 * Configuration that enables hierarchical (tree / grouped) rows. Mirrors the
 * discrete `idKey` / `parentKey` / `treeColumn` inputs and is exported for
 * consumers that prefer to pass a single config object around.
 */
export interface TableTreeConfig {
  idKey: string;
  parentKey: string;
  treeColumn?: string;
}

export type TableVariant = 'default' | 'striped' | 'bordered';
export type TableSize = 'sm' | 'md' | 'lg';

/**
 * Internal, render-ready view-model for a single visible table row. In flat
 * mode every row is depth 0 with no tree adornments; in tree mode it carries
 * the disclosure / indentation / aria metadata for the row.
 */
interface DisplayRow {
  /** The underlying data object. */
  row: Record<string, unknown>;
  /**
   * The row's index into `data()` — in both modes. It is what action, class,
   * style and formatter callbacks receive as `rowIndex`, and what identifies
   * the row in `CellEditEvent`. (It used to be the *positional* index in flat
   * mode — page offset plus row position — which, once a sort or filter was
   * active, pointed at a different row of `data()` than the one on screen.)
   */
  absIndex: number;
  /**
   * What selection and inline editing are keyed by: the row's `idKey` value
   * when the table has one, otherwise the row object itself. Either survives a
   * re-sort, a filter and a page change; an id also survives the parent
   * replacing its data array with fresh objects.
   */
  key: unknown;
  /** Row id (tree mode only; `null` in flat mode). */
  id: string | null;
  /** Tree depth — 0 for roots and for every row in flat mode. */
  depth: number;
  /** 1-based depth, surfaced as `aria-level` in tree mode. */
  level: number;
  /** Whether this row has visible children (renders a chevron). */
  hasChildren: boolean;
  /** Whether this parent row is currently expanded. */
  expanded: boolean;
  /** 1-based position within its sibling group (`aria-posinset`). */
  posInSet: number;
  /** Size of its sibling group (`aria-setsize`). */
  setSize: number;
}

/**
 * Table component for displaying structured data in rows and columns.
 *
 * Features:
 * - Column-based sorting with sort direction indicators
 * - Variant styles (default, striped, bordered)
 * - Size presets (sm, md, lg)
 * - Hoverable row highlighting
 * - Per-column formatter callbacks for display values
 * - Per-cell class/style callbacks for conditional styling
 * - Custom cell templates via content projection
 * - Composed cells (e.g. avatar + badge + actions)
 * - Hierarchical "tree" rows (grouped / expandable) via `idKey` + `parentKey`
 * - Responsive horizontal scrolling
 * - Empty state text for no data
 * - Accessible with proper table semantics
 *
 * @example
 * ```html
 * <lc-table [columns]="columns" [data]="data" variant="striped" [hoverable]="true"
 *   (sort)="onSort($event)" (rowClick)="onRowClick($event)" />
 * ```
 *
 * @example
 * ```ts
 * columns: TableColumn[] = [
 *   {
 *     key: 'amount',
 *     label: 'Amount',
 *     formatter: (value) => new Intl.NumberFormat('de-DE', {
 *       style: 'currency',
 *       currency: 'EUR',
 *     }).format(Number(value ?? 0)),
 *   },
 * ];
 * ```
 */
@Component({
  selector: 'lc-table',
  standalone: true,
  imports: [NgTemplateOutlet, NgStyle, FormsModule, SelectComponent, InputComponent, ButtonComponent, IconComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  /** Custom cell templates */
  @ContentChildren(TableCellDirective) cellTemplates!: QueryList<TableCellDirective>;

  /** Array of column definitions */
  columns = input<TableColumn[]>([]);

  /** Array of data objects to display */
  data = input<Record<string, unknown>[]>([]);

  /** Visual variant of the table */
  variant = input<TableVariant>('default');

  /** Size of the table */
  size = input<TableSize>('md');

  /** Whether rows should highlight on hover */
  hoverable = input<boolean>(false);

  /** Whether table should be responsive (horizontal scroll on mobile) */
  responsive = input<boolean>(true);

  /** Text shown when data is empty */
  emptyText = input<string>('No data available');

  // -- Pagination --
  /** Enable pagination */
  paginate = input<boolean>(false);

  /** Rows per page */
  pageSize = input<number>(10);

  /** Available page size options */
  pageSizeOptions = input<number[]>([5, 10, 25, 50]);

  // -- Selection --
  /** Enable row selection checkboxes */
  selectable = input<boolean>(false);

  // -- Column Filters --
  /** Enable per-column text filters */
  filterable = input<boolean>(false);

  // -- Inline Editing --
  /** Enable inline cell editing on double-click */
  editable = input<boolean>(false);

  // -- Row Actions --
  /**
   * Row-level actions rendered in a trailing actions column (e.g. Freigeben / Ablehnen).
   * Clicking an action button does NOT trigger the row's `rowClick` output.
   */
  actions = input<TableAction[]>([]);

  /** Header label for the actions column */
  actionsLabel = input<string>('');

  /** Width of the actions column (e.g. '120px') */
  actionsWidth = input<string | undefined>(undefined);

  /** Horizontal alignment of the action buttons (and header label) within the cell */
  actionsAlign = input<TableActionsAlign>('start');

  // -- Tree / grouped rows --
  /**
   * Row field holding the unique id. Required (together with {@link parentKey})
   * to enable hierarchical "tree mode". Absent ⇒ today's flat table.
   */
  idKey = input<string | undefined>(undefined);

  /**
   * Row field referencing the parent row's id. Presence of both `idKey` and
   * `parentKey` enables tree mode. Rows with an absent/empty or unknown parent
   * id are treated as roots.
   */
  parentKey = input<string | undefined>(undefined);

  /** Column key the chevron + indentation attach to. Default: first column. */
  treeColumn = input<string | undefined>(undefined);

  /** Initial expand state for all parent rows when uncontrolled. Default: true. */
  defaultExpanded = input<boolean>(true);

  /**
   * Controlled set of expanded parent ids. When provided, the table renders
   * exactly these as expanded; combine with {@link expandedIdsChange} for
   * `[(expandedIds)]`. When omitted, expansion is uncontrolled and seeded by
   * {@link defaultExpanded}.
   */
  expandedIds = input<string[] | undefined>(undefined);

  /** Indentation per depth level, in px. Default: 20. */
  indentSize = input<number>(20);

  /** Emitted when a sortable column header is clicked */
  readonly sort = output<SortEvent>();

  /** Emitted when a row is clicked */
  readonly rowClick = output<Record<string, unknown>>();

  /** Emitted when a cell is edited */
  readonly cellEdit = output<CellEditEvent>();

  /** Emitted when row selection changes */
  readonly selectionChange = output<SelectionChangeEvent>();

  /** Emitted when a row action button is clicked */
  readonly actionClick = output<ActionClickEvent>();

  /** Emitted when a parent row is expanded/collapsed (tree mode). */
  readonly rowToggle = output<RowToggleEvent>();

  /** Emitted with the full list of expanded parent ids; enables `[(expandedIds)]`. */
  readonly expandedIdsChange = output<string[]>();

  // -- Internal state --
  protected currentSort = signal<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  /**
   * Effective page size. Seeded from the `pageSize` input (resetting if it
   * changes) and overridable by the user via the page-size dropdown.
   */
  protected internalPageSize = linkedSignal(() => this.pageSize());
  /**
   * Current page, kept within range: when the data shrinks or the page size
   * grows so that the page no longer exists, it moves back to the last one
   * (rather than showing an empty page captioned "31–30 of 30").
   */
  protected currentPage = linkedSignal<number, number>({
    source: () => this.totalPages(),
    computation: (total, previous) => Math.min(previous?.value ?? 0, total - 1),
  });
  /**
   * Selected row keys (see `DisplayRow.key`). Pruned when `data` changes, so
   * a key whose row is gone doesn't linger and count towards "all selected".
   */
  protected selectedRows = linkedSignal<Set<unknown>, Set<unknown>>({
    source: () => this.rowKeys(),
    computation: (keys, previous) => {
      if (!previous) return new Set<unknown>();
      const kept = new Set([...previous.value].filter((k) => keys.has(k)));
      return kept.size === previous.value.size ? previous.value : kept;
    },
  });
  protected columnFilters = signal<Record<string, string>>({});
  protected editingCell = signal<{ key: unknown; column: string } | null>(null);
  protected editValue = signal<string>('');

  /** The key of every row currently in `data()`. */
  private readonly rowKeys = computed(() => new Set(this.data().map((row) => this.rowKey(row))));

  /** See `DisplayRow.key`. */
  private rowKey(row: Record<string, unknown>): unknown {
    const idKey = this.idKey();
    return idKey ? String(row[idKey] ?? '') : row;
  }
  /** User expand/collapse overrides keyed by row id (uncontrolled mode). */
  private readonly expandOverrides = signal<Map<string, boolean>>(new Map());

  /**
   * Filtered data (applies column filters)
   */
  protected readonly filteredData = computed(() => {
    let items = this.data();
    const filters = this.columnFilters();

    if (this.filterable()) {
      for (const [key, value] of Object.entries(filters)) {
        if (value.trim()) {
          items = items.filter(row =>
            String(row[key] ?? '').toLowerCase().includes(value.toLowerCase())
          );
        }
      }
    }

    return items;
  });

  /** Comparator for the active sort, shared by flat sorting and tree sibling sorting. */
  private rowComparator(sortState: { column: string; direction: 'asc' | 'desc' }) {
    return (a: Record<string, unknown>, b: Record<string, unknown>): number => {
      const aVal = a[sortState.column];
      const bVal = b[sortState.column];
      let cmp = 0;
      if (aVal == null && bVal == null) cmp = 0;
      else if (aVal == null) cmp = -1;
      else if (bVal == null) cmp = 1;
      else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal));
      return sortState.direction === 'asc' ? cmp : -cmp;
    };
  }

  /**
   * Sorted data
   */
  protected readonly sortedData = computed(() => {
    const items = [...this.filteredData()];
    const sortState = this.currentSort();
    if (!sortState) return items;
    return items.sort(this.rowComparator(sortState));
  });

  /**
   * Paginated data (or all if pagination disabled). Flat mode only.
   */
  protected readonly displayData = computed(() => {
    const items = this.sortedData();
    if (!this.paginate()) return items;
    const ps = this.internalPageSize();
    const start = this.currentPage() * ps;
    return items.slice(start, start + ps);
  });

  // -- Tree / grouped rows -----------------------------------------------------

  /** Whether hierarchical tree mode is active. */
  protected readonly treeMode = computed(() => !!this.idKey() && !!this.parentKey());

  /** Column the chevron + indentation attach to (defaults to the first column). */
  protected readonly effectiveTreeColumn = computed(
    () => this.treeColumn() || this.columns()[0]?.key
  );

  /** Stable map of row object → its index in `data()` (row identity for tree mode). */
  private readonly dataIndexMap = computed(() => {
    const map = new Map<Record<string, unknown>, number>();
    this.data().forEach((row, i) => map.set(row, i));
    return map;
  });

  /** Parent → ordered children index built from `idKey`/`parentKey`. */
  private readonly treeBuild = computed(() => {
    const idKey = this.idKey();
    const parentKey = this.parentKey();
    const byId = new Map<string, Record<string, unknown>>();
    const childrenOf = new Map<string, Record<string, unknown>[]>();
    const roots: Record<string, unknown>[] = [];
    if (!idKey || !parentKey) return { byId, childrenOf, roots };

    const rows = this.data();
    for (const row of rows) {
      const id = String(row[idKey] ?? '');
      if (id) byId.set(id, row);
    }
    for (const row of rows) {
      const parentRaw = row[parentKey];
      const parentId = parentRaw == null ? '' : String(parentRaw);
      if (parentId && byId.has(parentId)) {
        const siblings = childrenOf.get(parentId) ?? [];
        siblings.push(row);
        childrenOf.set(parentId, siblings);
      } else {
        // No parent, empty parent, or orphaned (unknown parent) ⇒ root.
        roots.push(row);
      }
    }
    return { byId, childrenOf, roots };
  });

  /**
   * Tree restricted to rows that match the active filters together with their
   * ancestor chain (so the path to a match stays visible).
   */
  private readonly treeFiltered = computed(() => {
    const { byId, childrenOf, roots } = this.treeBuild();
    const parentKey = this.parentKey();
    const filters = this.columnFilters();
    const active =
      this.filterable() && parentKey && Object.values(filters).some((v) => v.trim());
    if (!active) return { childrenOf, roots };

    const matches = (row: Record<string, unknown>): boolean =>
      Object.entries(filters).every(
        ([key, value]) =>
          !value.trim() ||
          String(row[key] ?? '').toLowerCase().includes(value.toLowerCase())
      );

    // Visible = every matching row plus all of its ancestors.
    const visible = new Set<Record<string, unknown>>();
    for (const row of this.data()) {
      if (!matches(row)) continue;
      let current: Record<string, unknown> | undefined = row;
      while (current && !visible.has(current)) {
        visible.add(current);
        const parentRaw: unknown = current[parentKey];
        const parentId = parentRaw == null ? '' : String(parentRaw);
        current = parentId ? byId.get(parentId) : undefined;
      }
    }

    const visibleChildrenOf = new Map<string, Record<string, unknown>[]>();
    const visibleRoots: Record<string, unknown>[] = [];
    for (const row of this.data()) {
      if (!visible.has(row)) continue;
      const parentRaw = row[parentKey];
      const parentId = parentRaw == null ? '' : String(parentRaw);
      const parent = parentId ? byId.get(parentId) : undefined;
      if (parent && visible.has(parent)) {
        const siblings = visibleChildrenOf.get(parentId) ?? [];
        siblings.push(row);
        visibleChildrenOf.set(parentId, siblings);
      } else {
        visibleRoots.push(row);
      }
    }
    return { childrenOf: visibleChildrenOf, roots: visibleRoots };
  });

  /** Tree with each sibling group sorted by the active sort (structure kept intact). */
  private readonly treeSorted = computed(() => {
    const { childrenOf, roots } = this.treeFiltered();
    const sortState = this.currentSort();
    if (!sortState) return { childrenOf, roots };
    const cmp = this.rowComparator(sortState);
    const sortedChildrenOf = new Map<string, Record<string, unknown>[]>();
    for (const [parentId, siblings] of childrenOf) {
      sortedChildrenOf.set(parentId, [...siblings].sort(cmp));
    }
    return { childrenOf: sortedChildrenOf, roots: [...roots].sort(cmp) };
  });

  /** Root rows after filter/sort — the unit of pagination in tree mode. */
  private readonly treeRoots = computed(() => this.treeSorted().roots);

  /**
   * Render-ready rows. In flat mode this wraps the existing paginated data; in
   * tree mode it paginates roots and flattens each visible (expanded) subtree.
   */
  protected readonly displayRows = computed<DisplayRow[]>(() => {
    const dataIndex = this.dataIndexMap();
    if (!this.treeMode()) {
      return this.displayData().map((row) => ({
        row,
        absIndex: dataIndex.get(row) ?? -1,
        key: this.rowKey(row),
        id: null,
        depth: 0,
        level: 0,
        hasChildren: false,
        expanded: false,
        posInSet: 0,
        setSize: 0,
      }));
    }

    const idKey = this.idKey() as string;
    const { childrenOf } = this.treeSorted();
    let roots = this.treeRoots();
    if (this.paginate()) {
      const ps = this.internalPageSize();
      const start = this.currentPage() * ps;
      roots = roots.slice(start, start + ps);
    }

    const out: DisplayRow[] = [];
    const walk = (group: Record<string, unknown>[], depth: number): void => {
      group.forEach((row, idx) => {
        const id = String(row[idKey] ?? '');
        const children = childrenOf.get(id) ?? [];
        const hasChildren = children.length > 0;
        const expanded = hasChildren && this.isExpanded(id);
        out.push({
          row,
          absIndex: dataIndex.get(row) ?? -1,
          key: this.rowKey(row),
          id,
          depth,
          level: depth + 1,
          hasChildren,
          expanded,
          posInSet: idx + 1,
          setSize: group.length,
        });
        if (expanded) walk(children, depth + 1);
      });
    };
    walk(roots, 0);
    return out;
  });

  /** Total pages */
  protected readonly totalPages = computed(() => {
    if (!this.paginate()) return 1;
    const total = this.treeMode() ? this.treeRoots().length : this.filteredData().length;
    return Math.max(1, Math.ceil(total / this.internalPageSize()));
  });

  /**
   * Pagination row count. Tree mode counts root rows (the paginated unit); flat
   * mode counts filtered rows.
   */
  protected readonly totalRows = computed(() =>
    this.treeMode() ? this.treeRoots().length : this.filteredData().length
  );

  /** Whether all visible rows are selected */
  protected readonly allSelected = computed(() => {
    const rows = this.displayRows();
    if (rows.length === 0) return false;
    const selected = this.selectedRows();
    return rows.every((r) => selected.has(r.key));
  });

  /** Whether some, but not all, visible rows are selected — the header box's mixed state. */
  protected readonly someSelected = computed(() => {
    const selected = this.selectedRows();
    return !this.allSelected() && this.displayRows().some((r) => selected.has(r.key));
  });

  protected readonly pageSizeSelectOptions = computed(() =>
    this.pageSizeOptions().map((opt) => ({
      value: opt,
      label: `${opt} / page`,
    }))
  );

  /**
   * Computed CSS classes for the table element
   */
  tableClasses = computed(() => {
    const classes = ['lc-table'];
    classes.push(`lc-table--${this.variant()}`);
    classes.push(`lc-table--${this.size()}`);
    if (this.hoverable()) classes.push('lc-table--hoverable');
    return classes.join(' ');
  });

  /**
   * Computed CSS classes for the wrapper element
   */
  wrapperClasses = computed(() => {
    const classes = ['lc-table-wrapper'];
    if (this.responsive()) classes.push('lc-table-wrapper--responsive');
    return classes.join(' ');
  });

  // -- Sort --
  handleSort(columnKey: string): void {
    const column = this.columns().find((col) => col.key === columnKey);
    if (!column || !column.sortable) return;

    const current = this.currentSort();
    let direction: 'asc' | 'desc' = 'asc';
    if (current && current.column === columnKey) {
      direction = current.direction === 'asc' ? 'desc' : 'asc';
    }

    this.currentSort.set({ column: columnKey, direction });
    this.sort.emit({ column: columnKey, direction });
  }

  getSortState(columnKey: string): 'asc' | 'desc' | null {
    const current = this.currentSort();
    if (current && current.column === columnKey) return current.direction;
    return null;
  }

  getAriaSort(columnKey: string): string | null {
    const sortState = this.getSortState(columnKey);
    if (sortState === 'asc') return 'ascending';
    if (sortState === 'desc') return 'descending';
    return null;
  }

  getHeaderClasses(column: TableColumn): string {
    const classes: string[] = [];
    if (column.sortable) classes.push('sortable');
    const sortState = this.getSortState(column.key);
    if (sortState) classes.push(`sorted-${sortState}`);
    return classes.join(' ');
  }

  getCellValue(row: Record<string, unknown>, columnKey: string): unknown {
    return row[columnKey];
  }

  getFormattedCellValue(
    row: Record<string, unknown>,
    column: TableColumn,
    rowIndex: number
  ): unknown {
    const value = this.getCellValue(row, column.key);
    if (!column.formatter) return value;

    return column.formatter(value, row, column, rowIndex);
  }

  getCellClasses(
    row: Record<string, unknown>,
    column: TableColumn,
    rowIndex: number
  ): string {
    const classes: string[] = [];
    if (column.cssClass) classes.push(column.cssClass);

    if (typeof column.cellClass === 'string') {
      classes.push(column.cellClass);
    } else if (typeof column.cellClass === 'function') {
      const resolved = column.cellClass(
        this.getCellValue(row, column.key),
        row,
        column,
        rowIndex
      );
      if (resolved) classes.push(resolved);
    }

    return classes.join(' ').trim();
  }

  getCellStyles(
    row: Record<string, unknown>,
    column: TableColumn,
    rowIndex: number
  ): Record<string, string> | null {
    if (!column.cellStyle) return null;

    if (typeof column.cellStyle === 'function') {
      return column.cellStyle(
        this.getCellValue(row, column.key),
        row,
        column,
        rowIndex
      );
    }

    return column.cellStyle;
  }

  /** Whether the given column is the disclosure/indent column in tree mode. */
  protected isTreeColumn(columnKey: string): boolean {
    return this.treeMode() && columnKey === this.effectiveTreeColumn();
  }

  /** Indent levels to render before a row's chevron (one guide per ancestor depth). */
  protected indentLevels(depth: number): number[] {
    return Array.from({ length: depth }, (_, i) => i);
  }

  /** Accessible name for a row's disclosure button (the tree column's value). */
  protected treeCellLabel(row: Record<string, unknown>): string {
    const col = this.effectiveTreeColumn();
    return col ? String(row[col] ?? '') : '';
  }

  getCellTemplate(columnKey: string): TableCellDirective | undefined {
    return this.cellTemplates?.find((template) => template.columnKey() === columnKey);
  }

  hasCustomTemplate(columnKey: string): boolean {
    return !!this.getCellTemplate(columnKey);
  }

  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }

  // -- Row Actions --
  /** Whether the trailing actions column should be rendered */
  protected readonly hasActions = computed(() => this.actions().length > 0);

  protected isActionHidden(
    action: TableAction,
    row: Record<string, unknown>,
    rowIndex: number
  ): boolean {
    return action.hidden ? action.hidden(row, rowIndex) : false;
  }

  protected isActionDisabled(
    action: TableAction,
    row: Record<string, unknown>,
    rowIndex: number
  ): boolean {
    return action.disabled ? action.disabled(row, rowIndex) : false;
  }

  /**
   * Handles an action button click. The DOM click is stopped from propagating
   * (see template `$event.stopPropagation()`), so the row's `rowClick` never fires.
   */
  protected onActionClick(
    action: TableAction,
    row: Record<string, unknown>,
    rowIndex: number
  ): void {
    this.actionClick.emit({
      action: action.key,
      row,
      rowIndex,
    });
  }

  // -- Tree keyboard model -----------------------------------------------------
  // `role="treegrid"` promises a composite widget: one tab stop, arrows to move
  // between rows, Right/Left to open/close a group or step into/out of it. The
  // rows carry a roving tabindex; the focused row is remembered by key so it
  // survives re-renders, and falls back to the first row when it is gone.

  private readonly rowEls = viewChildren<ElementRef<HTMLTableRowElement>>('dataRow');
  private readonly focusedRowKey = signal<unknown>(null);

  /** Key of the row that holds the tab stop. */
  private readonly effectiveFocusedKey = computed(() => {
    const rows = this.displayRows();
    const key = this.focusedRowKey();
    return rows.some((r) => r.key === key) ? key : rows[0]?.key;
  });

  protected rowTabindex(dr: DisplayRow): number | null {
    if (!this.treeMode()) return null;
    return dr.key === this.effectiveFocusedKey() ? 0 : -1;
  }

  protected onRowFocus(dr: DisplayRow): void {
    if (this.treeMode()) this.focusedRowKey.set(dr.key);
  }

  protected onRowKeydown(event: KeyboardEvent, dr: DisplayRow): void {
    if (!this.treeMode()) return;
    // Keys typed into an inline editor or the row's own controls are theirs.
    if ((event.target as HTMLElement).tagName === 'INPUT') return;
    const rows = this.displayRows();
    const index = rows.findIndex((r) => r.key === dr.key);
    if (index < 0) return;

    switch (event.key) {
      case 'ArrowDown':
        this.focusRow(index + 1);
        break;
      case 'ArrowUp':
        this.focusRow(index - 1);
        break;
      case 'Home':
        this.focusRow(0);
        break;
      case 'End':
        this.focusRow(rows.length - 1);
        break;
      case 'ArrowRight':
        if (!dr.hasChildren) return;
        if (dr.expanded) this.focusRow(index + 1); // first child
        else if (dr.id) this.toggleRow(dr.id, dr.row);
        break;
      case 'ArrowLeft':
        if (dr.hasChildren && dr.expanded && dr.id) {
          this.toggleRow(dr.id, dr.row);
        } else if (dr.depth > 0) {
          // Step out to the parent: the nearest row above with a smaller depth.
          for (let i = index - 1; i >= 0; i--) {
            if (rows[i].depth < dr.depth) {
              this.focusRow(i);
              break;
            }
          }
        } else {
          return;
        }
        break;
      case 'Enter':
        this.rowClick.emit(dr.row);
        break;
      case ' ':
        if (!this.selectable()) return;
        this.toggleRowSelect(dr.row);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private focusRow(index: number): void {
    const rows = this.displayRows();
    if (index < 0 || index >= rows.length) return;
    this.focusedRowKey.set(rows[index].key);
    this.rowEls()[index]?.nativeElement.focus();
  }

  // -- Tree expand / collapse --------------------------------------------------

  /** Whether the parent row with the given id is currently expanded. */
  protected isExpanded(id: string): boolean {
    const controlled = this.expandedIds();
    if (controlled !== undefined) return controlled.includes(id);
    const override = this.expandOverrides().get(id);
    if (override !== undefined) return override;
    return this.defaultExpanded();
  }

  /** Chevron click: toggle expand state without triggering the row click. */
  protected onChevronClick(displayRow: DisplayRow, event: Event): void {
    event.stopPropagation();
    if (displayRow.id) this.toggleRow(displayRow.id, displayRow.row);
  }

  private toggleRow(id: string, row: Record<string, unknown>): void {
    const expanded = !this.isExpanded(id);
    this.expandOverrides.update((map) => {
      const next = new Map(map);
      next.set(id, expanded);
      return next;
    });
    this.rowToggle.emit({ id, expanded, row });
    this.expandedIdsChange.emit(this.nextExpandedIds(id, expanded));
  }

  /** The full list of expanded parent ids after applying a single toggle. */
  private nextExpandedIds(changedId: string, changedExpanded: boolean): string[] {
    const controlled = this.expandedIds();
    const overrides = this.expandOverrides();
    const parentIds = Array.from(this.treeBuild().childrenOf.keys());
    return parentIds.filter((pid) => {
      if (pid === changedId) return changedExpanded;
      if (controlled !== undefined) return controlled.includes(pid);
      const override = overrides.get(pid);
      return override !== undefined ? override : this.defaultExpanded();
    });
  }

  // -- Pagination --
  protected goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  protected onPageSizeChange(event: Event): void {
    const newSize = Number((event.target as HTMLSelectElement).value);
    this.internalPageSize.set(newSize);
    this.currentPage.set(0);
  }

  protected onPageSizeModelChange(value: string | number | null): void {
    if (value == null) {
      return;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.internalPageSize.set(parsed);
    this.currentPage.set(0);
  }

  protected get paginationStart(): number {
    if (this.totalRows() === 0) return 0;
    return this.currentPage() * this.internalPageSize() + 1;
  }

  protected get paginationEnd(): number {
    return Math.min((this.currentPage() + 1) * this.internalPageSize(), this.totalRows());
  }

  // -- Selection --
  // Keyed by row identity (see `DisplayRow.key`), never by position: a sort or
  // filter changes where a row is shown, not which row it is.
  protected toggleSelectAll(): void {
    const selected = new Set(this.selectedRows());
    const rows = this.displayRows();
    const allSelected = this.allSelected();

    rows.forEach((r) => {
      if (allSelected) selected.delete(r.key);
      else selected.add(r.key);
    });

    this.selectedRows.set(selected);
    this.emitSelectionChange();
  }

  protected toggleRowSelect(row: Record<string, unknown>): void {
    const key = this.rowKey(row);
    const selected = new Set(this.selectedRows());
    if (selected.has(key)) selected.delete(key);
    else selected.add(key);
    this.selectedRows.set(selected);
    this.emitSelectionChange();
  }

  protected isRowSelected(row: Record<string, unknown>): boolean {
    return this.selectedRows().has(this.rowKey(row));
  }

  private emitSelectionChange(): void {
    const keys = this.selectedRows();
    // In data order, so the consumer gets a stable list whatever the sort.
    const selected = this.data().filter((row) => keys.has(this.rowKey(row)));
    this.selectionChange.emit({ selected, allSelected: this.allSelected() });
  }

  // -- Column Filters --
  protected onFilterChange(columnKey: string, value: string): void {
    const filters = { ...this.columnFilters(), [columnKey]: value };
    this.columnFilters.set(filters);
    this.currentPage.set(0);
  }

  protected getFilterValue(columnKey: string): string {
    return this.columnFilters()[columnKey] || '';
  }

  // -- Inline Editing --
  // Keyed by row identity too — the edited cell is the one the user clicked,
  // whichever position sorting put it in.
  protected startEdit(row: Record<string, unknown>, column: string, currentValue: unknown): void {
    if (!this.editable()) return;
    const col = this.columns().find(c => c.key === column);
    if (col && col.editable === false) return;
    this.editingCell.set({ key: this.rowKey(row), column });
    this.editValue.set(String(currentValue ?? ''));
  }

  protected isEditing(row: Record<string, unknown>, column: string): boolean {
    const cell = this.editingCell();
    return cell !== null && cell.key === this.rowKey(row) && cell.column === column;
  }

  protected commitEdit(row: Record<string, unknown>, column: string): void {
    // Only the cell being edited commits: the input's blur arrives after Enter
    // or Escape already ended the edit, and must not commit (or re-commit).
    if (!this.isEditing(row, column)) return;
    const oldValue = row[column];
    const newValue = this.editValue();
    this.editingCell.set(null);
    this.editValue.set('');
    if (String(oldValue ?? '') !== newValue) {
      const rowIndex = this.dataIndexMap().get(row) ?? -1;
      this.cellEdit.emit({ row, column, oldValue, newValue, rowIndex });
    }
  }

  protected cancelEdit(): void {
    this.editingCell.set(null);
    this.editValue.set('');
  }

  protected onEditKeydown(event: KeyboardEvent, row: Record<string, unknown>, column: string): void {
    if (event.key === 'Enter') {
      this.commitEdit(row, column);
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  /** Enter/Space on a focused sortable header sorts, like a click does. */
  protected onHeaderKeydown(event: KeyboardEvent, columnKey: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleSort(columnKey);
    }
  }

  protected getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
