/// <reference types="@cloudflare/vitest-pool-workers" />
import { beforeAll, describe, expect, it } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import type { Bindings } from '../src/env';

declare module 'cloudflare:test' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProvidedEnv extends Bindings {}
}

describe('Worker public routing', () => {
  beforeAll(async () => {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY,slug TEXT,status TEXT,is_en_published INTEGER,title_uk TEXT,title_en TEXT,body_md_uk TEXT,body_md_en TEXT);
      CREATE TABLE IF NOT EXISTS redirects (id TEXT PRIMARY KEY,old_path TEXT,new_path TEXT,status_code INTEGER);
    `);
  });

  it('serves robots as a real text response', async () => {
    const response = await SELF.fetch('https://example.test/robots.txt');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toContain('Disallow: /admin');
  });

  it('permanently normalizes /en to /en/', async () => {
    const response = await SELF.fetch('https://example.test/en', { redirect: 'manual' });
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/en/');
  });

  it('returns an SSR 404 for unknown root pages', async () => {
    const response = await SELF.fetch('https://example.test/no-such-page');
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('404');
  });
});
