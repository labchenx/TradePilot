const AUTH_TOKEN_KEY = 'tradepilot_access_token';

export function getStoredAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function notifyUnauthorized() {
  window.dispatchEvent(new Event('tradepilot:unauthorized'));
}
