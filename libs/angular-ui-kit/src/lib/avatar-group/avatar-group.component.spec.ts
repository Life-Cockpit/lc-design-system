import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AvatarGroupComponent, AvatarGroupItem } from './avatar-group.component';
import { provideHttpClient, withXhr } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [AvatarGroupComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<lc-avatar-group [avatars]="avatars" [size]="size" [max]="max" [ring]="ring" [overlap]="overlap" />`,
})
class TestHostComponent {
  avatars: AvatarGroupItem[] = [
    { name: 'Alice A' },
    { name: 'Bob B' },
    { name: 'Charlie C' },
  ];
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  max = 5;
  ring = false;
  overlap = '';
}

describe('AvatarGroupComponent', () => {
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
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render avatars', () => {
    fixture.detectChanges();
    const avatarEls = fixture.nativeElement.querySelectorAll('lc-avatar');
    expect(avatarEls.length).toBe(3);
  });

  it('should not show overflow when count <= max', () => {
    fixture.detectChanges();
    const overflow = fixture.nativeElement.querySelector('.avatar-group__overflow');
    expect(overflow).toBeNull();
  });

  it('should show overflow count when avatars exceed max', () => {
    host.avatars = [
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
      { name: 'D' },
      { name: 'E' },
      { name: 'F' },
      { name: 'G' },
    ];
    host.max = 3;
    fixture.detectChanges();

    const overflow = fixture.nativeElement.querySelector('.avatar-group__overflow');
    expect(overflow).toBeTruthy();
    expect(overflow.textContent.trim()).toBe('+4');
  });

  it('should respect size input', () => {
    host.size = 'lg';
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector('.avatar-group');
    expect(group.classList).toContain('avatar-group--lg');
  });

  it('should show only max avatars', () => {
    host.avatars = [
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
      { name: 'D' },
      { name: 'E' },
    ];
    host.max = 2;
    fixture.detectChanges();

    const avatarEls = fixture.nativeElement.querySelectorAll('lc-avatar');
    expect(avatarEls.length).toBe(2);
  });

  describe('member colours, ring and overlap (LK-7)', () => {
    it('passes each item colour to its avatar', () => {
      host.avatars = [
        { name: 'Johanna Apfelbaum', color: 'member-1' },
        { name: 'Tom Ek', color: 'member-2' },
        { name: 'No Colour' },
      ];
      fixture.detectChanges();
      const avatars = fixture.nativeElement.querySelectorAll('.lc-avatar');
      expect(avatars[0].classList).toContain('lc-avatar--member-1');
      expect(avatars[1].classList).toContain('lc-avatar--member-2');
      expect(avatars[2].classList).not.toContain('lc-avatar--member');
    });

    it('keeps the bordered stack without ring', () => {
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('.avatar-group');
      expect(group.classList).not.toContain('avatar-group--ring');
      expect(fixture.nativeElement.querySelector('.lc-avatar--ring')).toBeNull();
    });

    it('rings every avatar when ring is set', () => {
      host.ring = true;
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('.avatar-group');
      expect(group.classList).toContain('avatar-group--ring');
      expect(fixture.nativeElement.querySelectorAll('.lc-avatar--ring').length).toBe(3);
    });

    it('keeps the size default overlap when none is given', () => {
      fixture.detectChanges();
      const group: HTMLElement = fixture.nativeElement.querySelector('.avatar-group');
      expect(group.style.getPropertyValue('--lc-avatar-group-overlap')).toBe('');
    });

    it('sets the overlap when given', () => {
      host.overlap = '4px';
      fixture.detectChanges();
      const group: HTMLElement = fixture.nativeElement.querySelector('.avatar-group');
      expect(group.style.getPropertyValue('--lc-avatar-group-overlap')).toBe('4px');
    });

    it('stacks later avatars on top (DOM order)', () => {
      host.avatars = [{ name: 'A B' }, { name: 'C D' }];
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('lc-avatar');
      expect(items[0].compareDocumentPosition(items[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});
