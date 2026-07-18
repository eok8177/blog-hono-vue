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

export async function createUser(
  env: Bindings,
  actor: Actor,
  body: unknown,
): Promise<MutationResult> {
  const data = userInputSchema.parse(body);
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
  const target = await env.DB.prepare('SELECT role,is_active FROM users WHERE id=?')
    .bind(userId)
    .first<{ role: 'admin' | 'editor'; is_active: number }>();
  if (!target) return { kind: 'missing' };

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

export async function deactivateUser(
  env: Bindings,
  actor: Actor,
  userId: string,
): Promise<MutationResult> {
  const target = await env.DB.prepare('SELECT role,is_active FROM users WHERE id=?')
    .bind(userId)
    .first<{ role: 'admin' | 'editor'; is_active: number }>();
  if (!target) return { kind: 'missing' };

  const timestamp = new Date().toISOString();
  const results = await env.DB.batch([
    env.DB.prepare(
      "UPDATE users SET is_active=0,updated_at=? WHERE id=? AND NOT (role='admin' AND is_active=1 AND NOT EXISTS (SELECT 1 FROM users WHERE role='admin' AND is_active=1 AND id<>?))",
    ).bind(timestamp, userId, userId),
    env.DB.prepare(
      'INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND updated_at=?)',
    ).bind(
      crypto.randomUUID(),
      actor.id,
      'user.deactivate',
      'user',
      userId,
      '{}',
      timestamp,
      userId,
      timestamp,
    ),
  ]);
  if (!results[0]?.meta.changes)
    return target.role === 'admin' && target.is_active
      ? { kind: 'last_admin' }
      : { kind: 'conflict' };
  return { kind: 'ok', id: userId };
}
