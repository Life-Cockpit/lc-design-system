import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { FileUploadComponent, FileUploadFile } from './file-upload.component';

@Component({
  standalone: true,
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-file-upload
      [accept]="accept"
      [multiple]="multiple"
      [maxSizeBytes]="maxSizeBytes"
      [disabled]="disabled"
      [hint]="hint"
      (filesSelected)="onFilesSelected($event)"
      (fileRejected)="onFileRejected($event)"
    ></lc-file-upload>
  `,
})
class TestHostComponent {
  accept = '';
  multiple = false;
  maxSizeBytes = 0;
  disabled = false;
  hint = 'Drop files here';
  lastFiles: FileUploadFile[] = [];
  lastRejection: { file: File; reason: string } | null = null;

  onFilesSelected(files: FileUploadFile[]): void {
    this.lastFiles = files;
  }

  onFileRejected(event: { file: File; reason: string }): void {
    this.lastRejection = event;
  }
}

function createMockFile(name: string, size: number, type = 'text/plain'): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

describe('FileUploadComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient(withXhr())],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(FileUploadComponent))).toBeTruthy();
  });

  it('should render dropzone with hint', () => {
    fixture.detectChanges();
    const hint = fixture.debugElement.query(By.css('.file-upload__hint'));
    expect(hint.nativeElement.textContent).toContain('Drop files here');
  });

  it('should apply disabled class', () => {
    host.disabled = true;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.file-upload')).nativeElement.classList).toContain('file-upload--disabled');
  });

  it('should show accepted types', () => {
    host.accept = '.pdf,.jpg';
    fixture.detectChanges();
    const accept = fixture.debugElement.query(By.css('.file-upload__accept'));
    expect(accept.nativeElement.textContent).toContain('.pdf,.jpg');
  });

  it('should have hidden file input', () => {
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input[type="file"]'));
    expect(input).toBeTruthy();
    expect(input.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });

  it('should emit filesSelected when files are chosen', () => {
    fixture.detectChanges();
    const comp = fixture.debugElement.query(By.directive(FileUploadComponent)).componentInstance as FileUploadComponent;
    const file = createMockFile('test.txt', 100);

    // Directly call the component's internal processFiles via onFileChange
    const input: HTMLInputElement = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement;
    // Mock the files property
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastFiles.length).toBe(1);
    expect(host.lastFiles[0].name).toBe('test.txt');
  });

  it('should reject files exceeding maxSizeBytes', () => {
    host.maxSizeBytes = 50;
    fixture.detectChanges();

    const file = createMockFile('large.txt', 100);

    const input: HTMLInputElement = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.lastRejection).toBeTruthy();
    expect(host.lastRejection?.reason).toBe('File too large');
    expect(host.lastFiles.length).toBe(0);
  });

  it('should have role button and keyboard accessibility', () => {
    fixture.detectChanges();
    const dropzone = fixture.debugElement.query(By.css('.file-upload')).nativeElement;
    expect(dropzone.getAttribute('role')).toBe('button');
    expect(dropzone.getAttribute('tabindex')).toBe('0');
  });
});
