import { useState } from 'react';
import { CardShell, PageTitle } from '@/components/common';
import {
  ImportInputPanel,
  ImportPreviewTable,
  ImportResultCard,
  ImportSteps,
} from '@/components/import';
import { importService } from '@/services';

export function ImportPage() {
  const [step, setStep] = useState(1);
  const [emailContent, setEmailContent] = useState('');
  const previewRecords = importService.previewIbkrEmail();
  const importResult = importService.confirmIbkrImport();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageTitle
        title="IBKR Email Import 邮件导入"
        description="Parse IBKR trade confirmation emails and import trades safely"
      />
      <ImportSteps step={step} />
      <CardShell className="overflow-hidden">
        {step === 1 ? (
          <ImportInputPanel
            emailContent={emailContent}
            onEmailContentChange={setEmailContent}
            onParse={() => setStep(2)}
          />
        ) : null}
        {step === 2 || step === 3 ? (
          <ImportPreviewTable
            records={previewRecords}
            step={step}
            onBack={() => setStep(1)}
            onProceed={() => setStep(3)}
            onConfirm={() => setStep(4)}
          />
        ) : null}
        {step === 4 ? <ImportResultCard result={importResult} onImportAnother={() => setStep(1)} /> : null}
      </CardShell>
    </div>
  );
}
