import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/authService';
import type { AuthUser, LoginPayload, RegisterPayload } from '@/services/authTypes';
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from '@/services/authTokenStorage';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    const storedToken = getStoredAuthToken();
    if (!storedToken) {
      clearSession();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setToken(storedToken);
      setUser(currentUser);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };

    window.addEventListener('tradepilot:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('tradepilot:unauthorized', handleUnauthorized);
    };
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    setStoredAuthToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    setStoredAuthToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      fetchMe,
    }),
    [fetchMe, isLoading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return value;
}
