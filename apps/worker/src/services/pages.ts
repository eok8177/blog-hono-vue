import { pageInputSchema } from '@fauna/shared';
import type { Actor, Bindings } from '../env';
import type { MutationResult } from './mutation';

type Pagination = { page: number; pageSize: number };

export async function listAdminPages(env: Bindings, pagination: Pagination, search: string) {
  const where = search ? 'WHERE title_uk LIKE ? OR title_en LIKE ?' : '';
  const args = search ? [`%${search}%`, `%${search}%`] : [];
  const results = await env.DB.batch([
    env.DB.prepare(`SELECT * FROM pages ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).bind(
      ...args,
      pagination.pageSize,
      (pagination.page - 1) * pagination.pageSize,
    ),
    env.DB.prepare(`SELECT count(*) count FROM pages ${where}`).bind(...args),
  ]);

  return {
    items: results[0]!.results,
    total: Number((results[1]!.results[0] as { count: number }).count),
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}

export async function findAdminPage(env: Bindings, id: string) {
  return env.DB.prepare('SELECT * FROM pages WHERE id=?').bind(id).first<Record<string, unknown>>();
}

export async function createPage(
  env: Bindings,
  actor: Actor,
  body: unknown,
): Promise<MutationResult> {
  const data = pageInputSchema.parse(body);
  const collision = await env.DB.prepare('SELECT id FROM pages WHERE slug=?')
    .bind(data.slug)
    .first();
  if (collision) return { kind: 'slug_taken' };

  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO pages(id,slug,template,title_uk,title_en,body_md_uk,body_md_en,status,is_en_published,published_at,show_in_menu,menu_order,seo_title_uk,seo_title_en,seo_description_uk,seo_description_en,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  )
    .bind(
      id,
      data.slug,
      data.template,
      data.titleUk,
      data.titleEn ?? null,
      data.bodyMdUk,
      data.bodyMdEn ?? null,
      data.status,
      Number(data.status === 'archived' ? false : data.isEnPublished),
      data.status === 'published' ? timestamp : null,
      Number(data.showInMenu),
      data.menuOrder,
      data.seoTitleUk ?? null,
      data.seoTitleEn ?? null,
      data.seoDescriptionUk ?? null,
      data.seoDescriptionEn ?? null,
      actor.id,
      actor.id,
      timestamp,
      timestamp,
    )
    .run();
  return { kind: 'ok', id };
}

export async function updatePage(
  env: Bindings,
  actor: Actor,
  pageId: string,
  body: unknown,
): Promise<MutationResult> {
  const data = pageInputSchema.parse(body);
  if (data.version === undefined) return { kind: 'invalid' };
  const old = await env.DB.prepare('SELECT slug,status,revision FROM pages WHERE id=?')
    .bind(pageId)
    .first<{ slug: string; status: string; revision: number }>();
  if (!old) return { kind: 'missing' };

  const timestamp = new Date().toISOString();
  const mutationId = crypto.randomUUID();
  const nextRevision = data.version + 1;
  const guard = 'EXISTS (SELECT 1 FROM pages WHERE id=? AND revision=? AND mutation_id=?)';
  const guardArgs = [pageId, nextRevision, mutationId];
  const changes: D1PreparedStatement[] = [
    env.DB.prepare(
      "UPDATE pages SET slug=?,template=?,title_uk=?,title_en=?,body_md_uk=?,body_md_en=?,status=?,is_en_published=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END,show_in_menu=?,menu_order=?,seo_title_uk=?,seo_title_en=?,seo_description_uk=?,seo_description_en=?,updated_by=?,updated_at=?,revision=revision+1,mutation_id=? WHERE id=? AND revision=?",
    ).bind(
      data.slug,
      data.template,
      data.titleUk,
      data.titleEn ?? null,
      data.bodyMdUk,
      data.bodyMdEn ?? null,
      data.status,
      Number(data.status === 'archived' ? false : data.isEnPublished),
      data.status,
      timestamp,
      Number(data.showInMenu),
      data.menuOrder,
      data.seoTitleUk ?? null,
      data.seoTitleEn ?? null,
      data.seoDescriptionUk ?? null,
      data.seoDescriptionEn ?? null,
      actor.id,
      timestamp,
      mutationId,
      pageId,
      data.version,
    ),
  ];
  changes.push(
    env.DB.prepare(
      `INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
    ).bind(
      crypto.randomUUID(),
      actor.id,
      old.status === data.status ? 'page.update' : 'page.status_change',
      'page',
      pageId,
      JSON.stringify({ slug: data.slug, status: data.status, previousStatus: old.status }),
      timestamp,
      ...guardArgs,
    ),
  );
  if (old.slug !== data.slug) {
    changes.push(
      env.DB.prepare(
        `UPDATE redirects SET new_path=CASE WHEN old_path LIKE '/en/%' THEN ? ELSE ? END WHERE entity_type='page' AND entity_id=? AND ${guard}`,
      ).bind(`/en/${data.slug}`, `/${data.slug}`, pageId, ...guardArgs),
      env.DB.prepare(`DELETE FROM redirects WHERE old_path IN (?,?) AND ${guard}`).bind(
        `/${data.slug}`,
        `/en/${data.slug}`,
        ...guardArgs,
      ),
      env.DB.prepare(
        `INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
      ).bind(
        crypto.randomUUID(),
        `/${old.slug}`,
        `/${data.slug}`,
        301,
        'page',
        pageId,
        timestamp,
        ...guardArgs,
      ),
      env.DB.prepare(
        `INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
      ).bind(
        crypto.randomUUID(),
        `/en/${old.slug}`,
        `/en/${data.slug}`,
        301,
        'page',
        pageId,
        timestamp,
        ...guardArgs,
      ),
    );
  }
  const results = await env.DB.batch(changes);
  if (!results[0]?.meta.changes) return { kind: 'conflict' };
  return { kind: 'ok', id: pageId, updatedAt: timestamp, revision: nextRevision };
}

export async function deletePage(env: Bindings, actor: Actor, id: string): Promise<MutationResult> {
  const page = await env.DB.prepare('SELECT id,slug FROM pages WHERE id=?')
    .bind(id)
    .first<{ id: string; slug: string }>();
  if (!page) return { kind: 'missing' };

  const timestamp = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM page_media WHERE page_id=?').bind(id),
    env.DB.prepare("DELETE FROM redirects WHERE entity_type='page' AND entity_id=?").bind(id),
    env.DB.prepare('DELETE FROM pages WHERE id=?').bind(id),
    env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(
      crypto.randomUUID(),
      actor.id,
      'page.delete',
      'page',
      id,
      JSON.stringify({ slug: page.slug }),
      timestamp,
    ),
  ]);
  return { kind: 'ok', id };
}
