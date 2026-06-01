import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, FileDown, HelpCircle, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/common';
import { cn } from '@/utils';

const STORAGE_KEY = 'tradepilot:ibkr-csv-guide-seen';

interface IbkrCsvImportGuideProps {
  autoOpen?: boolean;
  triggerVariant?: 'button' | 'none';
}

const steps = [
  {
    title: '在 IBKR 点击「报告」',
    description: '进入 IBKR Client Portal 后，在左侧快捷入口找到「报告」。示意图已隐藏账号和资产金额。',
  },
  {
    title: '打开活动报表并下载 CSV',
    description: '选择活动报表，设置需要导出的日期范围，然后点击「下载 CSV」。',
  },
  {
    title: '回到 TradePilot 导入',
    description: '在 Data Import 页面上传 CSV，先解析预览，确认无误后再写入交易和现金流水。',
  },
];

export function IbkrCsvImportGuide({
  autoOpen = false,
  triggerVariant = 'button',
}: IbkrCsvImportGuideProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!autoOpen) return;

    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = window.setTimeout(() => setOpen(true), 600);
      return () => window.clearTimeout(timer);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGuide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function closeGuide() {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  }

  function goToImport() {
    closeGuide();
    navigate('/imports');
  }

  return (
    <>
      {triggerVariant === 'button' ? (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <HelpCircle className="mr-2 h-4 w-4" />
          IBKR CSV 导入指引
        </Button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/55 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="ibkr-csv-guide-title"
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-950/25 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5 dark:border-neutral-800">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  已使用匿名化示意图
                </div>
                <h2
                  id="ibkr-csv-guide-title"
                  className="text-xl font-bold text-neutral-900 dark:text-white"
                >
                  第一次使用：从 IBKR 导出 CSV，再导入 TradePilot
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  TradePilot 不直接读取你的 IBKR 账号。你先在 IBKR 手动导出活动报表 CSV，再在这里完成预览和确认导入。
                </p>
              </div>
              <button
                type="button"
                onClick={closeGuide}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
                aria-label="关闭导入指引"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <GuideStep index={1} {...steps[0]}>
                  <IbkrDashboardMock />
                </GuideStep>
                <GuideStep index={2} {...steps[1]}>
                  <IbkrCsvDialogMock />
                </GuideStep>
                <GuideStep index={3} {...steps[2]}>
                  <TradePilotImportMock />
                </GuideStep>
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  导入时仍然遵循 TradePilot 的安全流程：上传 CSV → 解析预览 → 检查重复和错误 → 用户确认后入库。
                </p>
                <Button onClick={goToImport} className="shrink-0">
                  去导入 CSV
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function GuideStep({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className="flex min-h-[430px] flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {index}
        </span>
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-auto">{children}</div>
    </article>
  );
}

function IbkrDashboardMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white text-[11px] shadow-inner dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex h-7 items-center justify-between bg-neutral-900 px-3 text-white">
        <span>S&P 500 ****.**</span>
        <span className="text-emerald-400">▲ *.**%</span>
      </div>
      <div className="flex h-10 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-800">
        <div className="font-bold text-neutral-900 dark:text-white">
          InteractiveBrokers
        </div>
        <div className="rounded-md bg-blue-600 px-3 py-1 font-semibold text-white">
          交易
        </div>
      </div>
      <div className="grid grid-cols-[112px_1fr]">
        <aside className="border-r border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-xs font-semibold text-neutral-900 dark:text-white">账户</p>
          <p className="mt-1 text-neutral-500">U*******</p>
          <div className="mt-3 space-y-1.5 text-neutral-500">
            {['现金 ******', '未实现盈亏 ******', '购买力 ******'].map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <span className="rounded-full border px-2 py-1 text-center">存款</span>
            <span className="rounded-full border px-2 py-1 text-center">取款</span>
            <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-1 text-center font-semibold text-blue-700">
              报告
            </span>
            <span className="rounded-full border px-2 py-1 text-center">支持</span>
          </div>
        </aside>
        <main className="p-3">
          <div className="mb-3 h-3 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="rounded border border-neutral-200 p-3 dark:border-neutral-800">
            <p className="text-lg font-bold text-neutral-900 dark:text-white">******.**</p>
            <div className="mt-4 h-24 rounded bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-neutral-950">
              <svg viewBox="0 0 280 90" className="h-full w-full">
                <path
                  d="M8 66 L42 58 L74 61 L108 48 L140 51 L176 34 L210 37 L246 22 L272 25"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                />
              </svg>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function IbkrCsvDialogMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-[11px] dark:border-neutral-800 dark:bg-neutral-950">
      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <p className="text-base font-semibold text-neutral-900 dark:text-white">
            活动报表
          </p>
          <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-500">×</span>
        </div>
        <div className="space-y-3 p-4">
          <MockField label="时间段" value="自定义日期范围" />
          <MockField label="起始日期" value="YYYY-MM-DD" />
          <MockField label="结束日期" value="YYYY-MM-DD" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950"
            >
              <FileDown className="h-4 w-4" />
              下载 PDF
            </button>
            <button
              type="button"
              className={cn(
                'flex items-center justify-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 font-semibold text-blue-700',
                'dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
              )}
            >
              <FileDown className="h-4 w-4" />
              下载 CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TradePilotImportMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 text-[11px] dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-neutral-900 dark:text-white">
            Data Import
          </p>
          <p className="text-neutral-500">IBKR CSV import</p>
        </div>
        <span className="rounded-md bg-neutral-900 px-3 py-1 font-semibold text-white dark:bg-white dark:text-neutral-900">
          CSV Import
        </span>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2 text-center text-neutral-400">
        {['选择 CSV', '解析预览', '确认导入', '导入结果'].map((item, index) => (
          <div key={item}>
            <span
              className={cn(
                'mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full font-bold',
                index === 0 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100',
              )}
            >
              {index + 1}
            </span>
            <p className={index === 0 ? 'text-blue-600' : undefined}>{item}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/70 p-8 text-center dark:border-blue-900 dark:bg-blue-950/20">
        <UploadCloud className="mx-auto mb-3 h-9 w-9 text-blue-500" />
        <p className="font-semibold text-neutral-900 dark:text-white">
          IBKR Activity Statement CSV
        </p>
        <p className="mt-1 text-neutral-500">支持单个或多个 .csv 文件</p>
      </div>
    </div>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
        {value}
      </span>
    </div>
  );
}
