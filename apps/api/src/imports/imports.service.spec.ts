import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ImportsService } from './imports.service';

const projectRoot = resolve(__dirname, '../../../../');

function createFileMock(filename: string): Express.Multer.File {
  const buffer = readFileSync(resolve(projectRoot, 'examples/ibkr', filename));
  return {
    originalname: filename,
    buffer,
  } as Express.Multer.File;
}

function createPrismaMock() {
  const importFiles: Record<string, unknown>[] = [];
  const transactionEvents: Record<string, unknown>[] = [];

  const prisma: {
    importFile: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    transactionEvent: {
      createMany: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
    __state: {
      importFiles: Record<string, unknown>[];
      transactionEvents: Record<string, unknown>[];
    };
  } = {
    importFile: {
      findUnique: jest.fn(
        ({
          where,
          include,
        }: {
          where: Record<string, string>;
          include?: { transactionEvents?: unknown };
        }) => {
        if (where.fileHash) {
          return (
            importFiles.find((item) => item.fileHash === where.fileHash) ??
            null
          );
        }

        const record = importFiles.find((item) => item.id === where.id);
        if (!record) {
          return null;
        }

        if (include?.transactionEvents) {
          return {
            ...record,
            transactionEvents: transactionEvents.filter(
              (event) => event.importFileId === where.id,
            ),
          };
        }

        return record;
      },
      ),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const record = {
          id: `import_${importFiles.length + 1}`,
          createdAt: new Date('2026-05-12T00:00:00.000Z'),
          confirmedAt: null,
          ...data,
        };
        importFiles.push(record);
        return record;
      }),
      update: jest.fn(
        ({
          where,
          data,
          include,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
          include?: { transactionEvents?: unknown };
        }) => {
          const index = importFiles.findIndex((item) => item.id === where.id);
          importFiles[index] = {
            ...importFiles[index],
            ...data,
          };

          if (include?.transactionEvents) {
            return {
              ...importFiles[index],
              transactionEvents: transactionEvents.filter(
                (event) => event.importFileId === where.id,
              ),
            };
          }

          return importFiles[index];
        },
      ),
    },
    transactionEvent: {
      findMany: jest.fn(
        ({
          where,
        }: {
          where?: { sourceEventHash?: { in?: string[] } };
        }) => {
          const hashes = where?.sourceEventHash?.in;
          if (!hashes) {
            return transactionEvents;
          }

          return transactionEvents.filter((event) =>
            hashes.includes(event.sourceEventHash as string),
          );
        },
      ),
      createMany: jest.fn(({ data }: { data: Record<string, unknown>[] }) => {
        data.forEach((row) => {
          transactionEvents.push({
            id: `event_${transactionEvents.length + 1}`,
            createdAt: new Date('2026-05-12T00:00:00.000Z'),
            ...row,
          });
        });

        return { count: data.length };
      }),
    },
    $transaction: jest.fn(),
    __state: {
      importFiles,
      transactionEvents,
    },
  };

  prisma.$transaction.mockImplementation(
    (callback: (tx: unknown) => unknown) => callback(prisma),
  );

  return prisma;
}

describe('ImportsService', () => {
  it('previews a real IBKR CSV and creates an import file', async () => {
    const prisma = createPrismaMock();
    const service = new ImportsService(prisma as never);

    const result = await service.preview(
      createFileMock('U18666165_20240819_20250819.csv'),
    );

    expect(result.importFileId).toBe('import_1');
    expect(result.summary.parsedRows).toBeGreaterThan(100);
    expect(result.summary.netDeposit).toBe(13019.542272);
    expect(prisma.__state.importFiles).toHaveLength(1);
  });

  it('confirms previewed events and blocks repeated confirm', async () => {
    const prisma = createPrismaMock();
    const service = new ImportsService(prisma as never);

    const preview = await service.preview(
      createFileMock('U18666165_20250819_20260513.csv'),
    );
    const confirm = await service.confirm(preview.importFileId);

    expect(confirm.status).toBe('CONFIRMED');
    expect(confirm.importedCount).toBe(preview.parsedEvents.length);
    expect(confirm.skippedDuplicateCount).toBe(0);
    expect(prisma.__state.transactionEvents).toHaveLength(
      preview.parsedEvents.length,
    );

    await expect(service.confirm(preview.importFileId)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('blocks previewing a file that was already confirmed', async () => {
    const prisma = createPrismaMock();
    const service = new ImportsService(prisma as never);
    const file = createFileMock('U18666165_20250819_20260513.csv');

    const preview = await service.preview(file);
    await service.confirm(preview.importFileId);

    await expect(service.preview(file)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('skips overlapping events across confirmed CSV files', async () => {
    const prisma = createPrismaMock();
    const service = new ImportsService(prisma as never);

    const firstPreview = await service.preview(
      createFileMock('U18666165_20240819_20250819.csv'),
    );
    const firstConfirm = await service.confirm(firstPreview.importFileId);

    const secondPreview = await service.preview(
      createFileMock('U18666165_20250819_20260513.csv'),
    );
    const secondConfirm = await service.confirm(secondPreview.importFileId);

    expect(firstConfirm.importedCount).toBe(firstPreview.parsedEvents.length);
    expect(secondConfirm.importedCount).toBeLessThan(
      secondPreview.parsedEvents.length,
    );
    expect(secondConfirm.skippedDuplicateCount).toBeGreaterThan(0);
    expect(prisma.__state.transactionEvents).toHaveLength(
      firstConfirm.importedCount + secondConfirm.importedCount,
    );

    const eventHashes = prisma.__state.transactionEvents.map(
      (event) => event.sourceEventHash,
    );
    expect(new Set(eventHashes).size).toBe(eventHashes.length);
  });

  it('returns import details with transaction events after confirm', async () => {
    const prisma = createPrismaMock();
    const service = new ImportsService(prisma as never);

    const preview = await service.preview(
      createFileMock('U18666165_20250819_20260513.csv'),
    );
    await service.confirm(preview.importFileId);

    const detail = await service.findOne(preview.importFileId);

    expect(detail.status).toBe('CONFIRMED');
    expect(detail.transactionEvents).toHaveLength(preview.parsedEvents.length);
    expect(detail.transactionEvents[0]).toMatchObject({
      sourceSection: '交易',
      eventType: 'TRADE_SELL',
      symbol: 'AAPL',
    });
  });
});
