import { BadRequestException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ImportsService } from './imports.service';

const projectRoot = resolve(__dirname, '../../../../');

function createFileMock(filename: string): Express.Multer.File {
  const buffer = readFileSync(resolve(projectRoot, 'examples/ibkr', filename));
  return {
    originalname: filename,
    buffer,
    size: buffer.length,
  } as Express.Multer.File;
}

function createService() {
  const prisma = {
    importJob: {
      create: jest.fn(({ data }) => ({
        id: 'job_preview_1',
        ...data,
      })),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    importFile: {
      findUnique: jest.fn(),
    },
  };
  const importDedupService = {
    markPreviewRecords: jest.fn(async (records) => records),
  };
  const importConfirmService = {
    confirm: jest.fn(async () => ({
      importJobId: 'job_preview_1',
      summary: {
        totalRecords: 1,
        insertedRecords: 1,
        duplicateRecords: 0,
        updatedRecords: 0,
        failedRecords: 0,
      },
      records: [],
      warnings: [],
    })),
  };

  return {
    service: new ImportsService(
      prisma as never,
      importDedupService as never,
      importConfirmService as never,
    ),
    prisma,
    importDedupService,
    importConfirmService,
  };
}

describe('ImportsService', () => {
  it('previews one real IBKR CSV without writing business rows', async () => {
    const { service, prisma, importDedupService } = createService();

    const result = await service.previewIbkrCsv([
      createFileMock('U18666165_20240819_20250516.csv'),
    ]);

    expect(result.jobPreviewId).toBe('job_preview_1');
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({ status: 'PARSED' });
    expect(result.records.length).toBeGreaterThan(100);
    expect(result.summary.totalRecords).toBe(result.records.length);
    expect(result.summary.newRecords).toBe(result.records.length);
    expect(
      result.records[0].data.sourceFileSummary?.cashReport?.cashBalance,
    ).toBeCloseTo(-1536.032970827, 6);
    expect(importDedupService.markPreviewRecords).toHaveBeenCalled();
    expect(prisma.importJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PREVIEWED',
          totalCount: result.records.length,
        }),
      }),
    );
  });

  it('supports multiple CSV files in one preview', async () => {
    const { service } = createService();

    const result = await service.previewIbkrCsv([
      createFileMock('U18666165_20240819_20250516.csv'),
      createFileMock('U18666165_20250519_20260518.csv'),
    ]);

    expect(result.files).toHaveLength(2);
    expect(result.summary.totalRecords).toBe(result.records.length);
    expect(result.summary.tradeRecords).toBeGreaterThan(0);
    expect(result.summary.cashFlowRecords).toBeGreaterThan(0);
  });

  it('rejects non-CSV uploads before parsing', async () => {
    const { service } = createService();
    const badFile = {
      originalname: 'statement.txt',
      buffer: Buffer.from('not,csv'),
      size: 7,
    } as Express.Multer.File;

    await expect(service.previewIbkrCsv([badFile])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('delegates confirmation to the confirm service', async () => {
    const { service, importConfirmService } = createService();

    await service.confirmIbkrCsv({ jobPreviewId: 'job_preview_1' });

    expect(importConfirmService.confirm).toHaveBeenCalledWith(
      'job_preview_1',
      undefined,
    );
  });

  it('deletes one import history job without deleting business rows', async () => {
    const { service, prisma } = createService();
    prisma.importJob.findUnique.mockResolvedValueOnce({
      id: 'job_1',
      _count: { records: 3 },
    });
    prisma.importJob.delete.mockResolvedValueOnce({ id: 'job_1' });

    await expect(service.deleteHistory('job_1')).resolves.toEqual({
      success: true,
      deletedImportJobId: 'job_1',
      deletedRecordCount: 3,
    });
    expect(prisma.importJob.delete).toHaveBeenCalledWith({
      where: { id: 'job_1' },
    });
  });
});
