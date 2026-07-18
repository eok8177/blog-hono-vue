import { drizzle } from 'drizzle-orm/d1';
import type { Bindings } from '../env';

/** Single repository boundary for typed D1 access. SQLite-specific FTS/CTE SQL remains in services. */
export function database(env: Pick<Bindings, 'DB'>) {
  return drizzle(env.DB);
}
