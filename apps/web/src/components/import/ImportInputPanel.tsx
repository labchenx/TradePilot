import { ChevronRight, UploadCloud } from 'lucide-react';
import { Button } from '@/components/common';

interface ImportInputPanelProps {
  emailContent: string;
  onEmailContentChange: (value: string) => void;
  onParse: () => void;
}

export function ImportInputPanel({ emailContent, onEmailContentChange, onParse }: ImportInputPanelProps) {
  return (
    <div className="flex flex-col items-center p-6 md:p-8">
      <div className="mb-6 w-full max-w-3xl cursor-pointer rounded-xl border-2 border-dashed border-neutral-300 p-8 text-center transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50">
        <UploadCloud className="mx-auto mb-4 h-12 w-12 text-blue-500 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Upload .txt or .html email file</h3>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Drag and drop your IBKR Trade Confirmation email file here, or click to browse.
        </p>
      </div>

      <div className="mb-6 flex w-full max-w-3xl items-center gap-4 text-neutral-400 dark:text-neutral-600">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <span className="text-sm font-medium tracking-wider uppercase">OR PASTE CONTENT</span>
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <div className="w-full max-w-3xl">
        <textarea
          value={emailContent}
          onChange={(event) => onEmailContentChange(event.target.value)}
          placeholder="Paste IBKR email content here..."
          className="h-48 w-full resize-none rounded-xl border border-neutral-300 bg-transparent p-4 font-mono text-sm text-neutral-900 placeholder:font-sans placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-blue-400"
        />
        <div className="mt-6 flex justify-end">
          <Button onClick={onParse} size="lg" disabled={!emailContent && emailContent.length < 10}>
            Parse Preview
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
