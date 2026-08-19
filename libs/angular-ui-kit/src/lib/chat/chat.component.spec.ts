import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent, ChatMessage } from './chat.component';

describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;

  const messages: ChatMessage[] = [
    { id: '1', role: 'user', content: 'Hello!', name: 'Alex', timestamp: new Date() },
    { id: '2', role: 'agent', content: 'Hi! How can I help?', name: 'AI Assistant', timestamp: new Date() },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChatComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChatComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render messages', () => {
    fixture.componentRef.setInput('messages', messages);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-chat__message').length).toBe(2);
  });

  it('should render user messages on the right', () => {
    fixture.componentRef.setInput('messages', messages);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__message--user')).toBeTruthy();
  });

  describe('user bubble', () => {
    it('does not render a name label inside the user bubble', () => {
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();
      const user = fixture.nativeElement.querySelector('.lc-chat__message--user');
      expect(user.querySelector('.lc-chat__name')).toBeNull();
      expect(user.textContent).not.toContain('Alex');
    });

    it('renders the user timestamp on a line below the bubble', () => {
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();
      const user = fixture.nativeElement.querySelector('.lc-chat__message--user');
      const time = user.querySelector('.lc-chat__time--user');
      expect(time).toBeTruthy();
      // It is a sibling of the bubble, not nested inside it.
      expect(user.querySelector('.lc-chat__bubble .lc-chat__time--user')).toBeNull();
    });

    it('shows a monogram from the name when the user has no avatar image', () => {
      fixture.componentRef.setInput('messages', [
        { id: 'u', role: 'user', content: 'Hi', name: 'Alex Example', timestamp: new Date() },
      ]);
      fixture.detectChanges();
      const user = fixture.nativeElement.querySelector('.lc-chat__message--user');
      expect(user.classList).toContain('lc-chat__message--avatar');
      const mono = user.querySelector('.lc-chat__marker--user .lc-chat__monogram');
      expect(mono).toBeTruthy();
      expect(mono.textContent.trim()).toBe('AE');
    });

    it('uses the avatar image on the user side when provided', () => {
      fixture.componentRef.setInput('messages', [
        { id: 'u', role: 'user', content: 'Hi', name: 'Alex', avatar: 'x.png', timestamp: new Date() },
      ]);
      fixture.detectChanges();
      const user = fixture.nativeElement.querySelector('.lc-chat__message--user');
      expect(user.querySelector('.lc-chat__marker--user .lc-chat__avatar-img')).toBeTruthy();
      expect(user.querySelector('.lc-chat__monogram')).toBeNull();
    });

    it('shows no user avatar when showAvatars is false', () => {
      fixture.componentRef.setInput('messages', messages);
      fixture.componentRef.setInput('showAvatars', false);
      fixture.detectChanges();
      const user = fixture.nativeElement.querySelector('.lc-chat__message--user');
      expect(user.classList).not.toContain('lc-chat__message--avatar');
      expect(user.querySelector('.lc-chat__marker--user')).toBeNull();
    });
  });

  it('should render agent messages on the left', () => {
    fixture.componentRef.setInput('messages', messages);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__message--agent')).toBeTruthy();
  });

  it('should show header with title', () => {
    fixture.componentRef.setInput('title', 'Test Chat');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__title').textContent).toContain('Test Chat');
  });

  describe('agent timestamp placement', () => {
    it('pulls a named agent message timestamp onto the label row', () => {
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();
      const agent = fixture.nativeElement.querySelector('.lc-chat__message--agent');
      // messages[1] has a name → timestamp sits inline in the meta/label row.
      expect(agent.querySelector('.lc-chat__meta--agent .lc-chat__time')).toBeTruthy();
      expect(agent.querySelector('.lc-chat__bubble > .lc-chat__time')).toBeNull();
    });

    it('keeps a content-only (nameless) agent timestamp as a tucked trailing line', () => {
      fixture.componentRef.setInput('messages', [
        { id: 'a', role: 'agent', content: 'Working…', timestamp: new Date() },
      ]);
      fixture.detectChanges();
      const agent = fixture.nativeElement.querySelector('.lc-chat__message--agent');
      expect(agent.querySelector('.lc-chat__meta--agent')).toBeNull();
      const time = agent.querySelector('.lc-chat__bubble > .lc-chat__time');
      expect(time).toBeTruthy();
      expect(time.classList).toContain('lc-chat__time--tight');
    });
  });

  it('should be bordered (card style) by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat--borderless')).toBeFalsy();
  });

  it('should render flush when bordered is false', () => {
    fixture.componentRef.setInput('bordered', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat--borderless')).toBeTruthy();
  });

  it('should anchor messages to the top by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__messages--anchor-bottom')).toBeFalsy();
  });

  it('should anchor messages to the bottom when requested', () => {
    fixture.componentRef.setInput('messageAnchor', 'bottom');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__messages--anchor-bottom')).toBeTruthy();
  });

  it('should span full width by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat--width-full')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-chat--width-narrow')).toBeFalsy();
  });

  it('should use the narrow reading column when contentWidth is narrow', () => {
    fixture.componentRef.setInput('contentWidth', 'narrow');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat--width-narrow')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-chat--width-full')).toBeFalsy();
  });

  it('should show streaming badge when streaming', () => {
    fixture.componentRef.setInput('isStreaming', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__streaming-badge')).toBeTruthy();
  });

  it('should show typing indicator when streaming and no streaming message', () => {
    fixture.componentRef.setInput('isStreaming', true);
    fixture.componentRef.setInput('messages', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__typing')).toBeTruthy();
  });

  it('should show cursor on streaming message', () => {
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'agent', content: 'Processing...', streaming: true },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__cursor--visible')).toBeTruthy();
  });

  it('should render input area', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-chat__send-btn')).toBeTruthy();
  });

  it('should disable send button when input is empty', () => {
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.lc-chat__send-btn');
    expect(btn.disabled).toBe(true);
  });

  it('puts a rail dot on the agent turn and a right-side avatar on the user turn', () => {
    fixture.componentRef.setInput('messages', messages);
    fixture.detectChanges();
    // Agent sits on the rail with a dot (left); no rail dot on the user side.
    const agent = fixture.nativeElement.querySelector('.lc-chat__message--agent');
    expect(agent.querySelector('.lc-chat__marker .lc-chat__dot--agent')).toBeTruthy();
    const user = fixture.nativeElement.querySelector('.lc-chat__message--user');
    expect(user.querySelector('.lc-chat__marker--user')).toBeTruthy();
    expect(user.querySelector('.lc-chat__dot')).toBeNull();
  });

  it('should hide rail markers when showAvatars is false', () => {
    fixture.componentRef.setInput('messages', messages);
    fixture.componentRef.setInput('showAvatars', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-chat__marker').length).toBe(0);
  });

  it('should show system messages centered', () => {
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'system', content: 'Chat started' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__message--system')).toBeTruthy();
  });

  // --- Semantic status ---

  it('should keep the role-coloured dot when status is omitted', () => {
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'agent', content: 'Hi' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__dot--agent')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-chat__status-icon')).toBeFalsy();
  });

  it('should replace the dot with a status icon for a semantic status', () => {
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'agent', content: 'Failed', status: 'error' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__status-icon')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-chat__dot')).toBeFalsy();
  });

  it('should announce error messages assertively via role="alert"', () => {
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'agent', content: 'Agent unreachable', status: 'error' },
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-chat__message');
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('should announce non-error statuses politely', () => {
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'system', content: 'Model switched', status: 'info' },
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.lc-chat__message');
    expect(el.getAttribute('role')).toBeNull();
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('should render a visually-hidden status label', () => {
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'agent', content: 'Done', status: 'success' },
    ]);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.lc-chat__sr-only');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('Erfolg:');
  });

  it('should surface a status marker even when showAvatars is false', () => {
    fixture.componentRef.setInput('showAvatars', false);
    fixture.componentRef.setInput('messages', [
      { id: '1', role: 'agent', content: 'Failed', status: 'error' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-chat__marker')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.lc-chat__status-icon')).toBeTruthy();
  });

  // --- Auto-scroll ---

  describe('auto-scroll', () => {
    /** jsdom has no layout: fake the scroll metrics of the thread container. */
    const layout = (el: HTMLElement, scrollHeight: number, clientHeight: number) => {
      Object.defineProperty(el, 'scrollHeight', { get: () => scrollHeight, configurable: true });
      Object.defineProperty(el, 'clientHeight', { get: () => clientHeight, configurable: true });
    };
    const container = (): HTMLElement => fixture.nativeElement.querySelector('.lc-chat__messages');

    it('scrolls to the bottom when a history of messages is loaded', () => {
      fixture.detectChanges();
      const el = container();
      layout(el, 1000, 200);
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();
      expect(el.scrollTop).toBe(1000);
    });

    it('follows a new agent reply while the reader is at the bottom', () => {
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();
      const el = container();
      layout(el, 1200, 200);
      fixture.componentRef.setInput('messages', [
        ...messages,
        { id: '3', role: 'agent', content: 'A reply', name: 'Assistant' },
      ]);
      fixture.detectChanges();
      expect(el.scrollTop).toBe(1200);
    });

    it('follows streamed token updates on the last message', () => {
      const streaming: ChatMessage[] = [
        ...messages,
        { id: '3', role: 'agent', content: 'Wor', streaming: true },
      ];
      fixture.componentRef.setInput('messages', streaming);
      fixture.detectChanges();
      const el = container();
      layout(el, 900, 200);
      // Same ids, only the last message's content grew.
      fixture.componentRef.setInput('messages', [
        ...messages,
        { id: '3', role: 'agent', content: 'Working on it…', streaming: true },
      ]);
      fixture.detectChanges();
      expect(el.scrollTop).toBe(900);
    });

    it('does not fight a reader who scrolled up', () => {
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();
      const el = container();
      layout(el, 1000, 200);
      el.scrollTop = 100;
      el.dispatchEvent(new Event('scroll'));
      fixture.componentRef.setInput('messages', [
        ...messages,
        { id: '3', role: 'agent', content: 'A reply', name: 'Assistant' },
      ]);
      fixture.detectChanges();
      expect(el.scrollTop).toBe(100);
    });

    it('re-engages follow mode when the reader sends a message', () => {
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();
      const el = container();
      layout(el, 1000, 200);
      el.scrollTop = 100;
      el.dispatchEvent(new Event('scroll'));

      const textarea = fixture.nativeElement.querySelector('.lc-chat__input') as HTMLTextAreaElement;
      textarea.value = 'Hello';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(el.scrollTop).toBe(1000);
    });
  });

  // --- Composer ---

  describe('composer', () => {
    it('does not send on Enter while an IME composition is in progress', () => {
      fixture.detectChanges();
      const spy = jest.fn();
      fixture.componentInstance.messageSend.subscribe(spy);
      const textarea = fixture.nativeElement.querySelector('.lc-chat__input') as HTMLTextAreaElement;
      textarea.value = 'こんにちは';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const composing = new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true });
      textarea.dispatchEvent(composing);
      expect(spy).not.toHaveBeenCalled();
      expect(composing.defaultPrevented).toBe(false);

      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      expect(spy).toHaveBeenCalledWith({ content: 'こんにちは', attachments: undefined });
    });

    it('associates a visually-hidden label with the textarea', () => {
      fixture.detectChanges();
      const textarea = fixture.nativeElement.querySelector('.lc-chat__input') as HTMLTextAreaElement;
      expect(textarea.id).toMatch(/^lc-chat-input-\d+$/);
      const label = fixture.nativeElement.querySelector(`label[for="${textarea.id}"]`) as HTMLLabelElement;
      expect(label).toBeTruthy();
      expect(label.textContent?.trim()).toBe('Nachricht');
      expect(label.classList).toContain('lc-chat__sr-only');
    });

    it('uses inputLabel as the accessible name', () => {
      fixture.componentRef.setInput('inputLabel', 'Message');
      fixture.detectChanges();
      const textarea = fixture.nativeElement.querySelector('.lc-chat__input') as HTMLTextAreaElement;
      expect(fixture.nativeElement.querySelector(`label[for="${textarea.id}"]`).textContent.trim()).toBe('Message');
    });
  });

  // --- Live region ---

  describe('live region', () => {
    const announcer = (): HTMLElement => fixture.nativeElement.querySelector('.lc-chat__announcer');

    it('exists as a polite, atomic live region', () => {
      fixture.detectChanges();
      expect(announcer().getAttribute('aria-live')).toBe('polite');
      expect(announcer().getAttribute('aria-atomic')).toBe('true');
    });

    it('announces the latest completed non-user message with its name', () => {
      fixture.componentRef.setInput('messages', messages);
      fixture.detectChanges();
      expect(announcer().textContent?.trim()).toBe('AI Assistant: Hi! How can I help?');
    });

    it('does not announce user turns or streaming turns', () => {
      fixture.componentRef.setInput('messages', [
        ...messages,
        { id: '3', role: 'user', content: 'Thanks' },
        { id: '4', role: 'agent', content: 'partial', streaming: true },
      ]);
      fixture.detectChanges();
      expect(announcer().textContent?.trim()).toBe('AI Assistant: Hi! How can I help?');
    });

    it('leaves semantic-status messages to their own alert/live semantics', () => {
      fixture.componentRef.setInput('messages', [
        ...messages,
        { id: '3', role: 'agent', content: 'Failed', status: 'error' },
      ]);
      fixture.detectChanges();
      expect(announcer().textContent?.trim()).toBe('AI Assistant: Hi! How can I help?');
    });
  });
});
