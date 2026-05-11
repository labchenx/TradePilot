import { ArrowRight, LineChart, Lock, Mail } from 'lucide-react';
import { Link } from 'react-router';
import { Button, Input } from '@/components/common';

export function LoginPage() {
  return (
    <div className="flex min-h-screen bg-white font-sans transition-colors duration-200 dark:bg-neutral-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-neutral-900 p-12 lg:flex dark:bg-black">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 to-neutral-900/40 dark:from-black dark:to-black/60" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
            <span className="text-2xl font-bold leading-none text-black">T</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">TradePilot</h1>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="mb-6 text-4xl leading-tight font-bold text-white">Personal Portfolio Tracker for Serious Investors.</h2>
          <p className="mb-8 text-lg leading-relaxed text-neutral-300">
            Track trades, analyze positions, import IBKR email samples, and review portfolio performance with professional-grade tools.
          </p>
          <div className="space-y-4">
            {['Advanced P/L analytics and allocation tracking', 'Preview-first IBKR email parsing workflow', 'Mock-first architecture for learning backend integration'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-neutral-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  <LineChart className="h-4 w-4 text-white" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm text-neutral-500">2026 TradePilot Analytics</div>
      </div>
      <div className="flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black dark:bg-white">
                <span className="text-2xl font-bold leading-none text-white dark:text-black">T</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">TradePilot</h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">Static demo login screen. Backend auth is intentionally out of scope.</p>
          </div>
          <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <Input type="email" placeholder="name@example.com" className="h-11 pl-10" defaultValue="user@tradepilot.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <Input type="password" placeholder="password" className="h-11 pl-10" defaultValue="password" />
              </div>
            </div>
            <Link to="/">
              <Button className="mt-6 h-11 w-full text-base">
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

