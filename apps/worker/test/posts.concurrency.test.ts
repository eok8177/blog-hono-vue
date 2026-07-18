/// <reference types="@cloudflare/vitest-pool-workers" />
import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:test';
import { savePost } from '../src/services/posts';
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
const postId = '00000000-0000-4000-8000-000000000010';
const categoryId = '00000000-0000-4000-8000-000000000020';
const mediaId = '00000000-0000-4000-8000-000000000030';
const version = '2026-01-01T00:00:00.000Z';
const revision = 0;

beforeAll(async () => {
  await env.DB.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,is_active INTEGER NOT NULL,last_seen_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE categories (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,title_uk TEXT NOT NULL,status TEXT NOT NULL,updated_at TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE media (id TEXT PRIMARY KEY,mime_type TEXT NOT NULL,width INTEGER NOT NULL,height INTEGER NOT NULL,size_bytes INTEGER NOT NULL,alt_uk TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE posts (id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,title_uk TEXT NOT NULL,title_en TEXT,excerpt_uk TEXT,excerpt_en TEXT,body_md_uk TEXT NOT NULL,body_md_en TEXT,status TEXT NOT NULL,is_en_published INTEGER NOT NULL,published_at TEXT,seo_title_uk TEXT,seo_title_en TEXT,seo_description_uk TEXT,seo_description_en TEXT,created_by TEXT NOT NULL,updated_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,mutation_id TEXT);
    CREATE TABLE post_categories (post_id TEXT NOT NULL,category_id TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(post_id,category_id));
    CREATE TABLE post_media (post_id TEXT NOT NULL,media_id TEXT NOT NULL,role TEXT NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(post_id,media_id));
    CREATE TABLE redirects (id TEXT PRIMARY KEY,old_path TEXT UNIQUE NOT NULL,new_path TEXT NOT NULL,status_code INTEGER NOT NULL,entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE audit_logs (id TEXT PRIMARY KEY,actor_user_id TEXT,action TEXT NOT NULL,entity_type TEXT,entity_id TEXT,metadata_json TEXT NOT NULL,created_at TEXT NOT NULL);
    INSERT INTO users VALUES ('${actor.id}','${actor.email}','Admin','admin',1,NULL,'${version}','${version}');
    INSERT INTO categories VALUES ('${categoryId}','old-category','Category','published','${version}','${version}');
    INSERT INTO media VALUES ('${mediaId}','image/webp',10,10,1,'Image','ready','${version}','${version}');
    INSERT INTO posts VALUES ('${postId}','old-slug','Old',NULL,NULL,NULL,'Body',NULL,'draft',0,NULL,NULL,NULL,NULL,NULL,'${actor.id}','${actor.id}','${version}','${version}',0,NULL);
    INSERT INTO post_categories VALUES ('${postId}','${categoryId}','${version}');
    INSERT INTO post_media VALUES ('${postId}','${mediaId}','gallery',0);
  `);
});

describe('post optimistic concurrency', () => {
  it('does not mutate relations, redirects, or audit on a stale update', async () => {
    const result = await savePost(env, actor, postId, {
      slug: 'new-slug',
      titleUk: 'New title',
      bodyMdUk: 'New body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [],
      mediaIds: [],
      version: 1,
    });

    expect(result.kind).toBe('conflict');
    expect(await env.DB.prepare('SELECT slug FROM posts WHERE id=?').bind(postId).first()).toEqual({
      slug: 'old-slug',
    });
    expect(
      await env.DB.prepare('SELECT count(*) count FROM post_categories WHERE post_id=?')
        .bind(postId)
        .first(),
    ).toEqual({ count: 1 });
    expect(
      await env.DB.prepare('SELECT count(*) count FROM post_media WHERE post_id=?')
        .bind(postId)
        .first(),
    ).toEqual({ count: 1 });
    expect(await env.DB.prepare('SELECT count(*) count FROM redirects').first()).toEqual({
      count: 0,
    });
    expect(await env.DB.prepare('SELECT count(*) count FROM audit_logs').first()).toEqual({
      count: 0,
    });
  });

  it('updates relations and records one audit event with the current version', async () => {
    const result = await savePost(env, actor, postId, {
      slug: 'new-slug',
      titleUk: 'New title',
      bodyMdUk: 'New body',
      status: 'draft',
      isEnPublished: false,
      categoryIds: [categoryId],
      mediaIds: [mediaId],
      version: revision,
    });

    expect(result.kind).toBe('ok');
    expect(await env.DB.prepare('SELECT slug FROM posts WHERE id=?').bind(postId).first()).toEqual({
      slug: 'new-slug',
    });
    expect(
      await env.DB.prepare('SELECT count(*) count FROM post_categories WHERE post_id=?')
        .bind(postId)
        .first(),
    ).toEqual({ count: 1 });
    expect(
      await env.DB.prepare('SELECT count(*) count FROM post_media WHERE post_id=?')
        .bind(postId)
        .first(),
    ).toEqual({ count: 1 });
    expect(await env.DB.prepare('SELECT count(*) count FROM redirects').first()).toEqual({
      count: 2,
    });
    expect(await env.DB.prepare('SELECT count(*) count FROM audit_logs').first()).toEqual({
      count: 1,
    });
  });

  it('allows only one of two simultaneous saves with the same revision', async () => {
    const current = await env.DB.prepare('SELECT revision FROM posts WHERE id=?')
      .bind(postId)
      .first<{ revision: number }>();
    const auditBefore = await env.DB.prepare('SELECT count(*) count FROM audit_logs').first<{
      count: number;
    }>();
    const redirectsBefore = await env.DB.prepare('SELECT count(*) count FROM redirects').first<{
      count: number;
    }>();
    const payload = {
      titleUk: 'Concurrent title',
      bodyMdUk: 'Concurrent body',
      status: 'draft' as const,
      isEnPublished: false,
      categoryIds: [categoryId],
      mediaIds: [mediaId],
      version: current!.revision,
    };
    const [first, second] = await Promise.all([
      savePost(env, actor, postId, { ...payload, slug: 'concurrent-one' }),
      savePost(env, actor, postId, { ...payload, slug: 'concurrent-two' }),
    ]);

    expect([first.kind, second.kind].sort()).toEqual(['conflict', 'ok']);
    expect(await env.DB.prepare('SELECT count(*) count FROM audit_logs').first()).toEqual({
      count: auditBefore!.count + 1,
    });
    expect(await env.DB.prepare('SELECT count(*) count FROM redirects').first()).toEqual({
      count: redirectsBefore!.count + 2,
    });
  });

  it('changes publication status through a regular save', async () => {
    const current = await env.DB.prepare('SELECT revision,slug FROM posts WHERE id=?')
      .bind(postId)
      .first<{ revision: number; slug: string }>();
    const published = await savePost(env, actor, postId, {
      slug: current!.slug,
      titleUk: 'Published title',
      bodyMdUk: 'Published body',
      status: 'published',
      isEnPublished: false,
      categoryIds: [categoryId],
      mediaIds: [mediaId],
      version: current!.revision,
    });
    expect(published.kind).toBe('ok');
    expect(
      await env.DB.prepare('SELECT status FROM posts WHERE id=?').bind(postId).first(),
    ).toEqual({
      status: 'published',
    });

    const archived = await savePost(env, actor, postId, {
      slug: current!.slug,
      titleUk: 'Archived title',
      bodyMdUk: 'Archived body',
      status: 'archived',
      isEnPublished: false,
      categoryIds: [categoryId],
      mediaIds: [mediaId],
      version: published.kind === 'ok' ? published.revision : -1,
    });
    expect(archived.kind).toBe('ok');
    expect(
      await env.DB.prepare('SELECT status FROM posts WHERE id=?').bind(postId).first(),
    ).toEqual({
      status: 'archived',
    });
  });
});
