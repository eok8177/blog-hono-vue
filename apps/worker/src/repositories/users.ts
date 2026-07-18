import { asc, count } from 'drizzle-orm';
import type { Bindings } from '../env';
import { database } from '../db/client';
import { users } from '../db/schema';

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
