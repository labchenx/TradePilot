import { PageTitle, StatCard, Tag } from '@/components/common';
import { BehaviorFrequencyChart, BehaviorInsights } from '@/components/behavior';
import { behaviorService } from '@/services';

export function BehaviorPage() {
  const { metrics, frequency, insights } = behaviorService.getBehavior();

  return (
    <div className="space-y-6">
      <PageTitle
        title="Behavior 交易行为"
        description="Track trading cadence, buy/sell balance, holding period, and concentration signals"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            title={metric.label}
            value={
              <span className="flex items-center justify-between gap-3">
                {metric.value}
                <Tag color={metric.tone}>{metric.tone}</Tag>
              </span>
            }
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <BehaviorFrequencyChart data={frequency} />
        <BehaviorInsights insights={insights} />
      </div>
    </div>
  );
}

