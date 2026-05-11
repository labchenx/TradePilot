import { Link } from "react-router";
import { ArrowRight, LineChart, Mail, Lock } from "lucide-react";
import { Button, Input } from "../components/ui";

export function Login() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-neutral-950 font-sans transition-colors duration-200">
      {/* Left Side - Brand Presentation */}
      <div className="hidden lg:flex w-1/2 bg-neutral-900 dark:bg-black p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 to-neutral-900/40 dark:from-black dark:to-black/60"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-2xl leading-none">T</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">TradePilot</h1>
          </div>
        </div>
        
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Personal Portfolio Tracker for Serious Investors.</h2>
          <p className="text-lg text-neutral-300 leading-relaxed mb-8">
            Track trades, analyze positions, import IBKR emails automatically, and review your portfolio performance with professional-grade tools.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-300">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <LineChart className="w-4 h-4 text-white" />
              </div>
              <span>Advanced P/L analytics and allocation tracking</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span>Secure parsing of Interactive Brokers confirmation emails</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <span>Local-first architecture keeps your data private</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-neutral-500">
          &copy; 2026 TradePilot Analytics. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black font-bold text-2xl leading-none">T</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">TradePilot</h1>
            </div>
            
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Welcome back</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">Enter your credentials to access your portfolio.</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-10 h-11"
                  defaultValue="user@tradepilot.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11"
                  defaultValue="password"
                />
              </div>
            </div>

            <Link to="/">
              <Button className="w-full h-11 text-base mt-6">
                Sign In <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </form>

          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Don't have an account?{' '}
              <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                Register now
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
