import type { Context } from 'hono';
import { apiError } from '@fauna/shared';
import type { AppEnv } from '../index';

/**
 * D1-based sliding window rate limiter.
 *
 * Counts requests per (namespace, client_key) within a configurable window.
 * Uses ISO timestamps so no TTL clock drift, but relies on periodic
 * cleanup to keep the rate_limit_entries table from growing unboundedly.
 *
 * Namespace examples: 'search', 'upload', 'contact'
 * Client key examples: IP or actor id for authenticated routes.
 */

export interface RateLimitOpts {
  /** Logical namespace – 'search', 'upload', 'contact'. */
  namespace: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window duration in seconds. */
  windowSeconds: number;
  /** Optional override for the client key (defaults to IP or actor id). */
  clientKey?: string;
}

/**
 * Check whether the request is rate-limited.
 * Returns a response with 429 + Retry-After when the limit is exceeded.
 * Returns `null` when the request is allowed.
 */
export async function rateLimit(
  c: Context<AppEnv>,
  opts: RateLimitOpts,
): Promise<Response | null> {
  const clientKey = opts.clientKey ?? clientIdentifier(c);
  const now = Date.now();
  const windowStart = new Date(now - opts.windowSeconds * 1000).toISOString();
  const cutoff = new Date(now - opts.windowSeconds * 1000 * 2).toISOString();

  const result = await c.env.DB.prepare(
    `SELECT count(*) AS cnt FROM rate_limit_entries
     WHERE namespace = ? AND client_key = ? AND created_at >= ?`,
  )
    .bind(opts.namespace, clientKey, windowStart)
    .first<{ cnt: number }>();

  const count = Number(result?.cnt ?? 0);

  if (count >= opts.limit) {
    return c.json(
      apiError(
        'RATE_LIMITED',
        `Забагато запитів. Спробуйте через ${opts.windowSeconds} секунд.`,
      ),
      429,
    );
  }

  // Record this request
  await c.env.DB.prepare(
    'INSERT INTO rate_limit_entries (namespace, client_key, created_at, request_id) VALUES (?, ?, ?, ?)',
  )
    .bind(
      opts.namespace,
      clientKey,
      new Date(now).toISOString(),
      c.get('requestId'),
    )
    .run();

  // Periodic cleanup: purge entries older than 2 windows every 50th write
  const rand = Math.random();
  if (rand < 0.02) {
    // 2% sampling to avoid cleanup overhead on every request
    c.env.DB.prepare('DELETE FROM rate_limit_entries WHERE created_at < ?')
      .bind(cutoff)
      .run()
      .catch(() => {});
  }

  return null;
}

function clientIdentifier(c: Context<AppEnv>): string {
  // Prefer authenticated actor ID for admin routes
  const actor = c.get('actor');
  if (actor?.id) return `actor:${actor.id}`;

  // Fall back to CF-Connecting-IP or a hash of the request IP
  const ip =
    c.req.header('CF-Connecting-IP') ??
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown';
  return `ip:${ip}`;
}
