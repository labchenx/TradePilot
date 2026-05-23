import { getStoredAuthToken, notifyUnauthorized } from './authTokenStorage';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4100';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    notifyUnauthorized();
  }

  return response;
}
