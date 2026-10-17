import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { LineChartComponent } from '@lifecorner/angular-ui-kit/line-chart';
import { ModalComponent } from '@lifecorner/angular-ui-kit/modal';
import { TableComponent, type TableColumn } from '@lifecorner/angular-ui-kit/table';

/** The lazy route without lc-markdown, for an app without `mermaid` installed (AC-26). */
@Component({
  selector: 'lc-entries-reports',
  imports: [LineChartComponent, ModalComponent, TableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-line-chart [series]="[{ label: 'S', data: [1, 3, 2] }]" [labels]="['a', 'b', 'c']" />
    <lc-table [columns]="columns" [data]="rows" />
    <lc-modal title="Details" [open]="open()" (openChange)="open.set($event)">Mehr</lc-modal>
  `,
})
export class Reports {
  protected readonly open = signal(false);
  protected readonly columns: TableColumn[] = [{ key: 'name', label: 'Name' }];
  protected readonly rows = [{ name: 'Strom' }];
}
