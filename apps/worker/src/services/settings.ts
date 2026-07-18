import { settingInputSchema } from '@fauna/shared';
import type { Actor, Bindings } from '../env';

export async function listSettings(env: Bindings) {
  return (
    await env.DB.prepare(
      "SELECT key,value_json,updated_at FROM settings WHERE key IN ('site','home')",
    ).all()
  ).results;
}

export async function updateSettings(env: Bindings, actor: Actor, body: unknown) {
  const data = settingInputSchema.parse(body);
  const timestamp = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO settings(key,value_json,updated_by,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at',
  )
    .bind(data.key, JSON.stringify(data.value), actor.id, timestamp)
    .run();
  return { key: data.key };
}
