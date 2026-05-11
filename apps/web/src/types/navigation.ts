import type { ComponentType } from 'react';

export interface NavigationItem {
  path: string;
  label: string;
  zhLabel: string;
  icon: ComponentType<{ className?: string }>;
}

