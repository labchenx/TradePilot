import { useRef, useState } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { Button, Tag } from '@/components/common';
import { cn } from '@/utils';

interface ImportInputPanelProps {
  files: File[];
  disabled?: boolean;
  onFilesChange: (files: File[]) => void;
  onParse: () => void;
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

export function ImportInputPanel({
  files,
  disabled = false,
  onFilesChange,
  onParse,
}: ImportInputPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const nextFiles = Array.from(fileList).filter((file) =>
      file.name.toLowerCase().endsWith('.csv'),
    );
    const merged = [...files];

    nextFiles.forEach((file) => {
      const exists = merged.some(
        (item) => item.name === file.name && item.size === file.size,
      );
      if (!exists) {
        merged.push(file);
      }
    });

    onFilesChange(merged);
  };

  return (
    <div className="space-y-5 p-6 md:p-8">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-neutral-300 bg-neutral-50/60 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40 dark:hover:bg-neutral-800/60',
        )}
      >
        <UploadCloud className="mb-4 h-11 w-11 text-blue-500" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          IBKR Activity Statement CSV
        </h3>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          支持单个或多个 .csv 文件
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              文件列表
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {files.length} 个文件待解析
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={files.length === 0 || disabled}
            onClick={() => onFilesChange([])}
          >
            清空列表
          </Button>
        </div>

        {files.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            暂无文件
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.size}`}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag color="blue">CSV</Tag>
                  <button
                    type="button"
                    className="rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800"
                    disabled={disabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      onFilesChange(files.filter((item) => item !== file));
                    }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button disabled={files.length === 0 || disabled} onClick={onParse}>
          解析预览
        </Button>
      </div>
    </div>
  );
}
