import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';

/**
 * Container component for responsive max-width content layout.
 *
 * Features:
 * - Max-width presets (sm, md, lg, xl, xxl, full)
 * - Optional horizontal padding removal
 * - Optional vertical padding
 * - Centered content alignment
 *
 * All layout comes from the component's own stylesheet (no Tailwind
 * utilities): `sm…xl` map onto the 640/768/1024/1280px screen scale, `xxl`
 * caps at the `--lc-content-max-width` token (1536px) — the widest step
 * before `full`, for data-dense pages that `xl` squeezes but `full` stretches
 * across ultrawide displays. Padding follows the `--lc-density-padding-*`
 * tokens and steps up at 640px / 1024px.
 *
 * @example
 * ```html
 * <lc-container size="lg">Content here</lc-container>
 * ```
 */
@Component({
  selector: 'lc-container',
  standalone: true,
  imports: [],
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
  },
})
export class ContainerComponent {
  readonly size = input<ContainerSize>('lg');
  readonly noPadding = input<boolean>(false);
  readonly paddingY = input<boolean>(false);

  readonly classes = computed(() => {
    // Semantic size class — max-width, centring and padding are all resolved
    // by the matching `:host(.container-*)` rules in container.component.scss.
    const classes: string[] = [`container-${this.size()}`];

    if (this.noPadding()) {
      classes.push('container--no-padding');
    } else if (this.paddingY()) {
      classes.push('container--padding-y');
    }

    return classes.join(' ');
  });
}
