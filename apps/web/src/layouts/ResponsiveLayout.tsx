import { MainLayout } from './MainLayout';
import { MobileLayout } from './MobileLayout';
import { useIsMobile } from '@/hooks/useMediaQuery';

export function ResponsiveLayout() {
  const isMobile = useIsMobile();

  return isMobile ? <MobileLayout /> : <MainLayout />;
}
