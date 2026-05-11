import { Outlet } from 'react-router';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-neutral-50 font-sans text-neutral-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-neutral-50">
      <Sidebar />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

