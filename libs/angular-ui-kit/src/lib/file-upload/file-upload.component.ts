import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
} from '@angular/core';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';

export interface FileUploadFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

/**
 * File upload / dropzone component with drag & drop support.
 *
 * @example
 * ```html
 * <lc-file-upload
 *   accept=".pdf,.png,.jpg"
 *   [multiple]="true"
 *   [maxSizeBytes]="5242880"
 *   (filesSelected)="onFiles($event)"
 * ></lc-file-upload>
 * ```
 */
@Component({
  selector: 'lc-file-upload',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * File upload component with drag-and-drop support.
 *
 * Features:
 * - Drag-and-drop file dropzone with visual feedback
 * - Click-to-browse file selection
 * - File type and size validation
 * - Multi-file upload support
 * - File list display with removal
 * - Disabled state support
 *
 * @example
 * ```html
 * <lc-file-upload accept=".pdf,.jpg" [multiple]="true" [maxSizeBytes]="5242880" />
 * ```
 */
export class FileUploadComponent {
  /**
   * Accepted file types (e.g. ".pdf,.jpg,image/*").
   */
  accept = input<string>('');

  /**
   * Allow multiple files.
   * @default false
   */
  multiple = input<boolean>(false);

  /**
   * Maximum file size in bytes. 0 for unlimited.
   * @default 0
   */
  maxSizeBytes = input<number>(0);

  /**
   * Whether the dropzone is disabled.
   * @default false
   */
  disabled = input<boolean>(false);

  /**
   * Hint text shown in the dropzone.
   * @default 'Drag & drop files here, or click to browse'
   */
  hint = input<string>('Drag & drop files here, or click to browse');

  /** Prefix of the accepted file types line (`accept`). */
  acceptedLabel = input('Accepted:');

  /** Prefix of the maximum file size line (`maxSizeBytes`). */
  maxSizeLabel = input('Max:');

  /** Accessible name of a selected file's remove button. */
  removeFileAriaLabel = input('Remove file');

  /**
   * Emitted with selected files after validation.
   */
  readonly filesSelected = output<FileUploadFile[]>();

  /**
   * Emitted when a file is rejected (too large or wrong type).
   */
  readonly fileRejected = output<{ file: File; reason: string }>();

  protected isDragOver = signal(false);
  protected selectedFiles = signal<FileUploadFile[]>([]);
  protected readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected dropzoneClasses = computed(() => {
    return [
      'file-upload',
      this.isDragOver() ? 'file-upload--drag-over' : '',
      this.disabled() ? 'file-upload--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) {
      this.isDragOver.set(true);
    }
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    if (this.disabled() || !event.dataTransfer?.files.length) return;
    this.processFiles(event.dataTransfer.files);
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.processFiles(input.files);
    }
    // Reset so the same file can be re-selected
    input.value = '';
  }

  protected openFilePicker(): void {
    if (!this.disabled()) {
      this.fileInputRef()?.nativeElement.click();
    }
  }

  protected removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
    this.filesSelected.emit(this.selectedFiles());
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private processFiles(fileList: FileList): void {
    const files = Array.from(fileList);
    const accepted: FileUploadFile[] = [];

    for (const file of files) {
      if (this.maxSizeBytes() > 0 && file.size > this.maxSizeBytes()) {
        this.fileRejected.emit({ file, reason: 'File too large' });
        continue;
      }
      accepted.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    if (this.multiple()) {
      this.selectedFiles.update((prev) => [...prev, ...accepted]);
    } else {
      this.selectedFiles.set(accepted.slice(0, 1));
    }

    this.filesSelected.emit(this.selectedFiles());
  }
}
