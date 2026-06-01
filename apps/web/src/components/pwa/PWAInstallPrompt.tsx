import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);

      window.setTimeout(() => {
        const dismissedAt = localStorage.getItem('tradepilot:pwa-install-dismissed');
        if (!dismissedAt) setVisible(true);
      }, 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      localStorage.setItem('tradepilot:pwa-installed', 'true');
    }

    setDeferredPrompt(null);
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem('tradepilot:pwa-install-dismissed', String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed right-4 bottom-20 left-4 z-50 md:right-6 md:bottom-6 md:left-auto">
      <div className="mx-auto max-w-sm rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl shadow-neutral-900/15 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/30">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
            <Download className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-sm font-bold text-neutral-900 dark:text-white">
              安装 TradePilot
            </h3>
            <p className="mb-3 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
              添加到主屏幕，使用更接近原生 App 的移动端体验。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={install}
                className="h-9 flex-1 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                立即安装
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                aria-label="关闭安装提示"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
