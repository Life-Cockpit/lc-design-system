import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show()', () => {
    it('should add toast to the toasts array', () => {
      service.show({ message: 'Test toast' });
      expect(service.toasts().length).toBe(1);
    });

    it('should generate unique ID for each toast', () => {
      service.show({ message: 'Toast 1' });
      service.show({ message: 'Toast 2' });
      const toasts = service.toasts();
      expect(toasts[0]!.id).not.toBe(toasts[1]!.id);
    });

    it('should use default variant when not specified', () => {
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast!.variant).toBe('info');
    });

    it('should use specified variant', () => {
      service.show({ message: 'Success!', variant: 'success' });
      const toast = service.toasts()[0];
      expect(toast!.variant).toBe('success');
    });

    it('should use default position when not specified', () => {
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast!.position).toBe('top-right');
    });

    it('should use specified position', () => {
      service.show({ message: 'Test', position: 'bottom-left' });
      const toast = service.toasts()[0];
      expect(toast!.position).toBe('bottom-left');
    });

    it('should use default duration when not specified', () => {
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast!.duration).toBe(3000);
    });

    it('should use specified duration', () => {
      service.show({ message: 'Test', duration: 5000 });
      const toast = service.toasts()[0];
      expect(toast!.duration).toBe(5000);
    });

    it('should auto-dismiss toast after duration', (done) => {
      jest.useFakeTimers();
      service.show({ message: 'Test', duration: 1000 });
      expect(service.toasts().length).toBe(1);

      jest.advanceTimersByTime(1000);
      expect(service.toasts().length).toBe(0);
      jest.useRealTimers();
      done();
    });

    it('should not auto-dismiss when duration is 0', (done) => {
      jest.useFakeTimers();
      service.show({ message: 'Test', duration: 0 });
      expect(service.toasts().length).toBe(1);

      jest.advanceTimersByTime(10000);
      expect(service.toasts().length).toBe(1);
      jest.useRealTimers();
      done();
    });

    it('should limit to 5 toasts maximum', () => {
      for (let i = 0; i < 7; i++) {
        service.show({ message: `Toast ${i}` });
      }
      expect(service.toasts().length).toBe(5);
    });

    it('should remove oldest toast when exceeding max', () => {
      service.show({ message: 'Toast 1' });
      service.show({ message: 'Toast 2' });
      service.show({ message: 'Toast 3' });
      service.show({ message: 'Toast 4' });
      service.show({ message: 'Toast 5' });
      const oldestId = service.toasts()[0]!.id;

      service.show({ message: 'Toast 6' });

      const toasts = service.toasts();
      expect(toasts.length).toBe(5);
      expect(toasts.find((t) => t.id === oldestId)).toBeFalsy();
    });
  });

  describe('close()', () => {
    it('should remove toast by ID', () => {
      service.show({ message: 'Test' });
      const toastId = service.toasts()[0]!.id;

      service.close(toastId);

      expect(service.toasts().length).toBe(0);
    });

    it('should not error when closing non-existent toast', () => {
      expect(() => service.close('non-existent-id')).not.toThrow();
    });

    it('should remove only specified toast', () => {
      service.show({ message: 'Toast 1' });
      service.show({ message: 'Toast 2' });
      const toastId = service.toasts()[0]!.id;

      service.close(toastId);

      expect(service.toasts().length).toBe(1);
      expect(service.toasts()[0]!.message).toBe('Toast 2');
    });
  });

  describe('closeAll()', () => {
    it('should remove all toasts', () => {
      service.show({ message: 'Toast 1' });
      service.show({ message: 'Toast 2' });
      service.show({ message: 'Toast 3' });

      service.closeAll();

      expect(service.toasts().length).toBe(0);
    });

    it('should not error when no toasts exist', () => {
      expect(() => service.closeAll()).not.toThrow();
    });
  });

  describe('Server-side rendering', () => {
    it('should not schedule auto-dismiss timers on the server', () => {
      jest.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ToastService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverService = TestBed.inject(ToastService);

      expect(() => serverService.show({ message: 'Test', duration: 1000 })).not.toThrow();
      expect(jest.getTimerCount()).toBe(0);
      jest.advanceTimersByTime(5000);
      expect(serverService.toasts().length).toBe(1);
      jest.useRealTimers();
    });
  });

  describe('Position Groups', () => {
    it('should group toasts by position', () => {
      service.show({ message: 'Top Right 1', position: 'top-right' });
      service.show({ message: 'Top Right 2', position: 'top-right' });
      service.show({ message: 'Bottom Left', position: 'bottom-left' });

      const toasts = service.toasts();
      const topRight = toasts.filter((t) => t.position === 'top-right');
      const bottomLeft = toasts.filter((t) => t.position === 'bottom-left');

      expect(topRight.length).toBe(2);
      expect(bottomLeft.length).toBe(1);
    });
  });

  describe('Actions', () => {
    it('should store action callback', () => {
      const action = { label: 'Undo', onClick: jest.fn() };
      service.show({ message: 'Test', action });

      const toast = service.toasts()[0];
      expect(toast!.action).toBeDefined();
      expect(toast!.action?.label).toBe('Undo');
    });

    it('should execute action callback when clicked', () => {
      const onClick = jest.fn();
      const action = { label: 'Undo', onClick };
      service.show({ message: 'Test', action });

      const toast = service.toasts()[0];
      toast!.action?.onClick();

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Close Button', () => {
    it('should show close button by default', () => {
      service.show({ message: 'Test' });
      const toast = service.toasts()[0];
      expect(toast!.showCloseButton).toBe(true);
    });

    it('should respect showCloseButton option', () => {
      service.show({ message: 'Test', showCloseButton: false });
      const toast = service.toasts()[0];
      expect(toast!.showCloseButton).toBe(false);
    });
  });
});
