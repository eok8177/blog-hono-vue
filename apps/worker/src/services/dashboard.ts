import type { Bindings } from '../env';

export async function getDashboardStats(env: Bindings) {
  const results = await env.DB.batch([
    env.DB.prepare('SELECT status,count(*) count FROM posts GROUP BY status'),
    env.DB.prepare('SELECT count(*) count FROM pages'),
    env.DB.prepare('SELECT count(*) count FROM categories'),
    env.DB.prepare('SELECT count(*) count,coalesce(sum(size_bytes),0) bytes FROM media'),
  ]);

  return {
    posts: results[0]!.results,
    pages: results[1]!.results[0],
    categories: results[2]!.results[0],
    media: results[3]!.results[0],
  };
}
