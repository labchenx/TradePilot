import { useState } from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, Database, FileText, Globe, Shield, Smartphone, User } from 'lucide-react';
import { Button, CardShell, Input, PageTitle } from '@/components/common';
import { settingsService } from '@/services';

export function SettingsPage() {
  const settings = settingsService.getSettings();
  const [profile, setProfile] = useState(settings.profile);
  const [broker, setBroker] = useState(settings.broker);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <PageTitle title="Settings 设置" description="Manage your account, broker connections, data sources, and preferences." />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-1 md:col-span-1">
          {[
            { label: 'Profile', icon: User, active: true },
            { label: 'Security', icon: Shield },
            { label: 'Broker & Data', icon: Database },
            { label: 'Import Rules', icon: FileText },
            { label: 'APIs & Services', icon: Globe },
            { label: 'Display Options', icon: Smartphone },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-colors ${
                item.active
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-8 md:col-span-2">
          <CardShell className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</label>
                <Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="max-w-md" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                <div className="flex gap-4">
                  <Input value={profile.email} disabled className="max-w-md bg-neutral-50 dark:bg-neutral-800/50" />
                  <Button variant="outline">Change</Button>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button>Save Profile</Button>
              </div>
            </div>
          </CardShell>

          <CardShell className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Broker Settings</h3>
            <div className="max-w-md space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Primary Broker</label>
                <select
                  value={broker.broker}
                  onChange={(event) => setBroker({ ...broker, broker: event.target.value })}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:focus-visible:ring-neutral-500 dark:[&>option]:bg-neutral-900"
                >
                  <option value="IBKR">Interactive Brokers (IBKR)</option>
                  <option value="MANUAL">Manual Only</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Account Alias</label>
                <Input value={broker.alias} onChange={(event) => setBroker({ ...broker, alias: event.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Base Currency</label>
                <Input value={broker.baseCurrency} onChange={(event) => setBroker({ ...broker, baseCurrency: event.target.value })} />
              </div>
              <div className="flex justify-end pt-4">
                <Button>Save Broker Details</Button>
              </div>
            </div>
          </CardShell>

          <CardShell className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">API Services</h3>
            <div className="space-y-4">
              {settings.services.map((service) => (
                <div key={service.label} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                      {service.label.includes('AI') ? (
                        <BrainCircuit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-white">{service.label}</h4>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.connected ? (
                      <span className="flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-500">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-500">
                        <AlertCircle className="mr-1 h-3.5 w-3.5" />
                        Needs Setup
                      </span>
                    )}
                    <Button variant="ghost" size="sm">Configure</Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-md text-xs text-neutral-400">
              TODO: API keys must stay on the backend in later stages. This screen is a static settings placeholder.
            </p>
          </CardShell>
        </div>
      </div>
    </div>
  );
}

