// Adds a Content-Security-Policy <meta> tag to every built page.
//
// GitHub Pages cannot send custom response headers, so the policy has to live in the HTML. Every inline
// <script> on a page is allowed by its SHA-256 hash, which means scripts injected by anyone else (a
// compromised third party, a stored-XSS payload) do not run. JSON data blocks are not executed, so they
// need no hash. The hashes are computed from the final files, after Astro has written them.
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DATA_TYPES = new Set(['application/json', 'application/ld+json']);

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

/** The sha256 sources for the page's inline scripts. */
export function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(attrs) || !body) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type && DATA_TYPES.has(type)) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  return [...hashes];
}

export function policy({ hashes, connect, images, frames }) {
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    // style="" attributes are used for per-topic colours; styles cannot run code, so inline styles stay allowed.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${images.join(' ')}`,
    "font-src 'self'",
    `connect-src 'self' ${connect.join(' ')}`,
    `frame-src ${frames.join(' ')}`,
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * @param {{ connect?: string[], images?: string[], frames?: string[] }} options origins the pages may talk to
 */
export default function csp({ connect = [], images = [], frames = [] } = {}) {
  return {
    name: 'shikhte-chai:csp',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let pages = 0;
        for await (const file of htmlFiles(fileURLToPath(dir))) {
          const html = await readFile(file, 'utf8');
          if (html.includes('http-equiv="Content-Security-Policy"')) continue;
          const meta = `<meta http-equiv="Content-Security-Policy" content="${policy({ hashes: inlineScriptHashes(html), connect, images, frames })}">`;
          // The policy only covers what comes after it, so it goes straight after <meta charset>.
          // Astro's redirect stubs have no <meta charset>; there the tag goes right after <!doctype html>.
          let out = html.replace(/(<meta charset="?utf-8"?\s*\/?>)/i, `$1${meta}`);
          if (out === html) out = html.replace(/^(<!doctype html>)/i, `$1${meta}`);
          if (out === html) { logger.warn(`could not place the CSP in ${path.relative(fileURLToPath(dir), file)}`); continue; }
          await writeFile(file, out);
          pages++;
        }
        logger.info(`Content-Security-Policy added to ${pages} pages`);
      },
    },
  };
}
