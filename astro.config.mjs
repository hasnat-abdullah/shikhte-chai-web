import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://shikhtechai.com',
  integrations: [sitemap({ filter: (page) => !page.includes('/admin'), i18n: { defaultLocale: 'bn', locales: { bn: 'bn-BD', en: 'en' } } })],
  build: { format: 'directory' },
});
