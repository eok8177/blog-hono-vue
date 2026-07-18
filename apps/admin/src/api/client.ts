export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const json = (await response.json()) as {
    ok: boolean;
    data?: T;
    error?: { code: string; message: string; fields?: Record<string, string> };
  };
  if (!response.ok || !json.ok)
    throw new ApiError(
      json.error?.code ?? 'HTTP_ERROR',
      json.error?.message ?? 'Помилка запиту',
      json.error?.fields,
    );
  return json.data as T;
}
