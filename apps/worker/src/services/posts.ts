import { drizzle } from 'drizzle-orm/d1';
import { postInputSchema, type Locale } from '@fauna/shared';
import { now } from '../utils/content';
import type { Bindings, Actor } from '../env';
export async function listPublished(env: Bindings, locale: Locale, limit = 10) {
  const translation = locale === 'en' ? ' AND is_en_published=1' : '';
  return env.DB.prepare(
    `SELECT id,slug,title_${locale} title,excerpt_${locale} excerpt,published_at,updated_at FROM posts WHERE status='published'${translation} ORDER BY published_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all();
}
export async function findPost(env: Bindings, slug: string, locale: Locale) {
  const translation = locale === 'en' ? ' AND is_en_published=1' : '';
  return env.DB.prepare(`SELECT * FROM posts WHERE slug=? AND status='published'${translation}`)
    .bind(slug)
    .first<Record<string, unknown>>();
}
export async function savePost(env: Bindings, actor: Actor, id: string | undefined, body: unknown) {
  const data = postInputSchema.parse(body);
  const db = drizzle(env.DB);
  void db;
  const timestamp = now();
  const existing = id
    ? await env.DB.prepare('SELECT updated_at,slug FROM posts WHERE id=?')
        .bind(id)
        .first<{ updated_at: string; slug: string }>()
    : null;
  if (id && !existing) return { kind: 'missing' as const };
  if (existing && data.version && data.version !== existing.updated_at)
    return { kind: 'conflict' as const };
  const postId = id ?? crypto.randomUUID();
  const publishedAt = data.status === 'published' ? timestamp : null;
  const statement = id
    ? env.DB.prepare(
        `UPDATE posts SET slug=?,title_uk=?,title_en=?,excerpt_uk=?,excerpt_en=?,body_md_uk=?,body_md_en=?,status=?,is_en_published=?,published_at=COALESCE(published_at,?),seo_title_uk=?,seo_title_en=?,seo_description_uk=?,seo_description_en=?,updated_by=?,updated_at=? WHERE id=?`,
      ).bind(
        data.slug,
        data.titleUk,
        data.titleEn ?? null,
        data.excerptUk ?? null,
        data.excerptEn ?? null,
        data.bodyMdUk,
        data.bodyMdEn ?? null,
        data.status,
        Number(data.isEnPublished),
        publishedAt,
        data.seoTitleUk ?? null,
        data.seoTitleEn ?? null,
        data.seoDescriptionUk ?? null,
        data.seoDescriptionEn ?? null,
        actor.id,
        timestamp,
        postId,
      )
    : env.DB.prepare(
        `INSERT INTO posts (id,slug,title_uk,title_en,excerpt_uk,excerpt_en,body_md_uk,body_md_en,status,is_en_published,published_at,seo_title_uk,seo_title_en,seo_description_uk,seo_description_en,created_by,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        postId,
        data.slug,
        data.titleUk,
        data.titleEn ?? null,
        data.excerptUk ?? null,
        data.excerptEn ?? null,
        data.bodyMdUk,
        data.bodyMdEn ?? null,
        data.status,
        Number(data.isEnPublished),
        publishedAt,
        data.seoTitleUk ?? null,
        data.seoTitleEn ?? null,
        data.seoDescriptionUk ?? null,
        data.seoDescriptionEn ?? null,
        actor.id,
        actor.id,
        timestamp,
        timestamp,
      );
  const categoryDeletes = env.DB.prepare('DELETE FROM post_categories WHERE post_id=?').bind(
    postId,
  );
  const categoryInserts = data.categoryIds.map((categoryId) =>
    env.DB.prepare(
      'INSERT INTO post_categories(post_id,category_id,created_at) VALUES(?,?,?)',
    ).bind(postId, categoryId, timestamp),
  );
  const mediaDeletes = env.DB.prepare('DELETE FROM post_media WHERE post_id=?').bind(postId);
  const mediaInserts = data.mediaIds.map((mediaId, position) =>
    env.DB.prepare('INSERT INTO post_media(post_id,media_id,role,position) VALUES(?,?,?,?)').bind(
      postId,
      mediaId,
      'gallery',
      position,
    ),
  );
  const redirects =
    existing && existing.slug !== data.slug
      ? [
          // Point all prior aliases straight at the new canonical path, then add the just-replaced slug.
          env.DB.prepare(
            "UPDATE redirects SET new_path=? WHERE entity_type='post' AND entity_id=?",
          ).bind(`/post/${data.slug}`, postId),
          env.DB.prepare('DELETE FROM redirects WHERE old_path=?').bind(`/post/${data.slug}`),
          env.DB.prepare(
            'INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) VALUES(?,?,?,?,?,?,?)',
          ).bind(
            crypto.randomUUID(),
            `/post/${existing.slug}`,
            `/post/${data.slug}`,
            301,
            'post',
            postId,
            timestamp,
          ),
        ]
      : [];
  const audit = env.DB.prepare(
    'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
  ).bind(
    crypto.randomUUID(),
    actor.id,
    id ? 'post.update' : 'post.create',
    'post',
    postId,
    JSON.stringify({ slug: data.slug, status: data.status, englishPublished: data.isEnPublished }),
    timestamp,
  );
  await env.DB.batch([
    statement,
    categoryDeletes,
    ...categoryInserts,
    mediaDeletes,
    ...mediaInserts,
    ...redirects,
    audit,
  ]);
  return { kind: 'ok' as const, id: postId };
}
