import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { MiddlewareHandler } from 'hono';
import type { Actor, Bindings } from '../env';
import { apiError } from '@fauna/shared';

type AccessKeys = ReturnType<typeof createRemoteJWKSet>;
const jwkResolvers = new Map<string, AccessKeys>();

function accessKeys(teamDomain: string): AccessKeys {
  const issuer = `https://${teamDomain}`;
  const cached = jwkResolvers.get(issuer);
  if (cached) return cached;
  const resolver = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  jwkResolvers.set(issuer, resolver);
  return resolver;
}

export const requireActor: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: { actor: Actor };
}> = async (c, next) => {
  const { ENVIRONMENT, DEV_AUTH_BYPASS, DEV_AUTH_EMAIL, ACCESS_TEAM_DOMAIN, ACCESS_AUD, DB } =
    c.env;
  let email: string | undefined;
  if (DEV_AUTH_BYPASS === 'true') {
    if (ENVIRONMENT !== 'development')
      return c.json(
        apiError('AUTH_CONFIGURATION', 'DEV_AUTH_BYPASS заборонено поза development'),
        500,
      );
    email = DEV_AUTH_EMAIL?.toLowerCase().trim();
  } else {
    const token = c.req.header('Cf-Access-Jwt-Assertion');
    if (!token || !ACCESS_TEAM_DOMAIN || !ACCESS_AUD)
      return c.json(apiError('UNAUTHORIZED', 'Потрібна авторизація'), 401);
    try {
      const issuer = `https://${ACCESS_TEAM_DOMAIN}`;
      const verified = await jwtVerify(token, accessKeys(ACCESS_TEAM_DOMAIN), {
        issuer,
        audience: ACCESS_AUD,
      });
      email =
        typeof verified.payload.email === 'string'
          ? verified.payload.email.toLowerCase().trim()
          : undefined;
    } catch {
      return c.json(apiError('UNAUTHORIZED', 'Недійсна сесія'), 401);
    }
  }
  if (!email) return c.json(apiError('UNAUTHORIZED', 'Недійсна сесія'), 401);
  const actor = await DB.prepare(
    'SELECT id,email,name,role FROM users WHERE email=? AND is_active=1',
  )
    .bind(email)
    .first<Actor>();
  if (!actor || (actor.role !== 'admin' && actor.role !== 'editor'))
    return c.json(apiError('FORBIDDEN', 'Доступ заборонено'), 403);
  c.set('actor', actor);
  await next();
};
export const requireAdmin: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: { actor: Actor };
}> = async (c, next) =>
  c.get('actor').role === 'admin'
    ? next()
    : c.json(apiError('FORBIDDEN', 'Потрібна роль адміністратора'), 403);
