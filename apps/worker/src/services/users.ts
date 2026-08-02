import { userInputSchema } from '@fauna/shared';
import { asc, count } from 'drizzle-orm';
import { database } from '../db/client';
import { users } from '../db/schema';
import type { Actor, Bindings } from '../env';
import type { MutationResult } from './mutation';

export async function listUsers(env: Pick<Bindings, 'DB'>, page: number, pageSize: number) {
  const db = database(env);
  const [items, totalRows] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        lastSeenAt: users.lastSeenAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(users),
  ]);
  return {
    items: items.map((item) => ({
      id: item.id,
      email: item.email,
      name: item.name,
      role: item.role,
      is_active: item.isActive,
      last_seen_at: item.lastSeenAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    })),
    total: Number(totalRows[0]?.total ?? 0),
    page,
    pageSize,
  };
}

export async function getUser(env: Pick<Bindings, 'DB'>, id: string) {
  const row = await env.DB.prepare(
    'SELECT id, email, name, role, is_active, last_seen_at, created_at, updated_at FROM users WHERE id=?',
  )
    .bind(id)
    .first<{
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'editor';
      is_active: number;
      last_seen_at: string | null;
      created_at: string;
      updated_at: string;
    }>();
  return row ?? null;
}

export async function createUser(
  env: Bindings,
  actor: Actor,
  body: unknown,
): Promise<MutationResult> {
  const data = userInputSchema.parse(body);
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email=?')
    .bind(data.email)
    .first();
  if (existing) return { kind: 'email_taken' };
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO users(id,email,name,role,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(id, data.email, data.name, data.role, Number(data.isActive), timestamp, timestamp),
    env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(
      crypto.randomUUID(),
      actor.id,
      'user.create',
      'user',
      id,
      JSON.stringify({ email: data.email, role: data.role }),
      timestamp,
    ),
  ]);
  return { kind: 'ok', id };
}

export async function updateUser(
  env: Bindings,
  actor: Actor,
  userId: string,
  body: unknown,
): Promise<MutationResult> {
  const data = userInputSchema.parse(body);
  const target = await env.DB.prepare('SELECT role,is_active,email FROM users WHERE id=?')
    .bind(userId)
    .first<{ role: 'admin' | 'editor'; is_active: number; email: string }>();
  if (!target) return { kind: 'missing' };
  if (target.email !== data.email) {
    const collision = await env.DB.prepare('SELECT id FROM users WHERE email=?')
      .bind(data.email)
      .first();
    if (collision) return { kind: 'email_taken' };
  }

  const timestamp = new Date().toISOString();
  const results = await env.DB.batch([
    env.DB.prepare(
      "UPDATE users SET email=?,name=?,role=?,is_active=?,updated_at=? WHERE id=? AND NOT (role='admin' AND is_active=1 AND (?=0 OR ?<>'admin') AND NOT EXISTS (SELECT 1 FROM users WHERE role='admin' AND is_active=1 AND id<>?))",
    ).bind(
      data.email,
      data.name,
      data.role,
      Number(data.isActive),
      timestamp,
      userId,
      Number(data.isActive),
      data.role,
      userId,
    ),
    env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND updated_at=?)',
    ).bind(
      crypto.randomUUID(),
      actor.id,
      'user.update',
      'user',
      userId,
      JSON.stringify({ email: data.email, role: data.role, isActive: data.isActive }),
      timestamp,
      userId,
      timestamp,
    ),
  ]);
  if (!results[0]?.meta.changes)
    return target.role === 'admin' && target.is_active && (!data.isActive || data.role !== 'admin')
      ? { kind: 'last_admin' }
      : { kind: 'conflict' };
  return { kind: 'ok', id: userId };
}

export async function deleteUser(
  env: Bindings,
  actor: Actor,
  userId: string,
): Promise<MutationResult> {
  const target = await env.DB.prepare('SELECT role,is_active FROM users WHERE id=?')
    .bind(userId)
    .first<{ role: 'admin' | 'editor'; is_active: number }>();
  if (!target) return { kind: 'missing' };
  if (userId === actor.id) return { kind: 'self_delete' };
  if (target.role === 'admin' && target.is_active) {
    const others = await env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM users WHERE role='admin' AND is_active=1 AND id<>?",
    )
      .bind(userId)
      .first<{ cnt: number }>();
    if (!others?.cnt) return { kind: 'last_admin' };
  }

  const timestamp = new Date().toISOString();
  await env.DB.batch([
    // FK ON DELETE SET NULL handles posts/pages/media/settings/audit_logs.
    env.DB.prepare('DELETE FROM users WHERE id=?').bind(userId),
    env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)',
    ).bind(crypto.randomUUID(), actor.id, 'user.delete', 'user', userId, '{}', timestamp),
  ]);
  return { kind: 'ok', id: userId };
}
