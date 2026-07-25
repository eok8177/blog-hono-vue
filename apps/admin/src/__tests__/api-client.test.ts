import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../api/client';

describe('ApiError', () => {
  it('retains machine-readable code and message', () => {
    const err = new ApiError('CONFLICT', 'Конфлікт', 409, { slug: 'зайнятий' });
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Конфлікт');
    expect(err.status).toBe(409);
    expect(err.fields).toEqual({ slug: 'зайнятий' });
  });
});

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns data on successful JSON response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, data: { id: '123' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const result = await api<{ id: string }>('/posts/123');
    expect(result).toEqual({ id: '123' });
  });

  it('throws ApiError on error response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Не знайдено' },
        }),
        { status: 404, headers: { 'content-type': 'application/json' } },
      ),
    );
    try {
      await api('/posts/nonexistent');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('NOT_FOUND');
      expect((err as ApiError).status).toBe(404);
    }
  });

  it('throws UNAUTHORIZED on 401 with non-JSON response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    await expect(api('/session')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('throws FORBIDDEN on 403', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));
    await expect(api('/users')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('sends JSON body with correct headers', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, data: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await api('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/posts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: 'Test' }),
      }),
    );
  });
});
