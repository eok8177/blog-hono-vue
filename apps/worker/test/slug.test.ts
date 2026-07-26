/// <reference types="@cloudflare/vitest-pool-workers" />
import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:test';
import type { Bindings, Actor } from '../src/env';

declare module 'cloudflare:test' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProvidedEnv extends Bindings {}
}

const actor: Actor = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'admin@example.test',
  name: 'Admin',
  role: 'admin',
};
const editor: Actor = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'editor@example.test',
  name: 'Editor',
  role: 'editor',
};
const timestamp = '2026-01-01T00:00:00.000Z';

beforeAll(async () => {
  await env.DB.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,is_active INTEGER NOT NULL,last_seen_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY,parent_id TEXT,slug TEXT UNIQUE NOT NULL,title_uk TEXT NOT NULL,title_en TEXT,description_md_uk TEXT,description_md_en TEXT,seo_title_uk TEXT,seo_title_en TEXT,seo_description_uk TEXT,seo_description_en TEXT,status TEXT NOT NULL DEFAULT 'draft',is_en_published INTEGER NOT NULL DEFAULT 0,show_in_menu INTEGER NOT NULL DEFAULT 0,menu_order INTEGER NOT NULL DEFAULT 0,revision INTEGER NOT NULL DEFAULT 0,mutation_id TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY,mime_type TEXT NOT NULL,width INTEGER NOT NULL,height INTEGER NOT NULL,size_bytes INTEGER NOT NULL,alt_uk TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,title_uk TEXT NOT NULL,title_en TEXT,excerpt_uk TEXT,excerpt_en TEXT,body_md_uk TEXT NOT NULL,body_md_en TEXT,status TEXT NOT NULL,is_en_published INTEGER NOT NULL,published_at TEXT,seo_title_uk TEXT,seo_title_en TEXT,seo_description_uk TEXT,seo_description_en TEXT,created_by TEXT NOT NULL,updated_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,mutation_id TEXT);
    CREATE TABLE IF NOT EXISTS post_categories (post_id TEXT NOT NULL,category_id TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(post_id,category_id));
    CREATE TABLE IF NOT EXISTS post_media (post_id TEXT NOT NULL,media_id TEXT NOT NULL,role TEXT NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(post_id,media_id));
    CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,template TEXT NOT NULL DEFAULT 'default',title_uk TEXT NOT NULL,title_en TEXT,body_md_uk TEXT NOT NULL,body_md_en TEXT,status TEXT NOT NULL DEFAULT 'draft',is_en_published INTEGER NOT NULL DEFAULT 0,published_at TEXT,show_in_menu INTEGER NOT NULL DEFAULT 0,menu_order INTEGER NOT NULL DEFAULT 0,seo_title_uk TEXT,seo_title_en TEXT,seo_description_uk TEXT,seo_description_en TEXT,created_by TEXT,updated_by TEXT,revision INTEGER NOT NULL DEFAULT 0,mutation_id TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS page_media (page_id TEXT NOT NULL,media_id TEXT NOT NULL,role TEXT NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(page_id,media_id));
    CREATE TABLE IF NOT EXISTS redirects (id TEXT PRIMARY KEY,old_path TEXT UNIQUE NOT NULL,new_path TEXT NOT NULL,status_code INTEGER NOT NULL,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY,actor_user_id TEXT,action TEXT NOT NULL,entity_type TEXT,entity_id TEXT,metadata_json TEXT NOT NULL,created_at TEXT NOT NULL);
    INSERT OR IGNORE INTO users VALUES ('${actor.id}','${actor.email}','Admin','admin',1,NULL,'${timestamp}','${timestamp}');
    INSERT OR IGNORE INTO users VALUES ('${editor.id}','${editor.email}','Editor','editor',1,NULL,'${timestamp}','${timestamp}');
  `);
});

import { createCategory, updateCategory } from '../src/services/categories';
import { createPage, updatePage } from '../src/services/pages';
import { savePost } from '../src/services/posts';

// ── Categories ───────────────────────────────────────────────────────────

describe('category slug auto-generation', () => {
  it('generates slug from Ukrainian title on create', async () => {
    const ts = Date.now();
    const result = await createCategory(env, {
      titleUk: `Нова Категорія ${ts}`,
      status: 'draft',
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM categories WHERE id=?')
      .bind(result.kind === 'ok' ? result.id : '')
      .first<{ slug: string }>();
    // Auto-generated — transliterates Ukrainian, appends -ts suffix.
    expect(row!.slug).toMatch(/^nova-katehoriia-\d+$/);
  });

  it('does not auto-generate a reserved slug', async () => {
    const result = await createCategory(env, { titleUk: 'Admin', status: 'draft' });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM categories WHERE id=?')
      .bind(result.kind === 'ok' ? result.id : '')
      .first<{ slug: string }>();
    expect(row!.slug).toMatch(/^admin-\d+$/);
  });

  it('appends -2 suffix when slug exists (without excludeId on create)', async () => {
    const ts = Date.now();
    // Create first
    await createCategory(env, { titleUk: `Тест ${ts}`, status: 'draft' });
    // Create second with same title
    const result = await createCategory(env, { titleUk: `Тест ${ts}`, status: 'draft' });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM categories WHERE id=?')
      .bind(result.kind === 'ok' ? result.id : '')
      .first<{ slug: string }>();
    // First gets test-{ts}, second gets test-{ts}-2
    expect(row!.slug).toMatch(/^test-\d+-2$/);
  });

  it('uses caller-provided slug when non-empty', async () => {
    const slug = `my-custom-slug-${Date.now()}`;
    const result = await createCategory(env, {
      slug,
      titleUk: 'Щось',
      status: 'draft',
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM categories WHERE id=?')
      .bind(result.kind === 'ok' ? result.id : '')
      .first<{ slug: string }>();
    expect(row!.slug).toBe(slug);
  });

  it('returns slug_taken when explicit slug collides on create', async () => {
    await createCategory(env, { slug: 'unique-one', titleUk: 'One', status: 'draft' });
    const result = await createCategory(env, { slug: 'unique-one', titleUk: 'Two', status: 'draft' });
    expect(result.kind).toBe('slug_taken');
  });

  it('keeps existing slug on update when slug key is absent', async () => {
    const ts = Date.now();
    const created = await createCategory(env, { titleUk: `Збережена ${ts}`, status: 'draft' });
    expect(created.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT slug,revision FROM categories WHERE id=?')
      .bind(created.id)
      .first<{ slug: string; revision: number }>();

    const result = await updateCategory(env, actor, created.id!, {
      titleUk: 'Оновлена назва',
      status: 'draft',
      version: old!.revision,
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM categories WHERE id=?')
      .bind(created.id)
      .first<{ slug: string }>();
    expect(row!.slug).toBe(old!.slug);
  });

  it('regenerates slug on update when slug is explicitly emptied', async () => {
    const ts = Date.now();
    const created = await createCategory(env, { titleUk: `Стара ${ts}`, status: 'draft' });
    expect(created.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT revision FROM categories WHERE id=?')
      .bind(created.id)
      .first<{ revision: number }>();

    const result = await updateCategory(env, actor, created.id!, {
      slug: '',
      titleUk: `Нова назва ${ts}`,
      status: 'draft',
      version: old!.revision,
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM categories WHERE id=?')
      .bind(created.id)
      .first<{ slug: string }>();
    expect(row!.slug).toMatch(/^nova-nazva-\d+$/);
  });

  it('returns slug_taken when explicit slug collides on update (different entity)', async () => {
    // Use explicit slugs to avoid residue from previous tests.
    const suffix = Date.now();
    const first = await createCategory(env, { slug: `first-${suffix}`, titleUk: 'Перша', status: 'draft' });
    const second = await createCategory(env, { slug: `second-${suffix}`, titleUk: 'Друга', status: 'draft' });
    expect(first.kind).toBe('ok');
    expect(second.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT revision FROM categories WHERE id=?')
      .bind(first.id)
      .first<{ revision: number }>();

    // Try to set first's slug to second's slug
    const result = await updateCategory(env, actor, first.id!, {
      slug: `second-${suffix}`,
      titleUk: 'Перша',
      status: 'draft',
      version: old!.revision,
    });
    expect(result.kind).toBe('slug_taken');
  });

  it('allows same slug on update (no collision when excluding self)', async () => {
    const ts = Date.now();
    const created = await createCategory(env, { titleUk: `Self ${ts}`, status: 'draft' });
    expect(created.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT slug,revision FROM categories WHERE id=?')
      .bind(created.id)
      .first<{ slug: string; revision: number }>();

    const result = await updateCategory(env, actor, created.id!, {
      slug: old!.slug,
      titleUk: 'Self updated',
      status: 'draft',
      version: old!.revision,
    });
    expect(result.kind).toBe('ok');
  });
});

// ── Posts ────────────────────────────────────────────────────────────────

describe('post slug auto-generation', () => {
  it('generates slug from title on create', async () => {
    const ts = Date.now();
    const result = await savePost(env, actor, undefined, {
      titleUk: `Мій перший пост ${ts}`,
      bodyMdUk: 'Текст',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM posts WHERE id=?')
      .bind(result.kind === 'ok' ? result.id : '')
      .first<{ slug: string }>();
    expect(row!.slug).toMatch(/^mii-pershyi-post-\d+$/);
  });

  it('appends -2 on collision for auto-generated post slugs', async () => {
    const ts = Date.now();
    const r1 = await savePost(env, actor, undefined, {
      titleUk: `Копія ${ts}`,
      bodyMdUk: 'Текст',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    expect(r1.kind).toBe('ok');

    const r2 = await savePost(env, actor, undefined, {
      titleUk: `Копія ${ts}`,
      bodyMdUk: 'Текст',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    expect(r2.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM posts WHERE id=?')
      .bind(r2.kind === 'ok' ? r2.id : '')
      .first<{ slug: string }>();
    expect(row!.slug).toMatch(/^kopiia-\d+-2$/);
  });

  it('returns slug_taken when explicit slug collides on create', async () => {
    await savePost(env, actor, undefined, {
      slug: 'explicit-post',
      titleUk: 'One',
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    const result = await savePost(env, actor, undefined, {
      slug: 'explicit-post',
      titleUk: 'Two',
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    expect(result.kind).toBe('slug_taken');
  });

  it('keeps slug on update when slug key absent', async () => {
    const ts = Date.now();
    const created = await savePost(env, actor, undefined, {
      titleUk: `Keep slug ${ts}`,
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    expect(created.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT slug,revision FROM posts WHERE id=?')
      .bind(created.id)
      .first<{ slug: string; revision: number }>();

    const result = await savePost(env, actor, created.id, {
      titleUk: 'New title',
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
      version: old!.revision,
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM posts WHERE id=?')
      .bind(created.id)
      .first<{ slug: string }>();
    expect(row!.slug).toBe(old!.slug);
  });

  it('regenerates slug on update when slug emptied', async () => {
    const ts = Date.now();
    const created = await savePost(env, actor, undefined, {
      titleUk: `Old title ${ts}`,
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    expect(created.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT revision FROM posts WHERE id=?')
      .bind(created.id)
      .first<{ revision: number }>();

    const result = await savePost(env, actor, created.id, {
      slug: '',
      titleUk: `Brand new title ${ts}`,
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
      version: old!.revision,
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM posts WHERE id=?')
      .bind(created.id)
      .first<{ slug: string }>();
    expect(row!.slug).toMatch(/^brand-new-title-\d+$/);
  });

  it('returns slug_taken on update when explicit slug collides with another post', async () => {
    const ts = Date.now();
    const p1 = await savePost(env, actor, undefined, {
      slug: `post-a-${ts}`,
      titleUk: 'First',
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    const p2 = await savePost(env, actor, undefined, {
      slug: `post-b-${ts}`,
      titleUk: 'Second',
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
    });
    expect(p1.kind).toBe('ok');
    expect(p2.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT revision FROM posts WHERE id=?')
      .bind(p1.id)
      .first<{ revision: number }>();

    const result = await savePost(env, actor, p1.id, {
      slug: `post-b-${ts}`,
      titleUk: 'First',
      bodyMdUk: 'Body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
      version: old!.revision,
    });
    expect(result.kind).toBe('slug_taken');
  });
});

// ── Pages ─────────────────────────────────────────────────────────────────

describe('page slug auto-generation', () => {
  it('generates slug from title on create', async () => {
    const ts = Date.now();
    const result = await createPage(env, actor, {
      titleUk: `Про нас ${ts}`,
      bodyMdUk: 'Текст про нас',
      status: 'draft',
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM pages WHERE id=?')
      .bind(result.kind === 'ok' ? result.id : '')
      .first<{ slug: string }>();
    expect(row!.slug).toMatch(/^pro-nas-\d+$/);
  });

  it('appends -2 on slug collision for pages', async () => {
    const ts = Date.now();
    const r1 = await createPage(env, actor, { titleUk: `Дубль ${ts}`, bodyMdUk: 'Text', status: 'draft' });
    const r2 = await createPage(env, actor, { titleUk: `Дубль ${ts}`, bodyMdUk: 'Text', status: 'draft' });
    expect(r1.kind).toBe('ok');
    expect(r2.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM pages WHERE id=?')
      .bind(r2.kind === 'ok' ? r2.id : '')
      .first<{ slug: string }>();
    expect(row!.slug).toMatch(/^dubl-\d+-2$/);
  });

  it('returns slug_taken when explicit slug collides on create', async () => {
    await createPage(env, actor, { slug: 'contact', titleUk: 'One', bodyMdUk: 'Text', status: 'draft' });
    const result = await createPage(env, actor, { slug: 'contact', titleUk: 'Two', bodyMdUk: 'Text', status: 'draft' });
    expect(result.kind).toBe('slug_taken');
  });

  it('keeps slug on update when key absent', async () => {
    const ts = Date.now();
    const created = await createPage(env, actor, { titleUk: `Збережи ${ts}`, bodyMdUk: 'Text', status: 'draft' });
    expect(created.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT slug,revision FROM pages WHERE id=?')
      .bind(created.id)
      .first<{ slug: string; revision: number }>();

    const result = await updatePage(env, actor, created.id!, {
      titleUk: 'Оновлено',
      bodyMdUk: 'Text',
      status: 'draft',
      version: old!.revision,
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM pages WHERE id=?')
      .bind(created.id)
      .first<{ slug: string }>();
    expect(row!.slug).toBe(old!.slug);
  });

  it('regenerates slug when emptied on update', async () => {
    const ts = Date.now();
    const created = await createPage(env, actor, { titleUk: `Було ${ts}`, bodyMdUk: 'Text', status: 'draft' });
    expect(created.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT revision FROM pages WHERE id=?')
      .bind(created.id)
      .first<{ revision: number }>();

    const result = await updatePage(env, actor, created.id!, {
      slug: '',
      titleUk: `Стало ${ts}`,
      bodyMdUk: 'Text',
      status: 'draft',
      version: old!.revision,
    });
    expect(result.kind).toBe('ok');

    const row = await env.DB.prepare('SELECT slug FROM pages WHERE id=?')
      .bind(created.id)
      .first<{ slug: string }>();
    expect(row!.slug).toMatch(/^stalo-\d+$/);
  });

  it('returns slug_taken on update when slug collides with another page', async () => {
    const ts = Date.now();
    const p1 = await createPage(env, actor, { slug: `page-a-${ts}`, titleUk: 'A', bodyMdUk: 'Text', status: 'draft' });
    const p2 = await createPage(env, actor, { slug: `page-b-${ts}`, titleUk: 'B', bodyMdUk: 'Text', status: 'draft' });
    expect(p1.kind).toBe('ok');
    expect(p2.kind).toBe('ok');

    const old = await env.DB.prepare('SELECT revision FROM pages WHERE id=?')
      .bind(p1.id)
      .first<{ revision: number }>();

    const result = await updatePage(env, actor, p1.id!, {
      slug: `page-b-${ts}`,
      titleUk: 'A',
      bodyMdUk: 'Text',
      status: 'draft',
      version: old!.revision,
    });
    expect(result.kind).toBe('slug_taken');
  });
});

// ── Concurrent slug creation (race condition guard) ──────────────────────

describe('concurrent slug uniqueness', () => {
  it('does not produce duplicate slugs under concurrent creation', async () => {
    const title = `Race${Date.now()}`;
    // Fire 5 concurrent creates with the same title
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        createCategory(env, { titleUk: title, status: 'draft' }),
      ),
    );

    const okResults = results.filter((r) => r.kind === 'ok');
    expect(okResults.length).toBe(5);

    // Verify all slugs are unique
    const slugs = await Promise.all(
      okResults.map(async (r) => {
        const row = await env.DB.prepare('SELECT slug FROM categories WHERE id=?')
          .bind(r.id)
          .first<{ slug: string }>();
        return row!.slug;
      }),
    );
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(5);
  });
});
