import { apiFetch } from './apiClient';
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from './authTypes';

async function parseAuthResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = `Auth API request failed: ${response.status}`;
  try {
    const body = await response.json();
    message = Array.isArray(body.message) ? body.message.join('; ') : body.message ?? message;
  } catch {
    // Keep the HTTP status message when the backend response is not JSON.
  }

  throw new Error(String(message));
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseAuthResponse<AuthResponse>(response);
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return parseAuthResponse<AuthResponse>(response);
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiFetch('/api/auth/me');
    const data = await parseAuthResponse<{ user: AuthUser }>(response);
    return data.user;
  },

  async logout() {
    const response = await apiFetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok && response.status !== 401) {
      await parseAuthResponse(response);
    }
  },
};
