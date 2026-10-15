import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ListComponent, ListItem } from './list.component';

/** LK-7: the avatar colour of list items (the member list on Today and Household). */
describe('ListComponent avatar colour (LK-7)', () => {
  let fixture: ComponentFixture<ListComponent>;

  const avatars = () => Array.from(fixture.nativeElement.querySelectorAll('.lc-list__avatar')) as HTMLElement[];

  function render(items: ListItem[]): void {
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [provideHttpClient(withXhr())],
    }).compileComponents();
    fixture = TestBed.createComponent(ListComponent);
  });

  it('keeps the default avatar without avatarColor', () => {
    render([{ label: 'Anna Schmidt', avatar: 'AS' }]);
    expect(avatars()[0].className).toBe('lc-list__avatar');
  });

  it('treats avatarColor "default" as the default avatar', () => {
    render([{ label: 'Anna Schmidt', avatar: 'AS', avatarColor: 'default' }]);
    expect(avatars()[0].className).toBe('lc-list__avatar');
  });

  it('applies the member colour and keeps the initials', () => {
    render([
      { label: 'Johanna Apfelbaum', avatar: 'JA', avatarColor: 'member-1' },
      { label: 'Tom Ek', avatar: 'TE', avatarColor: 'member-2' },
    ]);
    const [first, second] = avatars();
    expect(first.classList).toContain('lc-list__avatar--member');
    expect(first.classList).toContain('lc-list__avatar--member-1');
    expect(second.classList).toContain('lc-list__avatar--member-2');
    expect(second.textContent?.trim()).toBe('TE');
  });

  it('reads the colours from the member tokens with white initials', () => {
    const scss = readFileSync(resolve(__dirname, 'list.component.scss'), 'utf-8');
    expect(scss).toMatch(/background-color: var\(--color-member-#\{\$index\}, #\{\$hex\}\)/);
    expect(scss).toMatch(/\.lc-list__avatar--member \.lc-list__avatar-initials \{[^}]*color: var\(--color-on-member, #ffffff\)/s);
  });
});
