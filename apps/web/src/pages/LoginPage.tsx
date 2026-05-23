import { FormEvent, useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/app/auth-provider';
import { Button, Input } from '@/components/common';

function getRedirectPath(state: unknown) {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof (state as { from?: { pathname?: unknown } }).from?.pathname === 'string'
  ) {
    return (state as { from: { pathname: string } }).from.pathname;
  }

  return '/dashboard';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(getRedirectPath(location.state), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-10 font-sans text-neutral-900">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-xl font-bold text-white">
            T
          </div>
          <h1 className="text-2xl font-semibold">登录 TradePilot</h1>
          <p className="mt-2 text-sm text-neutral-500">访问你的投资组合数据与导入记录</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                className="h-11 pl-10"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                className="h-11 pl-10"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 8 位密码"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button className="h-11 w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          还没有账户？
          <Link className="ml-1 font-medium text-blue-600 hover:text-blue-700" to="/register">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
