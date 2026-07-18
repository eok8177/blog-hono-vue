export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 0,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiError(
      response.status === 401
        ? 'UNAUTHORIZED'
        : response.status === 403
          ? 'FORBIDDEN'
          : 'NON_JSON_RESPONSE',
      response.status === 401
        ? 'Сесія завершилася. Увійдіть через Cloudflare Access.'
        : 'Сервер повернув неочікувану відповідь.',
      response.status,
    );
  }
  const json = (await response.json()) as {
    ok: boolean;
    data?: T;
    error?: { code: string; message: string; fields?: Record<string, string> };
  };
  if (!response.ok || !json.ok)
    throw new ApiError(
      json.error?.code ?? 'HTTP_ERROR',
      json.error?.message ?? 'Помилка запиту',
      response.status,
      json.error?.fields,
    );
  return json.data as T;
}
