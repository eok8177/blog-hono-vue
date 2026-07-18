/** Bindings are generated from wrangler.jsonc; the intersection makes required resources explicit. */
export type Bindings = Env & {
  DB: D1Database;
  MEDIA: R2Bucket;
  TURNSTILE_SECRET_KEY?: string;
  DEV_AUTH_BYPASS?: string;
  DEV_AUTH_EMAIL?: string;
};
export interface Actor {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}
