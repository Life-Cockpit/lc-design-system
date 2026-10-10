import type { StorybookConfig } from '@storybook/angular';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  stories: [
    '../src/docs/**/*.mdx',
    '../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
  ],
  addons: [
    {
      name: '@storybook/addon-docs',
      // MDX 3 has no GitHub-flavoured Markdown of its own: without remark-gfm
      // the tables in the .mdx docs render as raw pipes.
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    '@storybook/addon-themes',
    '@storybook/addon-mcp',
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  features: {
    componentsManifest: true,
  },
  staticDirs: [
    { from: '../../../node_modules/@tabler/icons/icons', to: '/tabler-icons' },
    { from: '../src/assets', to: '/assets' },
  ],
}

export default config;
