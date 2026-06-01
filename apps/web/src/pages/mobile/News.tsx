import { Newspaper } from 'lucide-react';
import { MobileEmpty } from './MobileState';

export function MobileNews() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <Newspaper className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              股票资讯
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              News API 尚未接入
            </p>
          </div>
        </div>
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          当前阶段不强行实现 News，也不展示假新闻数据。后续接入真实资讯接口后，移动端会复用后端聚合结果。
        </p>
      </section>

      <MobileEmpty
        title="资讯功能待开发"
        description="这里将用于展示真实新闻列表和信息整理结果；不会提供股票推荐或自动买卖建议。"
      />
    </div>
  );
}
