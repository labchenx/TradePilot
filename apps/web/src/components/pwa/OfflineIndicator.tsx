import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-red-600 px-4 py-2 text-white shadow-lg dark:bg-red-700">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="h-4 w-4" />
        <span>网络连接不可用，部分实时数据请求可能失败。</span>
      </div>
    </div>
  );
}
