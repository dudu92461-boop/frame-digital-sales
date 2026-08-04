/**
 * Cliente HTTP do sistema.
 *
 * Todas as chamadas passam por aqui para garantir tres coisas: envio do cookie
 * de sessao, tratamento uniforme de erro (com as mensagens de validacao vindas
 * do backend) e redirecionamento automatico quando a sessao expira.
 */

const BASE = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Mensagens de validacao indexadas por campo, para exibir no formulario. */
  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const d of this.details ?? []) map[d.field] = d.message;
    return map;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, params?: Query): string {
  const url = new URL(BASE + path, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.pathname + url.search;
}

async function request<T>(method: string, path: string, body?: unknown, params?: Query): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    // 401 fora da tela de login significa sessao encerrada: volta para o login.
    if (response.status === 401 && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError(
      response.status,
      payload.error ?? 'Nao foi possivel completar a operacao.',
      payload.details,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, params?: Query) => request<T>('GET', path, undefined, params),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
