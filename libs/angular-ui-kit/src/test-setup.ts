import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

setupZonelessTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

global.ResizeObserver = class ResizeObserver {
  observe() { /* jsdom has no layout — nothing to observe */ }
  unobserve() { /* noop */ }
  disconnect() { /* noop */ }
};
