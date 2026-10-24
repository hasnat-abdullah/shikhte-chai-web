import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://shikhtechai.com',
  integrations: [sitemap({ filter: (page) => !page.includes('/admin'), i18n: { defaultLocale: 'bn', locales: { bn: 'bn-BD', en: 'en' } } })],
  redirects: { '/find-help': '/professionals/?view=places', '/en/find-help': '/en/professionals/?view=places' },
  build: { format: 'directory' },
});
