import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import csp from './integrations/csp.mjs';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const origin = (url) => { try { return new URL(url).origin; } catch { return ''; } };

export default defineConfig({
  site: 'https://shikhtechai.com',
  integrations: [
    sitemap({ filter: (page) => !page.includes('/admin'), i18n: { defaultLocale: 'bn', locales: { bn: 'bn-BD', en: 'en' } } }),
    // Must stay last: it hashes the final HTML.
    csp({
      images: ['https://i.ytimg.com'],
      frames: ['https://www.youtube-nocookie.com'],
      connect: ['https://api.web3forms.com', origin(env.PUBLIC_SUPABASE_URL)].filter(Boolean),
    }),
  ],
  redirects: { '/find-help': '/professionals/?view=places', '/en/find-help': '/en/professionals/?view=places' },
  build: {
    format: 'directory',
    // Each page's CSS is small (under 20 KB), so it is put in the page itself: no extra request blocks the first paint.
    inlineStylesheets: 'always',
  },
});
