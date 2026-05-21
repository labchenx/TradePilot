import type { ImportConfirmResponse, ImportPreviewRecord } from '@/types';

export const mockImportPreviewRecords: ImportPreviewRecord[] = [];

export const mockImportResult: ImportConfirmResponse = {
  importJobId: 'mock-import-job',
  summary: {
    totalRecords: 0,
    insertedRecords: 0,
    duplicateRecords: 0,
    updatedRecords: 0,
    failedRecords: 0,
  },
  records: [],
  warnings: [],
};
