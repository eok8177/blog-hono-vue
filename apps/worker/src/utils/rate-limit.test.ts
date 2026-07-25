import { describe, expect, it } from 'vitest';
import { rateLimit } from './rate-limit';
import type { AppEnv } from '../index';
import type { Context } from 'hono';

// Mock Hono context factory
function mockContext(overrides?: Partial<Context<AppEnv>>): Context<AppEnv> {
  const req = new Request('https://example.test/test');
  return {
    req: {
      header: (name: string) => {
        if (name === 'CF-Connecting-IP') return '127.0.0.1';
        return null;
      },
      method: 'GET',
      path: '/test',
      url: 'https://example.test/test',
      raw: req,
      routeIndex: 0,
      routePath: '/test',
      queries: {},
      query: (key: string) => undefined,
      param: () => '',
      parseBody: async () => ({}),
      json: async () => ({}),
      text: async () => '',
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      valid: () => undefined,
      addValidatedData: () => undefined,
    },
    get: (key: string) => {
      if (key === 'requestId') return 'test-request-id';
      if (key === 'actor') return undefined;
      return undefined;
    },
    set: () => undefined,
    header: () => undefined,
    status: () => undefined,
    json: (data: unknown, status?: number) =>
      new Response(JSON.stringify(data), { status: status ?? 200 }),
    html: (html: string) => new Response(html, { headers: { 'content-type': 'text/html' } }),
    body: (body: BodyInit | null) => new Response(body),
    text: (text: string) => new Response(text),
    redirect: (url: string) => new Response(null, { status: 302, headers: { location: url } }),
    newResponse: (body: BodyInit | null, status?: number) => new Response(body, { status }),
    notFound: () => new Response(null, { status: 404 }),
    res: new Response(),
    event: { waitUntil: () => undefined },
    executionCtx: {
      waitUntil: () => undefined,
      passThroughOnException: () => undefined,
    },
    var: undefined as unknown,
    ...overrides,
  } as unknown as Context<AppEnv>;
}

describe('rateLimit utility', () => {
  it('returns null (allowed) on first request', async () => {
    let dbCalls = 0;
    const ctx = mockContext({
      env: {
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => {
                dbCalls++;
                return { cnt: 0 };
              },
              run: async () => {
                dbCalls++;
                return { meta: { changes: 1 } };
              },
            }),
          }),
        },
      } as unknown as AppEnv['Bindings'],
    });

    const result = await rateLimit(ctx, {
      namespace: 'search',
      limit: 5,
      windowSeconds: 60,
      clientKey: 'test-key',
    });

    expect(result).toBeNull();
    expect(dbCalls).toBeGreaterThanOrEqual(2); // SELECT + INSERT
  });

  it('returns 429 when limit exceeded', async () => {
    const ctx = mockContext({
      env: {
        DB: {
          prepare: () => ({
            bind: () => ({
              first: async () => {
                return { cnt: 5 }; // Already at the limit
              },
              run: async () => ({ meta: { changes: 1 } }),
            }),
          }),
        },
      } as unknown as AppEnv['Bindings'],
    });

    const result = await rateLimit(ctx, {
      namespace: 'search',
      limit: 5,
      windowSeconds: 60,
      clientKey: 'test-key',
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    const body = await result!.json();
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('uses custom clientKey when provided', async () => {
    let usedKey = '';
    const ctx = mockContext({
      env: {
        DB: {
          prepare: (sql: string) => ({
            bind: (...args: unknown[]) => {
              usedKey = String(args[1]); // client_key is second param
              return {
                first: async () => ({ cnt: 0 }),
                run: async () => ({ meta: { changes: 1 } }),
              };
            },
          }),
        },
      } as unknown as AppEnv['Bindings'],
    });

    await rateLimit(ctx, {
      namespace: 'test',
      limit: 10,
      windowSeconds: 60,
      clientKey: 'custom-key',
    });

    expect(usedKey).toBe('custom-key');
  });
});
