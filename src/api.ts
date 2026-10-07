export type News = {
  id: string;
  content: string;
  visible: boolean;
  createdAt: string;
};

export type NewsInput = Pick<News, 'content' | 'visible'>;

const PASSWORD_KEY = 'news-bar-password';

export function getPassword() {
  return sessionStorage.getItem(PASSWORD_KEY);
}

export function setPassword(password: string | null) {
  if (password === null) sessionStorage.removeItem(PASSWORD_KEY);
  else sessionStorage.setItem(PASSWORD_KEY, password);
}

export class UnauthorizedError extends Error {}

async function request<T>(
  path: string,
  init: RequestInit = {},
  password = getPassword(),
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(password ? { Authorization: `Bearer ${password}` } : {}),
    },
  });
  if (res.status === 401) throw new UnauthorizedError('Nieprawidłowe hasło');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Błąd ${res.status}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  publicNews: () => request<News[]>('/api/news', {}, null),
  login: (password: string) =>
    request<void>('/api/login', { method: 'POST' }, password),
  allNews: () => request<News[]>('/api/admin/news'),
  create: (data: NewsInput) =>
    request<News>('/api/admin/news', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: NewsInput) =>
    request<News>(`/api/admin/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/api/admin/news/${id}`, { method: 'DELETE' }),
  reorder: (ids: string[]) =>
    request<News[]>('/api/admin/order', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    }),
};
