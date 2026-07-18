import { z } from 'zod';
import type { Bindings } from './env';

const configSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'staging', 'production']),
  SITE_URL: z.string().url(),
  ACCESS_TEAM_DOMAIN: z.string(),
  ACCESS_AUD: z.string(),
  DEV_AUTH_BYPASS: z.string().optional(),
  DEV_AUTH_EMAIL: z.string().email().optional(),
});

export type RuntimeConfig = z.infer<typeof configSchema>;

/** Validate untrusted deployment configuration at the Worker boundary. */
export function runtimeConfig(env: Bindings): RuntimeConfig {
  const config = configSchema.parse(env);
  if (config.ENVIRONMENT === 'production') {
    if (config.SITE_URL.startsWith('http://'))
      throw new Error('SITE_URL must use HTTPS in production');
    if (config.DEV_AUTH_BYPASS === 'true')
      throw new Error('DEV_AUTH_BYPASS is forbidden in production');
    if (!config.ACCESS_TEAM_DOMAIN || !config.ACCESS_AUD)
      throw new Error('Cloudflare Access configuration is required in production');
  }
  if (config.DEV_AUTH_BYPASS === 'true' && !config.DEV_AUTH_EMAIL)
    throw new Error('DEV_AUTH_EMAIL is required when DEV_AUTH_BYPASS is enabled');
  return config;
}
