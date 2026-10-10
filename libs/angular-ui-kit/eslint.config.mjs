import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'lc',
          style: 'camelCase',
        },
      ],
      // Components are `lc-*` elements; an attribute selector is allowed for
      // components that must keep a native host element (`a[lcButton]`).
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'lc', style: 'kebab-case' },
          { type: 'attribute', prefix: 'lc', style: 'camelCase' },
        ],
      ],
    },
  },
  {
    // Test hosts and story demos are not shipped. They mutate plain fields and
    // rely on eager change detection, which Angular 22 no longer applies by
    // default — the v22 migration pinned them to `ChangeDetectionStrategy.Eager`.
    // Shipped components stay under the rule: every one declares OnPush
    // explicitly, so the default-strategy change between Angular 21 (Eager) and
    // 22 (OnPush) can never alter how the library renders in either major.
    files: ['**/*.spec.ts', '**/*.stories.ts'],
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
];
