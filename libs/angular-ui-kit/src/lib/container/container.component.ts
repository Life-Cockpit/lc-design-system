import { Component, input, computed, HostBinding, ChangeDetectionStrategy } from '@angular/core';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';

@Component({
  selector: 'lc-container',
  standalone: true,
  imports: [],
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Container component for responsive max-width content layout.
 *
 * Features:
 * - Max-width presets (sm, md, lg, xl, xxl, full)
 * - Optional horizontal padding removal
 * - Optional vertical padding
 * - Centered content alignment
 *
 * `xxl` caps at the `--lc-content-max-width` token (1536px) — the widest step
 * before `full`, for data-dense pages that `xl` squeezes but `full` stretches
 * across ultrawide displays.
 *
 * @example
 * ```html
 * <lc-container size="lg">Content here</lc-container>
 * ```
 */
export class ContainerComponent {
  size = input<ContainerSize>('lg');
  noPadding = input<boolean>(false);
  paddingY = input<boolean>(false);

  @HostBinding('class')
  get hostClasses(): string {
    return this.classes();
  }

  classes = computed(() => {
    const classes: string[] = ['mx-auto'];

    // Semantic size class
    classes.push(`container-${this.size()}`);

    // Size/Max-width — sm…xl map onto Tailwind's screen scale. `xxl` is capped
    // in SCSS from the --lc-content-max-width token so apps can retune both the
    // container and their own shell from one place; `full` stays uncapped.
    const sizeMap: Partial<Record<ContainerSize, string>> = {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
    };
    const maxWidthClass = sizeMap[this.size()];
    if (maxWidthClass) {
      classes.push(maxWidthClass);
    }

    // Padding
    if (!this.noPadding()) {
      classes.push('px-4', 'sm:px-6', 'lg:px-8');

      if (this.paddingY()) {
        classes.push('py-6');
      }
    }

    return classes.join(' ');
  });
}
