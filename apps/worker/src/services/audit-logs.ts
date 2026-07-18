import type { Bindings } from '../env';

type Pagination = { page: number; pageSize: number };

export async function listAuditLogs(env: Bindings, pagination: Pagination) {
  const results = await env.DB.batch([
    env.DB.prepare(
      'SELECT audit_logs.id,audit_logs.action,audit_logs.entity_type,audit_logs.entity_id,audit_logs.metadata_json,audit_logs.created_at,users.email actor_email FROM audit_logs LEFT JOIN users ON users.id=audit_logs.actor_user_id ORDER BY audit_logs.created_at DESC LIMIT ? OFFSET ?',
    ).bind(pagination.pageSize, (pagination.page - 1) * pagination.pageSize),
    env.DB.prepare('SELECT count(*) count FROM audit_logs'),
  ]);

  return {
    items: results[0]!.results,
    total: Number((results[1]!.results[0] as { count: number }).count),
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}
