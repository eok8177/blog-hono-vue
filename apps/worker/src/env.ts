export interface Bindings {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  SITE_URL: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  TURNSTILE_SITE_KEY: string;
  DEV_AUTH_BYPASS?: string;
  DEV_AUTH_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
}
export interface Actor {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}
