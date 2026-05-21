import { cn } from '@/utils';

interface ImportStepsProps {
  step: number;
}

const steps = ['选择 CSV', '解析预览', '确认导入', '导入结果'];

export function ImportSteps({ step }: ImportStepsProps) {
  return (
    <div className="flex w-full items-center rounded-xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6 dark:border-neutral-800 dark:bg-neutral-900">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const active = step >= stepNumber;
        const done = step >= 4 && stepNumber === 4;

        return (
          <div key={label} className="contents">
            <div className={cn('flex flex-1 flex-col items-center', active ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-600', done && 'text-green-600 dark:text-green-400')}>
              <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-full font-bold', active ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-neutral-100 dark:bg-neutral-800', done && 'bg-green-100 dark:bg-green-900/30')}>
                {stepNumber}
              </div>
              <span className="text-center text-xs font-medium">{label}</span>
            </div>
            {index < steps.length - 1 ? <div className="h-0.5 w-12 bg-neutral-200 dark:bg-neutral-800" /> : null}
          </div>
        );
      })}
    </div>
  );
}
