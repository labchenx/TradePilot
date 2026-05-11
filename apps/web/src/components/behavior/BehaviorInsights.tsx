import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { CardShell, Tag } from '@/components/common';
import type { BehaviorInsight } from '@/types';

interface BehaviorInsightsProps {
  insights: BehaviorInsight[];
}

const icons = {
  green: CheckCircle2,
  yellow: AlertTriangle,
  blue: Info,
  red: AlertTriangle,
  gray: Info,
};

export function BehaviorInsights({ insights }: BehaviorInsightsProps) {
  return (
    <CardShell className="p-5">
      <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Review Notes 复盘提示</h3>
      <div className="space-y-4">
        {insights.map((insight) => {
          const Icon = icons[insight.tone];

          return (
            <div key={insight.title} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                <Tag color={insight.tone}>{insight.tone.toUpperCase()}</Tag>
              </div>
              <h4 className="font-semibold text-neutral-900 dark:text-white">{insight.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{insight.description}</p>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

