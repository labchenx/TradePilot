import { getStoredAuthToken, notifyUnauthorized } from './authTokenStorage';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:4100/api' : '/api');

function buildApiUrl(path: string) {
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (baseUrl.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${baseUrl}${normalizedPath.slice('/api'.length)}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
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
