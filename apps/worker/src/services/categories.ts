import { categoryInputSchema } from '@fauna/shared';
import type { Actor, Bindings } from '../env';
import type { MutationResult } from './mutation';

type Pagination = { page: number; pageSize: number };

export async function listAdminCategories(env: Bindings, pagination: Pagination, search: string) {
  const where = search ? 'WHERE title_uk LIKE ? OR title_en LIKE ?' : '';
  const args = search ? [`%${search}%`, `%${search}%`] : [];
  const results = await env.DB.batch([
    env.DB.prepare(
      `SELECT * FROM categories ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    ).bind(...args, pagination.pageSize, (pagination.page - 1) * pagination.pageSize),
    env.DB.prepare(`SELECT count(*) count FROM categories ${where}`).bind(...args),
  ]);

  return {
    items: results[0]!.results,
    total: Number((results[1]!.results[0] as { count: number }).count),
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}

export async function findAdminCategory(env: Bindings, id: string) {
  return env.DB.prepare('SELECT * FROM categories WHERE id=?').bind(id).first();
}

async function categoryCreatesCycle(
  env: Bindings,
  id: string | undefined,
  parentId: string | null,
) {
  if (!parentId) return false;
  if (id && id === parentId) return true;

  const result = await env.DB.prepare(
    `WITH RECURSIVE ancestors(id) AS (
        SELECT ? UNION ALL SELECT c.parent_id FROM categories c JOIN ancestors a ON c.id=a.id WHERE c.parent_id IS NOT NULL
      ) SELECT 1 FROM ancestors WHERE id=? LIMIT 1`,
  )
    .bind(parentId, id ?? '')
    .first();
  return Boolean(result);
}

export async function createCategory(env: Bindings, body: unknown): Promise<MutationResult> {
  const data = categoryInputSchema.parse(body);
  if (await categoryCreatesCycle(env, undefined, data.parentId ?? null)) return { kind: 'cycle' };
  const collision = await env.DB.prepare('SELECT id FROM categories WHERE slug=?')
    .bind(data.slug)
    .first();
  if (collision) return { kind: 'slug_taken' };

  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO categories(id,parent_id,slug,title_uk,title_en,description_md_uk,description_md_en,status,is_en_published,show_in_menu,menu_order,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
  )
    .bind(
      id,
      data.parentId ?? null,
      data.slug,
      data.titleUk,
      data.titleEn ?? null,
      data.descriptionMdUk ?? null,
      data.descriptionMdEn ?? null,
      data.status,
      Number(data.status === 'archived' ? false : data.isEnPublished),
      Number(data.showInMenu),
      data.menuOrder,
      timestamp,
      timestamp,
    )
    .run();
  return { kind: 'ok', id };
}

export async function updateCategory(
  env: Bindings,
  actor: Actor,
  categoryId: string,
  body: unknown,
): Promise<MutationResult> {
  const data = categoryInputSchema.parse(body);
  if (data.version === undefined) return { kind: 'invalid' };
  if (await categoryCreatesCycle(env, categoryId, data.parentId ?? null)) return { kind: 'cycle' };

  const old = await env.DB.prepare('SELECT slug,status,revision FROM categories WHERE id=?')
    .bind(categoryId)
    .first<{ slug: string; status: string; revision: number }>();
  if (!old) return { kind: 'missing' };

  const timestamp = new Date().toISOString();
  const mutationId = crypto.randomUUID();
  const nextRevision = data.version + 1;
  const guard = 'EXISTS (SELECT 1 FROM categories WHERE id=? AND revision=? AND mutation_id=?)';
  const guardArgs = [categoryId, nextRevision, mutationId];
  const changes: D1PreparedStatement[] = [
    env.DB.prepare(
      'UPDATE categories SET parent_id=?,slug=?,title_uk=?,title_en=?,description_md_uk=?,description_md_en=?,status=?,is_en_published=?,show_in_menu=?,menu_order=?,updated_at=?,revision=revision+1,mutation_id=? WHERE id=? AND revision=?',
    ).bind(
      data.parentId ?? null,
      data.slug,
      data.titleUk,
      data.titleEn ?? null,
      data.descriptionMdUk ?? null,
      data.descriptionMdEn ?? null,
      data.status,
      Number(data.status === 'archived' ? false : data.isEnPublished),
      Number(data.showInMenu),
      data.menuOrder,
      timestamp,
      mutationId,
      categoryId,
      data.version,
    ),
  ];
  changes.push(
    env.DB.prepare(
      `INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
    ).bind(
      crypto.randomUUID(),
      actor.id,
      old.status === data.status ? 'category.update' : 'category.status_change',
      'category',
      categoryId,
      JSON.stringify({ slug: data.slug, status: data.status, previousStatus: old.status }),
      timestamp,
      ...guardArgs,
    ),
  );
  if (old.slug !== data.slug) {
    changes.push(
      env.DB.prepare(
        `UPDATE redirects SET new_path=CASE WHEN old_path LIKE '/en/%' THEN ? ELSE ? END WHERE entity_type='category' AND entity_id=? AND ${guard}`,
      ).bind(`/en/category/${data.slug}`, `/category/${data.slug}`, categoryId, ...guardArgs),
      env.DB.prepare(`DELETE FROM redirects WHERE old_path IN (?,?) AND ${guard}`).bind(
        `/category/${data.slug}`,
        `/en/category/${data.slug}`,
        ...guardArgs,
      ),
      env.DB.prepare(
        `INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
      ).bind(
        crypto.randomUUID(),
        `/category/${old.slug}`,
        `/category/${data.slug}`,
        301,
        'category',
        categoryId,
        timestamp,
        ...guardArgs,
      ),
      env.DB.prepare(
        `INSERT INTO redirects(id,old_path,new_path,status_code,entity_type,entity_id,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard}`,
      ).bind(
        crypto.randomUUID(),
        `/en/category/${old.slug}`,
        `/en/category/${data.slug}`,
        301,
        'category',
        categoryId,
        timestamp,
        ...guardArgs,
      ),
    );
  }
  const results = await env.DB.batch(changes);
  if (!results[0]?.meta.changes) return { kind: 'conflict' };
  return { kind: 'ok', id: categoryId, updatedAt: timestamp, revision: nextRevision };
}

export async function deleteCategory(
  env: Bindings,
  actor: Actor,
  id: string,
): Promise<MutationResult> {
  const category = await env.DB.prepare('SELECT id,slug FROM categories WHERE id=?')
    .bind(id)
    .first<{ id: string; slug: string }>();
  if (!category) return { kind: 'missing' };

  const dependencies = await env.DB.batch([
    env.DB.prepare('SELECT count(*) count FROM post_categories WHERE category_id=?').bind(id),
    env.DB.prepare('SELECT count(*) count FROM categories WHERE parent_id=?').bind(id),
  ]);
  const posts = Number((dependencies[0]!.results[0] as { count: number }).count);
  const children = Number((dependencies[1]!.results[0] as { count: number }).count);
  if (posts || children) return { kind: 'in_use' };

  const timestamp = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM category_media WHERE category_id=?').bind(id),
    env.DB.prepare("DELETE FROM redirects WHERE entity_type='category' AND entity_id=?").bind(id),
    env.DB.prepare('DELETE FROM categories WHERE id=?').bind(id),
    env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(
      crypto.randomUUID(),
      actor.id,
      'category.delete',
      'category',
      id,
      JSON.stringify({ slug: category.slug }),
      timestamp,
    ),
  ]);
  return { kind: 'ok', id };
}
