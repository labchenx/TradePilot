import { mockImportPreviewRecords, mockImportResult } from '@/data';

export const importService = {
  previewIbkrEmail() {
    // TODO: Replace with POST /imports/ibkr-email/preview.
    return mockImportPreviewRecords;
  },
  confirmIbkrImport() {
    // TODO: Replace with POST /imports/ibkr-email/confirm.
    return mockImportResult;
  },
};
