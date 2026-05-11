import { useState } from "react";
import { User, Mail, Shield, Smartphone, Globe, Bell, FileText, Database, CheckCircle2, AlertCircle, BrainCircuit } from "lucide-react";
import { Button, Input } from "../components/ui";

export function Settings() {
  const [profile, setProfile] = useState({ name: "Demo User", email: "user@tradepilot.com" });
  const [broker, setBroker] = useState({ broker: "IBKR", alias: "Main Portfolio", baseCurrency: "USD" });
  const [importConfig, setImportConfig] = useState({ emailEnabled: true, flexQuery: false, syncFreq: "Daily" });
  const [apiStatus, setApiStatus] = useState({ marketData: true, news: true, ai: false });
  const [display, setDisplay] = useState({ numberFormat: "US", dateFormat: "YYYY-MM-DD" });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings 设置</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage your account, broker connections, data sources, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-medium transition-colors text-left">
            <User className="w-5 h-5" /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl font-medium transition-colors text-left">
            <Shield className="w-5 h-5" /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl font-medium transition-colors text-left">
            <Database className="w-5 h-5" /> Broker & Data
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl font-medium transition-colors text-left">
            <FileText className="w-5 h-5" /> Import Rules
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl font-medium transition-colors text-left">
            <Globe className="w-5 h-5" /> APIs & Services
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl font-medium transition-colors text-left">
            <Smartphone className="w-5 h-5" /> Display Options
          </button>
        </div>

        <div className="md:col-span-2 space-y-8">
          {/* Profile Section */}
          <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Name</label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="max-w-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email</label>
                <div className="flex gap-4">
                  <Input value={profile.email} disabled className="max-w-md bg-neutral-50 dark:bg-neutral-800/50" />
                  <Button variant="outline">Change</Button>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button>Save Profile</Button>
              </div>
            </div>
          </section>

          {/* Broker Section */}
          <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Broker Settings</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Primary Broker</label>
                <select className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500">
                  <option value="IBKR">Interactive Brokers (IBKR)</option>
                  <option value="TDA">TD Ameritrade</option>
                  <option value="SCHWAB">Charles Schwab</option>
                  <option value="MANUAL">Manual Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Account Alias</label>
                <Input value={broker.alias} onChange={(e) => setBroker({ ...broker, alias: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Base Currency</label>
                <select className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500">
                  <option value="USD">USD - US Dollar</option>
                  <option value="HKD">HKD - Hong Kong Dollar</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end">
                <Button>Save Broker Details</Button>
              </div>
            </div>
          </section>

          {/* Import Rules */}
          <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Import Rules</h3>
            <div className="space-y-6 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white">Email Import</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Allow parsing trades from forwarded emails</p>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition-transform" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white">IBKR Flex Query Auto-Sync</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Automatically sync daily trade reports</p>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-200 dark:bg-neutral-700 transition-colors">
                  <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition-transform" />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Last Sync Time</label>
                <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Today, 10:45 AM</span>
                  <Button variant="ghost" size="sm">Sync Now</Button>
                </div>
              </div>
            </div>
          </section>

          {/* API Status */}
          <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">API Services</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">Market Data API</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">AlphaVantage / Yahoo Finance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connected
                  </span>
                  <Button variant="ghost" size="sm">Configure</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-white">AI Services API</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">OpenAI / Anthropic</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center text-xs font-medium text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Needs Setup
                  </span>
                  <Button variant="secondary" size="sm">Connect Key</Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-400 mt-4 max-w-md">
              Keys are stored securely in your browser's local storage and are never sent to our servers. TradePilot uses them directly to fetch data.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
