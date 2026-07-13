import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';

/** Emphasis treatment applied to a row's value. */
export type DescriptionListEmphasis =
  | 'default'
  | 'strong'
  | 'muted'
  | 'primary';

export interface DescriptionListItem {
  /** Label shown on the term side of the row. */
  term: string;
  /** Value shown on the description side of the row. */
  value: string;
  /** Optional link — renders the value as an anchor. */
  href?: string;
  /** Optional visual emphasis for the value. @default 'default' */
  emphasis?: DescriptionListEmphasis;
  /** Optional opaque payload echoed back in `itemClick`. */
  id?: string;
}

export type DescriptionListLayout = 'rows' | 'stacked';
export type DescriptionListSize = 'sm' | 'md';

/**
 * Description list for key/value metadata (a styled `<dl>`).
 *
 * Features:
 * - `rows` layout: term on the left, value on the right, with an optional
 *   dotted leader line connecting them (the DS2.0 "spec sheet" look).
 * - `stacked` layout: term above value, for narrow columns.
 * - Per-row value emphasis and optional links.
 * - Semantic markup (`<dl>`/`<dt>`/`<dd>`) for accessibility.
 *
 * @example
 * ```html
 * <lc-description-list
 *   [items]="[
 *     { term: 'Repository', value: 'example/project', href: '#', emphasis: 'primary' },
 *     { term: 'Access', value: 'Token stored · read only' },
 *     { term: 'Status', value: 'Maintained', emphasis: 'strong' }
 *   ]"
 *   [leaders]="true" />
 * ```
 */
@Component({
  selector: 'lc-description-list',
  standalone: true,
  templateUrl: './description-list.component.html',
  styleUrls: ['./description-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionListComponent {
  /** Rows to render. */
  readonly items = input.required<readonly DescriptionListItem[]>();

  /**
   * Row layout.
   * - rows: term left / value right (default)
   * - stacked: term above value
   * @default 'rows'
   */
  readonly layout = input<DescriptionListLayout>('rows');

  /**
   * Draw a dotted leader line between term and value. Only applies to the
   * `rows` layout.
   * @default false
   */
  readonly leaders = input<boolean>(false);

  /** Density of the rows. @default 'md' */
  readonly size = input<DescriptionListSize>('md');

  /** Emitted when a row is clicked. */
  readonly itemClick = output<DescriptionListItem>();

  protected readonly hostClasses = computed(() =>
    [
      'lc-dl',
      `lc-dl--${this.layout()}`,
      `lc-dl--${this.size()}`,
      this.leaders() && this.layout() === 'rows' ? 'lc-dl--leaders' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  protected valueClass(item: DescriptionListItem): string {
    return `lc-dl__value lc-dl__value--${item.emphasis ?? 'default'}`;
  }
}
