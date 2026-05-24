import { getStoredAuthToken, notifyUnauthorized } from './authTokenStorage';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4100';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new Error(
      `无法连接到后端 API (${API_BASE_URL})，请确认 API 服务正在运行，且当前页面端口已被后端 CORS 允许。`,
      { cause: error },
    );
  }

  if (response.status === 401) {
    notifyUnauthorized();
  }

  return response;
}
