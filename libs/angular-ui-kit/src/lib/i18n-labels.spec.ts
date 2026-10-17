import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AlertComponent } from './alert/alert.component';
import { CalloutComponent } from './callout/callout.component';
import { ChipComponent } from './chip/chip.component';
import { DrawerComponent } from './drawer/drawer.component';
import { ModalComponent } from './modal/modal.component';
import { ToastComponent } from './toast/toast.component';
import { ToastOutletComponent } from './toast/toast-outlet.component';
import { ToastService } from './toast/toast.service';
import { NumberInputComponent } from './number-input/number-input.component';
import { SearchInputComponent } from './search-input/search-input.component';
import { InputComponent } from './input/input.component';
import { SelectComponent } from './select/select.component';
import { ComboboxComponent } from './combobox/combobox.component';
import { DateRangePickerComponent } from './date-range-picker/date-range-picker.component';
import { DatepickerComponent } from './datepicker/datepicker.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { TreeViewComponent } from './tree-view/tree-view.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { KanbanBoardComponent } from './kanban-board/kanban-board.component';
import { CodeBlockComponent } from './code-block/code-block.component';
import { ChatComponent } from './chat/chat.component';
import { LogViewerComponent } from './log-viewer/log-viewer.component';
import { MarkdownComponent } from './markdown/markdown.component';
import { NotificationCenterComponent } from './notification-center/notification-center.component';
import { GalleryComponent } from './gallery/gallery.component';
import { DocumentViewerComponent } from './document-viewer/document-viewer.component';
import { DependencyViewerComponent } from './dependency-viewer/dependency-viewer.component';
import { RichTextEditorComponent } from './rich-text-editor/rich-text-editor.component';
import { PasswordInputComponent } from './password-input/password-input.component';
import { EmailInputComponent } from './email-input/email-input.component';
import { TagInputComponent } from './tag-input/tag-input.component';
import { ErrorDisplayComponent } from './error-display/error-display.component';
import { RatingComponent } from './rating/rating.component';
import { TableComponent } from './table/table.component';
import { VerificationCodeInputComponent } from './verification-code-input/verification-code-input.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { FilterBarComponent } from './filter-bar/filter-bar.component';

/**
 * Every built-in text of the kit is an input whose default is the text it
 * always had (item 3 of 3.2). Each block checks the default and that an
 * override reaches the DOM.
 */

function create<T>(component: Type<T>, inputs: Record<string, unknown> = {}): ComponentFixture<T> {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideHttpClient(withXhr()), provideRouter([])],
  });
  const fixture = TestBed.createComponent(component);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
  return fixture;
}

function set<T>(fixture: ComponentFixture<T>, inputs: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
}

const attr = (root: HTMLElement, selector: string, name = 'aria-label') =>
  root.querySelector(selector)?.getAttribute(name) ?? null;
const text = (root: HTMLElement, selector: string) =>
  root.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
// Text lives in the overlay container for CDK-overlay panels.
const overlay = () => document.querySelector('.cdk-overlay-container') as HTMLElement;

describe('Translatable labels (i18n)', () => {
  beforeAll(() => {
    // jsdom has no matchMedia (lc-sidenav follows the viewport).
    window.matchMedia ??= ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    document.querySelector('.cdk-overlay-container')?.replaceChildren();
  });

  it('lc-alert: closeAriaLabel', () => {
    const f = create(AlertComponent, { dismissible: true });
    expect(attr(f.nativeElement, '.lc-alert__close')).toBe('Close alert');
    set(f, { closeAriaLabel: 'Hinweis schließen' });
    expect(attr(f.nativeElement, '.lc-alert__close')).toBe('Hinweis schließen');
  });

  it('lc-callout: dismissAriaLabel', () => {
    const f = create(CalloutComponent, { dismissible: true });
    expect(attr(f.nativeElement, '.callout__dismiss')).toBe('Dismiss');
    set(f, { dismissAriaLabel: 'Ausblenden' });
    expect(attr(f.nativeElement, '.callout__dismiss')).toBe('Ausblenden');
  });

  it('lc-chip: removeAriaLabel', () => {
    const f = create(ChipComponent, { removable: true });
    expect(attr(f.nativeElement, '.lc-chip__delete')).toBe('Remove chip');
    set(f, { removeAriaLabel: 'Entfernen' });
    expect(attr(f.nativeElement, '.lc-chip__delete')).toBe('Entfernen');
  });

  it('lc-drawer: closeAriaLabel (G-14), with and without a heading', () => {
    const f = create(DrawerComponent, { open: true, heading: 'Filter' });
    expect(attr(document.body, '.lc-drawer__close')).toBe('Close drawer');
    set(f, { closeAriaLabel: 'Schließen' });
    expect(attr(document.body, '.lc-drawer__close')).toBe('Schließen');
    set(f, { heading: '' });
    expect(attr(document.body, '.lc-drawer__close--floating')).toBe('Schließen');
  });

  it('lc-modal: closeAriaLabel', () => {
    const f = create(ModalComponent, { open: true });
    expect(attr(document.body, '.lc-modal__close')).toBe('Close modal');
    set(f, { closeAriaLabel: 'Dialog schließen' });
    expect(attr(document.body, '.lc-modal__close')).toBe('Dialog schließen');
  });

  it('lc-toast: closeAriaLabel, also forwarded by lc-toast-outlet', () => {
    const f = create(ToastComponent, {
      toast: { id: 't', message: 'Gespeichert', variant: 'success', position: 'top-right', showCloseButton: true },
    });
    expect(attr(f.nativeElement, '.lc-toast__close')).toBe('Close notification');
    set(f, { closeAriaLabel: 'Meldung schließen' });
    expect(attr(f.nativeElement, '.lc-toast__close')).toBe('Meldung schließen');

    TestBed.resetTestingModule();
    const outlet = create(ToastOutletComponent, { closeAriaLabel: 'Meldung schließen' });
    TestBed.inject(ToastService).show({ message: 'Gespeichert', variant: 'success', showCloseButton: true, duration: 0 });
    outlet.detectChanges();
    expect(attr(outlet.nativeElement, '.lc-toast__close')).toBe('Meldung schließen');
  });

  it('lc-number-input: decrementAriaLabel / incrementAriaLabel', () => {
    const f = create(NumberInputComponent);
    expect(attr(f.nativeElement, '.number-input__button--decrement')).toBe('Decrease value');
    expect(attr(f.nativeElement, '.number-input__button--increment')).toBe('Increase value');
    set(f, { decrementAriaLabel: 'Weniger', incrementAriaLabel: 'Mehr' });
    expect(attr(f.nativeElement, '.number-input__button--decrement')).toBe('Weniger');
    expect(attr(f.nativeElement, '.number-input__button--increment')).toBe('Mehr');
  });

  it('lc-search-input: clearAriaLabel', () => {
    const f = create(SearchInputComponent, { value: 'Strom' });
    expect(attr(f.nativeElement, '.search-input__clear')).toBe('Clear search');
    set(f, { clearAriaLabel: 'Suche leeren' });
    expect(attr(f.nativeElement, '.search-input__clear')).toBe('Suche leeren');
  });

  it('lc-input: requiredAriaLabel', () => {
    const f = create(InputComponent, { label: 'Name', required: true });
    expect(attr(f.nativeElement, '.required-indicator')).toBe('required');
    set(f, { requiredAriaLabel: 'Pflichtfeld' });
    expect(attr(f.nativeElement, '.required-indicator')).toBe('Pflichtfeld');
  });

  it('lc-select: clear, search and no-results labels', () => {
    const f = create(SelectComponent, { options: [{ value: 'a', label: 'Alpha' }], searchable: true });
    f.componentInstance.writeValue('a');
    f.detectChanges();
    expect(attr(f.nativeElement, '.lc-select__clear')).toBe('Clear selection');
    f.componentInstance.open();
    f.detectChanges();
    const search = overlay().querySelector('.lc-select__search-input') as HTMLInputElement;
    expect(search.placeholder).toBe('Search...');
    expect(search.getAttribute('aria-label')).toBe('Search options');
    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(text(overlay(), '.lc-select__option--no-results')).toBe('No options found');

    set(f, { clearAriaLabel: 'Auswahl löschen', searchPlaceholder: 'Suchen …', searchAriaLabel: 'Optionen durchsuchen', noOptionsLabel: 'Keine Treffer' });
    expect(search.placeholder).toBe('Suchen …');
    expect(search.getAttribute('aria-label')).toBe('Optionen durchsuchen');
    expect(text(overlay(), '.lc-select__option--no-results')).toBe('Keine Treffer');
    f.componentInstance.close();
    f.detectChanges();
    expect(attr(f.nativeElement, '.lc-select__clear')).toBe('Auswahl löschen');
  });

  it('lc-combobox: clearAriaLabel and createOptionLabel', () => {
    const f = create(ComboboxComponent, { options: [{ value: 'a', label: 'Alpha' }], allowCreate: true });
    f.componentInstance.writeValue({ value: 'a', label: 'Alpha' });
    f.detectChanges();
    expect(attr(f.nativeElement, '.lc-combobox__clear')).toBe('Clear');
    set(f, { clearAriaLabel: 'Leeren' });
    expect(attr(f.nativeElement, '.lc-combobox__clear')).toBe('Leeren');

    const cmp = f.componentInstance as unknown as { createOptionLabel: () => string; query: { set(q: string): void }; isOpen: { set(o: boolean): void } };
    expect(cmp.createOptionLabel()).toBe('Create');
    set(f, { createOptionLabel: 'Anlegen' });
    cmp.query.set('Neu');
    cmp.isOpen?.set(true);
    f.detectChanges();
    expect(text(overlay(), '.lc-combobox__option--create')).toBe('Anlegen "Neu"');
  });

  it('lc-date-range-picker: clear and month navigation labels', () => {
    const f = create(DateRangePickerComponent);
    f.componentInstance.writeValue({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 5) });
    f.detectChanges();
    expect(attr(f.nativeElement, '.lc-drp__clear')).toBe('Clear');
    (f.nativeElement.querySelector('.lc-drp__trigger, button') as HTMLButtonElement).click();
    f.detectChanges();
    const navs = [...f.nativeElement.querySelectorAll('.lc-drp__nav')] as HTMLElement[];
    expect(navs.map((n) => n.getAttribute('aria-label'))).toEqual(['Previous month', 'Next month']);
    set(f, { clearAriaLabel: 'Zurücksetzen', previousMonthAriaLabel: 'Vorheriger Monat', nextMonthAriaLabel: 'Nächster Monat' });
    expect(attr(f.nativeElement, '.lc-drp__clear')).toBe('Zurücksetzen');
    expect([...f.nativeElement.querySelectorAll('.lc-drp__nav')].map((n) => (n as HTMLElement).getAttribute('aria-label'))).toEqual([
      'Vorheriger Monat',
      'Nächster Monat',
    ]);
  });

  describe('lc-datepicker', () => {
    function openAt(inputs: Record<string, unknown> = {}) {
      const f = create(DatepickerComponent, inputs);
      f.componentInstance.writeValue(new Date(2026, 9, 10));
      f.componentInstance.open();
      f.detectChanges();
      return f;
    }
    const weekdays = () => [...overlay().querySelectorAll('.lc-datepicker-weekday')].map((d) => d.textContent?.trim());

    it('keeps English names, Sunday first and the English labels by default', () => {
      const f = openAt();
      expect(text(overlay(), '.lc-datepicker-month-year')).toBe('October 2026');
      expect(weekdays()).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
      expect(attr(overlay(), '.lc-datepicker-calendar')).toBe('Choose date');
      expect([...overlay().querySelectorAll('.lc-datepicker-nav-button')].map((b) => b.getAttribute('aria-label'))).toEqual([
        'Previous month',
        'Next month',
      ]);
      expect(text(overlay(), '.lc-datepicker-today-button')).toBe('Today');
      expect(attr(overlay(), '.lc-datepicker-day--selected')).toBe(`${new Date(2026, 9, 10).toDateString()}, selected`);
      // October 2026 starts on a Thursday: four days of September lead the grid.
      expect((overlay().querySelector('.lc-datepicker-day') as HTMLElement).textContent?.trim()).toBe('27');
      f.componentInstance.close();
      f.detectChanges();
      expect(attr(f.nativeElement, '.lc-datepicker-clear')).toBe('Clear date');
    });

    it('uses the locale for names and day labels, and firstDayOfWeek for the grid', () => {
      openAt({
        locale: 'de-DE',
        firstDayOfWeek: 1,
        dialogAriaLabel: 'Datum wählen',
        todayLabel: 'Heute',
        selectedAriaLabel: 'ausgewählt',
      });
      expect(text(overlay(), '.lc-datepicker-month-year')).toBe('Oktober 2026');
      expect(weekdays()).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
      expect(attr(overlay(), '.lc-datepicker-calendar')).toBe('Datum wählen');
      expect(text(overlay(), '.lc-datepicker-today-button')).toBe('Heute');
      expect(attr(overlay(), '.lc-datepicker-day--selected')).toBe('Samstag, 10. Oktober 2026, ausgewählt');
      // Monday first: three days of September lead the grid (28, 29, 30).
      expect((overlay().querySelector('.lc-datepicker-day') as HTMLElement).textContent?.trim()).toBe('28');
    });
  });

  it('lc-sidenav: toggle, collapse and close labels', () => {
    const f = create(SidenavComponent, { mode: 'docked', showLogo: true, items: [] });
    expect(attr(f.nativeElement, '.lc-sidenav__logo-link')).toBe('Toggle sidebar');
    expect(attr(f.nativeElement, '.lc-sidenav__logo-toggle')).toBe('Collapse navigation to the left');
    expect(attr(f.nativeElement, '.lc-sidenav__logo-toggle', 'title')).toBe('Collapse sidebar');
    set(f, { toggleAriaLabel: 'Seitenleiste umschalten', collapseAriaLabel: 'Navigation einklappen', collapseTitle: 'Einklappen' });
    expect(attr(f.nativeElement, '.lc-sidenav__logo-link')).toBe('Seitenleiste umschalten');
    expect(attr(f.nativeElement, '.lc-sidenav__logo-toggle')).toBe('Navigation einklappen');
    expect(attr(f.nativeElement, '.lc-sidenav__logo-toggle', 'title')).toBe('Einklappen');
    set(f, { mode: 'drawer', isOpen: true });
    const close = document.querySelector('.lc-sidenav__close') ?? f.nativeElement.querySelector('.lc-sidenav__close');
    expect(close?.getAttribute('aria-label')).toBe('Close navigation');
    set(f, { closeAriaLabel: 'Navigation schließen' });
    expect((document.querySelector('.lc-sidenav__close') ?? f.nativeElement.querySelector('.lc-sidenav__close'))?.getAttribute('aria-label')).toBe(
      'Navigation schließen',
    );
  });

  it('lc-spinner: loadingLabel', () => {
    const f = create(SpinnerComponent);
    expect(text(f.nativeElement, '.spinner__sr-only')).toBe('Loading');
    set(f, { loadingLabel: 'Lädt' });
    expect(text(f.nativeElement, '.spinner__sr-only')).toBe('Lädt');
  });

  it('lc-tree-view: toolbar and toggle labels', () => {
    const f = create(TreeViewComponent, { nodes: [{ name: 'src', children: [{ name: 'main.ts' }] }] });
    const tools = () => [...f.nativeElement.querySelectorAll('.lc-tree-view__tool-btn')].map((b) => (b as HTMLElement).textContent?.trim());
    expect(tools()).toEqual(['Expand all', 'Collapse all']);
    const toggle = () => f.nativeElement.querySelector('[aria-label="Expand"], [aria-label="Collapse"], [aria-label="Aufklappen"], [aria-label="Zuklappen"]');
    expect(['Expand', 'Collapse']).toContain(toggle()?.getAttribute('aria-label'));
    set(f, { expandAllLabel: 'Alle aufklappen', collapseAllLabel: 'Alle zuklappen', expandAriaLabel: 'Aufklappen', collapseAriaLabel: 'Zuklappen' });
    expect(tools()).toEqual(['Alle aufklappen', 'Alle zuklappen']);
    expect(['Aufklappen', 'Zuklappen']).toContain(toggle()?.getAttribute('aria-label'));
  });

  it('lc-file-upload: accepted, max size and remove labels', () => {
    const f = create(FileUploadComponent, { accept: '.pdf', maxSizeBytes: 1024 * 1024 });
    const lines = () => [...f.nativeElement.querySelectorAll('.file-upload__accept')].map((p) => (p as HTMLElement).textContent?.trim());
    expect(lines()).toEqual(['Accepted: .pdf', 'Max: 1.0 MB']);
    set(f, { acceptedLabel: 'Erlaubt:', maxSizeLabel: 'Höchstens:' });
    expect(lines()).toEqual(['Erlaubt: .pdf', 'Höchstens: 1.0 MB']);
    const cmp = f.componentInstance as unknown as { removeFileAriaLabel: () => string };
    expect(cmp.removeFileAriaLabel()).toBe('Remove file');
  });

  it('lc-kanban-board: empty column and priority labels', () => {
    const f = create(KanbanBoardComponent, {
      columns: [
        { id: 'a', title: 'Offen', cards: [] },
        { id: 'b', title: 'Erledigt', cards: [{ id: 'c', title: 'Karte', priority: 'high' }] },
      ],
    });
    expect(text(f.nativeElement, '.lc-kanban__empty')).toBe('Drop here');
    const cmp = f.componentInstance as unknown as { priorityAriaLabel: () => string };
    expect(cmp.priorityAriaLabel()).toBe('Priority:');
    set(f, { emptyColumnLabel: 'Hierher ziehen', priorityAriaLabel: 'Priorität:' });
    expect(text(f.nativeElement, '.lc-kanban__empty')).toBe('Hierher ziehen');
    const icon = f.debugElement.query((de) => de.nativeElement.classList?.contains('lc-kanban__card-priority'));
    expect((icon.componentInstance as { ariaLabel: () => string }).ariaLabel()).toBe('Priorität: high');
  });

  it('lc-code-block: copy labels', () => {
    const f = create(CodeBlockComponent, { code: 'const a = 1;' });
    expect(text(f.nativeElement, '.code-block__copy')).toBe('Copy');
    expect(attr(f.nativeElement, '.code-block__copy')).toBe('Copy code');
    set(f, { copyLabel: 'Kopieren', copyAriaLabel: 'Code kopieren', copiedLabel: 'Kopiert', copiedAnnouncement: 'In die Zwischenablage kopiert' });
    expect(text(f.nativeElement, '.code-block__copy')).toBe('Kopieren');
    expect(attr(f.nativeElement, '.code-block__copy')).toBe('Code kopieren');
    (f.componentInstance as unknown as { copied: { set(v: boolean): void } }).copied.set(true);
    f.detectChanges();
    expect(text(f.nativeElement, '.code-block__copy')).toBe('Kopiert');
    expect(attr(f.nativeElement, '.code-block__copy')).toBe('Kopiert');
    expect(text(f.nativeElement, '.code-block__live')).toBe('In die Zwischenablage kopiert');
  });

  it('lc-chat: locale of the times and every label', () => {
    const when = new Date(2026, 9, 10, 14, 5);
    const f = create(ChatComponent, {
      messages: [{ id: '1', role: 'agent', content: 'Hallo', timestamp: when, status: 'warning', streaming: true }],
      allowFileUpload: true,
    });
    const cmp = f.componentInstance as unknown as { formatTime(d: Date): string; statusLabel(s: string): string };
    expect(cmp.formatTime(when)).toBe(when.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
    expect(attr(f.nativeElement, '.lc-chat__attach-btn')).toBe('Datei anhängen');
    expect(attr(f.nativeElement, '.lc-chat__send-btn')).toBe('Send');
    expect(cmp.statusLabel('warning')).toBe('Warnung:');
    set(f, {
      locale: 'en-US',
      attachAriaLabel: 'Attach file',
      sendAriaLabel: 'Senden',
      statusInfoLabel: 'Info',
      statusSuccessLabel: 'Done:',
      statusWarningLabel: 'Warning:',
      statusErrorLabel: 'Error:',
    });
    expect(cmp.formatTime(when)).toBe(when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    expect(attr(f.nativeElement, '.lc-chat__attach-btn')).toBe('Attach file');
    expect(attr(f.nativeElement, '.lc-chat__send-btn')).toBe('Senden');
    expect(cmp.statusLabel('warning')).toBe('Warning:');
    expect(cmp.statusLabel('success')).toBe('Done:');
    expect((f.componentInstance as unknown as { removeAttachmentAriaLabel: () => string }).removeAttachmentAriaLabel()).toBe('Entfernen:');
  });

  it('lc-log-viewer: locale of the timestamps and the toolbar labels', () => {
    const at = new Date(2026, 9, 10, 14, 5, 9);
    const f = create(LogViewerComponent, {
      lines: [
        { text: 'boom', level: 'error', timestamp: at },
        { text: 'hm', level: 'warn', timestamp: at },
      ],
    });
    const cmp = f.componentInstance as unknown as { formatTimestamp(d: Date): string };
    expect(cmp.formatTimestamp(at)).toBe(at.toLocaleTimeString('en-US', { hour12: false }));
    const tools = () => [...f.nativeElement.querySelectorAll('.lc-log-viewer__tool-btn')].map((b) => [(b as HTMLElement).title, b.getAttribute('aria-label')]);
    expect(tools()).toEqual([
      ['Clear', 'Clear log'],
      ['Copy all', 'Copy all lines'],
      ['Search (/)', 'Search log'],
    ]);
    expect(text(f.nativeElement, '.lc-log-viewer__level-pill--error')).toBe('1 errors');
    expect(text(f.nativeElement, '.lc-log-viewer__line-count')).toBe('2 lines');
    expect(attr(f.nativeElement, '.lc-log-viewer__content')).toBe('Log output');
    set(f, {
      locale: 'de-DE',
      clearLabel: 'Leeren',
      clearAriaLabel: 'Protokoll leeren',
      copyLabel: 'Alles kopieren',
      copyAriaLabel: 'Alle Zeilen kopieren',
      searchLabel: 'Suchen (/)',
      searchAriaLabel: 'Protokoll durchsuchen',
      errorsLabel: 'Fehler',
      linesLabel: 'Zeilen',
      outputAriaLabel: 'Protokollausgabe',
    });
    expect(cmp.formatTimestamp(at)).toBe(at.toLocaleTimeString('de-DE', { hour12: false }));
    expect(tools()).toEqual([
      ['Leeren', 'Protokoll leeren'],
      ['Alles kopieren', 'Alle Zeilen kopieren'],
      ['Suchen (/)', 'Protokoll durchsuchen'],
    ]);
    expect(text(f.nativeElement, '.lc-log-viewer__level-pill--error')).toBe('1 Fehler');
    expect(text(f.nativeElement, '.lc-log-viewer__line-count')).toBe('2 Zeilen');
    expect(attr(f.nativeElement, '.lc-log-viewer__content')).toBe('Protokollausgabe');
  });

  it('lc-markdown: change-highlight and Mermaid labels', () => {
    const f = create(MarkdownComponent, { content: 'Neu\n\nAlt', previousContent: 'Alt', highlightChanges: true });
    expect(text(f.nativeElement, '.lc-markdown__block--changed .lc-markdown__sr-only')).toBe('(geändert)');
    expect(text(f.nativeElement, '[role="status"]')).toBe('1 Abschnitt geändert');
    set(f, { changedMarkerLabel: '(changed)', changedSummaryOneLabel: 'section changed', changedSummaryManyLabel: 'sections changed' });
    expect(text(f.nativeElement, '.lc-markdown__block--changed .lc-markdown__sr-only')).toBe('(changed)');
    expect(text(f.nativeElement, '[role="status"]')).toBe('1 section changed');
    set(f, { content: 'Eins\n\nZwei\n\nAlt' });
    expect(text(f.nativeElement, '[role="status"]')).toBe('2 sections changed');

    set(f, { content: '```mermaid\ngraph TD; A-->B\n```', highlightChanges: false, mermaidLoadingLabel: 'Diagramm wird gezeichnet …' });
    expect(text(f.nativeElement, '.lc-markdown__mermaid-loading')).toBe('Diagramm wird gezeichnet …');
  });

  it('lc-notification-center: actions, filters, times and badges', () => {
    const now = Date.now();
    const f = create(NotificationCenterComponent, {
      notifications: [
        { id: '1', title: 'Neu', type: 'error', priority: 'urgent', timestamp: new Date(now - 5 * 60_000) },
        { id: '2', title: 'Alt', type: 'info', timestamp: new Date(now - 3 * 3600_000), read: true },
      ],
      showPriority: true,
    });
    const filters = () => [...f.nativeElement.querySelectorAll('.lc-nc__filter')].map((b) => (b as HTMLElement).textContent?.trim());
    expect(text(f.nativeElement, '.lc-nc__action-btn')).toBe('Mark all read');
    expect(filters()).toEqual(['All (2)', 'Error (1)', 'Info (1)']);
    expect([...f.nativeElement.querySelectorAll('.lc-nc__item-time')].map((t) => (t as HTMLElement).textContent?.trim())).toEqual(['5m ago', '3h ago']);
    expect(text(f.nativeElement, '.lc-nc__item-priority')).toBe('Urgent');
    expect(attr(f.nativeElement, '.lc-nc__item-dismiss')).toBe('Dismiss notification: Neu');
    set(f, {
      markAllReadLabel: 'Alle gelesen',
      filterAllLabel: 'Alle',
      filterErrorLabel: 'Fehler',
      filterInfoLabel: 'Hinweise',
      minutesAgoLabel: 'vor {n} Min.',
      hoursAgoLabel: 'vor {n} Std.',
      urgentPriorityLabel: 'Dringend',
      dismissAriaLabel: 'Ausblenden:',
    });
    expect(text(f.nativeElement, '.lc-nc__action-btn')).toBe('Alle gelesen');
    expect(filters()).toEqual(['Alle (2)', 'Fehler (1)', 'Hinweise (1)']);
    expect([...f.nativeElement.querySelectorAll('.lc-nc__item-time')].map((t) => (t as HTMLElement).textContent?.trim())).toEqual([
      'vor 5 Min.',
      'vor 3 Std.',
    ]);
    expect(text(f.nativeElement, '.lc-nc__item-priority')).toBe('Dringend');
    expect(attr(f.nativeElement, '.lc-nc__item-dismiss')).toBe('Ausblenden: Neu');
  });

  it('lc-gallery: filter and lightbox labels', () => {
    const f = create(GalleryComponent, {
      items: [{ src: 'a.png', category: 'Haus' }, { src: 'b.png', alt: 'Garten', category: 'Garten' }],
    });
    expect(text(f.nativeElement, '.gallery__filter-btn')).toBe('All');
    const thumbs = () => [...f.nativeElement.querySelectorAll('[aria-label]')].map((e) => (e as HTMLElement).getAttribute('aria-label'));
    expect(thumbs()).toContain('Image 1');
    set(f, { filterAllLabel: 'Alle', imageFallbackLabel: 'Bild' });
    expect(text(f.nativeElement, '.gallery__filter-btn')).toBe('Alle');
    expect(thumbs()).toContain('Bild 1');
    (f.componentInstance as unknown as { lightboxIndex: { set(i: number): void } }).lightboxIndex.set(0);
    f.detectChanges();
    expect(attr(f.nativeElement, '.gallery__lightbox')).toBe('Image lightbox');
    set(f, { lightboxAriaLabel: 'Bildansicht', closeAriaLabel: 'Schließen', nextAriaLabel: 'Nächstes Bild' });
    expect(attr(f.nativeElement, '.gallery__lightbox')).toBe('Bildansicht');
    expect(f.nativeElement.querySelector('[aria-label="Schließen"]')).toBeTruthy();
    expect(attr(f.nativeElement, '.gallery__lightbox-nav--next')).toBe('Nächstes Bild');
  });

  it('lc-document-viewer: toolbar, type and empty-state labels', () => {
    const f = create(DocumentViewerComponent, { content: 'x', type: 'unknown' as never });
    expect(text(f.nativeElement, '.doc-viewer__filename')).toBe('Document');
    expect(text(f.nativeElement, '.doc-viewer__badge')).toBe('File');
    expect(text(f.nativeElement, '.doc-viewer__unsupported-title')).toBe('Preview not available');
    set(f, {
      untitledLabel: 'Dokument',
      fileTypeLabel: 'Datei',
      previewUnavailableTitle: 'Keine Vorschau',
      previewUnavailableMessage: 'Dieser Dateityp hat keine Vorschau.',
    });
    expect(text(f.nativeElement, '.doc-viewer__filename')).toBe('Dokument');
    expect(text(f.nativeElement, '.doc-viewer__badge')).toBe('Datei');
    expect(text(f.nativeElement, '.doc-viewer__unsupported-title')).toBe('Keine Vorschau');
    expect(text(f.nativeElement, '.doc-viewer__unsupported-msg')).toBe('Dieser Dateityp hat keine Vorschau.');
    set(f, { type: 'markdown', markdownTypeLabel: 'Markdown-Text' });
    expect(text(f.nativeElement, '.doc-viewer__badge')).toBe('Markdown-Text');
    set(f, { type: 'image', src: 'foto.png', zoomInAriaLabel: 'Vergrößern', imageTypeLabel: 'Bild' });
    expect(text(f.nativeElement, '.doc-viewer__badge')).toBe('Bild');
    expect(f.nativeElement.querySelector('[aria-label="Vergrößern"]')).toBeTruthy();
  });

  it('lc-dependency-viewer: zoom and detail labels', () => {
    const f = create(DependencyViewerComponent, { root: { id: 'a', label: 'A', children: [{ id: 'b', label: 'B' }] } });
    const zoom = () => [...f.nativeElement.querySelectorAll('.dep-viewer__btn')].map((b) => (b as HTMLElement).getAttribute('aria-label'));
    expect(zoom()).toEqual(['Zoom in', 'Zoom out', 'Reset']);
    set(f, { zoomInLabel: 'Vergrößern', zoomOutLabel: 'Verkleinern', resetZoomLabel: 'Zurücksetzen' });
    expect(zoom()).toEqual(['Vergrößern', 'Verkleinern', 'Zurücksetzen']);
    (f.componentInstance as unknown as { selectedNodeId: { set(id: string): void } }).selectedNodeId.set('a');
    set(f, { depthLabel: 'Tiefe:' });
    expect(f.nativeElement.querySelector('.dep-viewer__detail-meta')?.textContent).toContain('Tiefe:');
  });

  it('lc-rich-text-editor: mode, toolbar and footer labels', () => {
    const f = create(RichTextEditorComponent);
    const modes = () => [...f.nativeElement.querySelectorAll('.lc-rich-text-editor__mode-btn')].map((b) => [(b as HTMLElement).textContent?.trim(), (b as HTMLElement).title]);
    expect(modes()).toEqual([
      ['Rich', 'Rich Text'],
      ['MD', 'Markdown'],
      ['Split', 'Split View'],
    ]);
    expect(attr(f.nativeElement, '.lc-rich-text-editor__toolbar-btn')).toBe('Bold');
    set(f, { richModeLabel: 'Formatiert', markdownModeTitle: 'Markdown-Quelltext', actionTitles: { bold: 'Fett' }, wordsLabel: 'Wörter' });
    expect(modes()[0][0]).toBe('Formatiert');
    expect(modes()[1][1]).toBe('Markdown-Quelltext');
    expect(attr(f.nativeElement, '.lc-rich-text-editor__toolbar-btn')).toBe('Fett');
    expect(text(f.nativeElement, '.lc-rich-text-editor__footer')).toContain('Wörter');
  });

  it('lc-password-input: toggle, strength and requirement labels', () => {
    const f = create(PasswordInputComponent, { showStrengthMeter: true, showRequirements: true });
    const toggle = () => f.nativeElement.querySelector('[aria-label="Show password"], [aria-label="Passwort anzeigen"]');
    expect(toggle()?.getAttribute('aria-label')).toBe('Show password');
    expect(text(f.nativeElement, '.lc-strength-label')).toBe('Password strength: Weak');
    expect(text(f.nativeElement, '.lc-requirement-label')).toBe('At least 8 characters');
    set(f, {
      showPasswordAriaLabel: 'Passwort anzeigen',
      strengthLabel: 'Passwortstärke:',
      weakLabel: 'Schwach',
      minLengthRequirementLabel: 'Mindestens 8 Zeichen',
      requirementNotMetLabel: '(nicht erfüllt)',
    });
    expect(toggle()?.getAttribute('aria-label')).toBe('Passwort anzeigen');
    expect(text(f.nativeElement, '.lc-strength-label')).toBe('Passwortstärke: Schwach');
    expect(text(f.nativeElement, '.lc-requirement-label')).toBe('Mindestens 8 Zeichen');
    expect(f.nativeElement.querySelector('.lc-requirement .lc-sr-only')?.textContent?.trim()).toBe('(nicht erfüllt)');
    // The level stays the English API value (class names depend on it).
    expect((f.componentInstance as unknown as { strength: () => { level: string } }).strength().level).toBe('Weak');
  });

  it('lc-email-input: validation messages', () => {
    const f = create(EmailInputComponent, { required: true, validateOnInput: true });
    const cmp = f.componentInstance as unknown as { writeValue(v: string): void; requiredMessage: () => string; invalidMessage: () => string };
    expect(cmp.requiredMessage()).toBe('Email address is required');
    expect(cmp.invalidMessage()).toBe('Please enter a valid email address');
    set(f, { requiredMessage: 'Bitte E-Mail-Adresse eingeben', invalidMessage: 'Ungültige E-Mail-Adresse' });
    cmp.writeValue('kein-at');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ungültige E-Mail-Adresse');
  });

  it('lc-tag-input: limit, remove and suggestion labels', () => {
    const f = create(TagInputComponent, { maxTags: 1 });
    (f.componentInstance as unknown as { writeValue(v: string[]): void }).writeValue(['Strom']);
    f.detectChanges();
    const input = () => f.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input().placeholder).toBe('Maximum of 1 tags reached');
    expect(f.nativeElement.querySelector('[aria-label="Remove Strom"]')).toBeTruthy();
    set(f, { maxTagsReachedLabel: 'Höchstens {max} Schlagworte', removeTagAriaLabel: 'Entfernen:' });
    expect(input().placeholder).toBe('Höchstens 1 Schlagworte');
    expect(f.nativeElement.querySelector('[aria-label="Entfernen: Strom"]')).toBeTruthy();
  });

  it('lc-error-display: severity titles', () => {
    const f = create(ErrorDisplayComponent, { error: { message: 'Etwas ging schief' }, severity: 'warning' });
    const title = (f.componentInstance as unknown as { errorTitle: () => string }).errorTitle;
    expect(title()).toBe('Warning');
    set(f, { warningTitleLabel: 'Warnung', severity: 'warning' });
    expect(title()).toBe('Warnung');
    set(f, { severity: 'error', errorTitleLabel: 'Fehler' });
    expect(title()).toBe('Fehler');
  });

  it('lc-rating: ariaLabel without a visible label', () => {
    const f = create(RatingComponent);
    expect(attr(f.nativeElement, '[role="radiogroup"]')).toBe('Rating');
    set(f, { ariaLabel: 'Bewertung' });
    expect(attr(f.nativeElement, '[role="radiogroup"]')).toBe('Bewertung');
  });

  it('lc-table: selection, sort, filter and pagination labels', () => {
    const f = create(TableComponent, {
      columns: [{ key: 'name', label: 'Name', sortable: true }],
      data: Array.from({ length: 12 }, (_, i) => ({ name: `Zeile ${i}` })),
      selectable: true,
      filterable: true,
      paginate: true,
      pageSize: 10,
    });
    const el = f.nativeElement as HTMLElement;
    expect(attr(el, 'thead .lc-table__checkbox')).toBe('Select all rows');
    expect(attr(el, 'tbody .lc-table__checkbox')).toBe('Select row 1');
    expect((el.querySelector('.lc-table__filter-input input') as HTMLInputElement)?.placeholder).toBe('Filter Name');
    expect(text(el, '.lc-table-pagination__info')).toBe('1–10 of 12');
    expect([...el.querySelectorAll('.lc-table-pagination__btn')].map((b) => b.getAttribute('aria-label'))).toEqual(['Previous page', 'Next page']);
    set(f, {
      selectAllAriaLabel: 'Alle Zeilen auswählen',
      selectRowAriaLabel: 'Zeile auswählen',
      filterPlaceholderLabel: 'Filtern:',
      rangeOfLabel: 'von',
      previousPageAriaLabel: 'Vorherige Seite',
      nextPageAriaLabel: 'Nächste Seite',
    });
    expect(attr(el, 'thead .lc-table__checkbox')).toBe('Alle Zeilen auswählen');
    expect(attr(el, 'tbody .lc-table__checkbox')).toBe('Zeile auswählen 1');
    expect((el.querySelector('.lc-table__filter-input input') as HTMLInputElement)?.placeholder).toBe('Filtern: Name');
    expect(text(el, '.lc-table-pagination__info')).toBe('1–10 von 12');
    expect([...el.querySelectorAll('.lc-table-pagination__btn')].map((b) => b.getAttribute('aria-label'))).toEqual(['Vorherige Seite', 'Nächste Seite']);
  });

  it('lc-verification-code-input: digitAriaLabel', () => {
    const f = create(VerificationCodeInputComponent, { length: 4 });
    const first = () => f.nativeElement.querySelector('input')?.getAttribute('aria-label');
    expect(first()).toBe('Digit 1 of 4');
    set(f, { digitAriaLabel: 'Ziffer {n} von {total}' });
    expect(first()).toBe('Ziffer 1 von 4');
  });

  it('lc-color-picker: group, hex and swatch labels', () => {
    const f = create(ColorPickerComponent);
    const labels = () => [...f.nativeElement.querySelectorAll('[aria-label]')].map((e) => (e as HTMLElement).getAttribute('aria-label'));
    expect(labels()).toEqual(expect.arrayContaining(['Color picker', 'Hex color value']));
    set(f, { ariaLabel: 'Farbauswahl', hexAriaLabel: 'Hex-Farbwert', swatchesAriaLabel: 'Farbfelder' });
    expect(labels()).toEqual(expect.arrayContaining(['Farbauswahl', 'Hex-Farbwert']));
  });

  it('lc-filter-bar: default placeholders', () => {
    const f = create(FilterBarComponent, {
      filters: [
        { key: 'q', type: 'search' },
        { key: 's', type: 'select', options: [{ value: 'a', label: 'A' }] },
      ],
    });
    const cmp = f.componentInstance as unknown as { selectPlaceholder: () => string; searchPlaceholder: () => string };
    expect(cmp.searchPlaceholder()).toBe('Search...');
    expect(cmp.selectPlaceholder()).toBe('Select an option');
    set(f, { searchPlaceholder: 'Suchen …', selectPlaceholder: 'Bitte wählen' });
    expect(f.nativeElement.innerHTML).toContain('Suchen …');
  });
});
