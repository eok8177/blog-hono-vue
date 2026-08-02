import type { Actor, Bindings } from '../env';

export type DashboardQueueItem = { id: string; title: string; slug?: string; updated_at: string };
export type DashboardResponse = {
  posts: Array<{ status: string; count: number }>;
  pages: { count: number };
  categories: { count: number };
  media: { count: number; bytes: number };
  queues: {
    missingSeoUk: DashboardQueueItem[];
    missingMediaAltUk: DashboardQueueItem[];
    englishUnpublished: DashboardQueueItem[];
  };
  recent: {
    changes: Array<{
      id: string;
      title: string;
      entity_type: 'post' | 'page';
      status: string;
      updated_at: string;
    }>;
    audits?: Array<{
      id: string;
      action: string;
      entity_type: string | null;
      created_at: string;
      actor_email: string | null;
    }>;
  };
};

export async function getDashboardStats(env: Bindings, actor?: Actor): Promise<DashboardResponse> {
  const statements: D1PreparedStatement[] = [
    env.DB.prepare('SELECT status,count(*) count FROM posts GROUP BY status'),
    env.DB.prepare('SELECT count(*) count FROM pages'),
    env.DB.prepare('SELECT count(*) count FROM categories'),
    env.DB.prepare('SELECT count(*) count,coalesce(sum(size_bytes),0) bytes FROM media'),
    env.DB.prepare(
      "SELECT id,title_uk title,slug,updated_at FROM posts WHERE status='draft' AND (seo_description_uk IS NULL OR trim(seo_description_uk)='') ORDER BY updated_at DESC LIMIT 8",
    ),
    env.DB.prepare(
      "SELECT id,alt_uk title,updated_at FROM media WHERE alt_uk IS NULL OR trim(alt_uk)='' ORDER BY updated_at DESC LIMIT 8",
    ),
    env.DB.prepare(
      "SELECT id,title_uk title,slug,updated_at FROM posts WHERE status='published' AND (is_en_published=0 OR is_en_published IS NULL) ORDER BY updated_at DESC LIMIT 8",
    ),
    env.DB.prepare(
      'SELECT id,title_uk title,status,updated_at FROM posts ORDER BY updated_at DESC LIMIT 5',
    ),
    env.DB.prepare(
      'SELECT id,title_uk title,status,updated_at FROM pages ORDER BY updated_at DESC LIMIT 5',
    ),
  ];
  if (actor?.role === 'admin')
    statements.push(
      env.DB.prepare(
        'SELECT audit_logs.id,audit_logs.action,audit_logs.entity_type,audit_logs.created_at,users.email actor_email FROM audit_logs LEFT JOIN users ON users.id=audit_logs.actor_user_id ORDER BY audit_logs.created_at DESC LIMIT 8',
      ),
    );
  const results = await env.DB.batch(statements);
  const rows = (index: number) =>
    results[index]!.results as unknown as Array<Record<string, string>>;
  const postChanges = rows(7).map((item): DashboardResponse['recent']['changes'][number] => ({
    id: String(item.id),
    title: String(item.title),
    status: String(item.status),
    updated_at: String(item.updated_at),
    entity_type: 'post',
  }));
  const pageChanges = rows(8).map((item): DashboardResponse['recent']['changes'][number] => ({
    id: String(item.id),
    title: String(item.title),
    status: String(item.status),
    updated_at: String(item.updated_at),
    entity_type: 'page',
  }));
  const changes = [...postChanges, ...pageChanges]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8);
  const response: DashboardResponse = {
    posts: results[0]!.results as Array<{ status: string; count: number }>,
    pages: results[1]!.results[0] as { count: number },
    categories: results[2]!.results[0] as { count: number },
    media: results[3]!.results[0] as { count: number; bytes: number },
    queues: {
      missingSeoUk: rows(4) as DashboardQueueItem[],
      missingMediaAltUk: rows(5) as DashboardQueueItem[],
      englishUnpublished: rows(6) as DashboardQueueItem[],
    },
    recent: { changes },
  };
  if (actor?.role === 'admin')
    response.recent.audits = rows(9) as NonNullable<DashboardResponse['recent']['audits']>;
  return response;
}
