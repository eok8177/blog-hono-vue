import type { Actor, Bindings } from '../env';
import type { MutationResult } from './mutation';

type Pagination = { page: number; pageSize: number };

export async function listRedirects(env: Bindings, pagination: Pagination) {
  const results = await env.DB.batch([
    env.DB.prepare('SELECT * FROM redirects ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(
      pagination.pageSize,
      (pagination.page - 1) * pagination.pageSize,
    ),
    env.DB.prepare('SELECT count(*) count FROM redirects'),
  ]);

  return {
    items: results[0]!.results,
    total: Number((results[1]!.results[0] as { count: number }).count),
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}

export async function deleteRedirect(
  env: Bindings,
  actor: Actor,
  id: string,
): Promise<MutationResult> {
  const redirect = await env.DB.prepare('SELECT old_path,new_path FROM redirects WHERE id=?')
    .bind(id)
    .first<{ old_path: string; new_path: string }>();
  if (!redirect) return { kind: 'missing' };

  const timestamp = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM redirects WHERE id=?').bind(id),
    env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(
      crypto.randomUUID(),
      actor.id,
      'redirect.delete',
      'redirect',
      id,
      JSON.stringify({ oldPath: redirect.old_path, newPath: redirect.new_path }),
      timestamp,
    ),
  ]);
  return { kind: 'ok', id };
}
