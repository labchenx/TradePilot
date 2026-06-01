import type { ComponentType } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface ResponsiveRouteProps {
  desktop: ComponentType;
  mobile: ComponentType;
}

export function ResponsiveRoute({
  desktop: Desktop,
  mobile: Mobile,
}: ResponsiveRouteProps) {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
