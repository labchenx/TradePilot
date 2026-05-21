import { ImportConfirmService } from './import-confirm.service';
import { ImportPreviewRecord } from './import-preview.types';

function createPreviewRecord(): ImportPreviewRecord {
  return {
    tempId: '0-1-sourcehash',
    recordType: 'TRADE',
    status: 'DUPLICATE',
    sourceHash: 'sourcehash',
    rawData: { row: 'raw' },
    data: {
      source: 'IBKR_CSV',
      sourceSection: 'Trades',
      rawRowIndex: 1,
      rawData: { row: 'raw' },
      tradeDate: '2026-05-14',
      accountId: 'U***66165',
      description: '股票交易 AMD',
      ibkrType: 'Trades',
      eventType: 'TRADE_BUY',
      grossAmount: -100,
      commission: -1,
      netAmount: -101,
      isTrade: true,
      isExternalCashFlow: false,
      isIncome: false,
      isTaxOrFee: false,
      sourceHash: 'sourcehash',
      sourceFileHash: 'filehash',
      sourceFileName: 'statement.csv',
      sourceFileSummary: {
        totalRows: 10,
        parsedRows: 10,
        tradeRows: 1,
        cashFlowRows: 0,
        warningCount: 0,
        errorCount: 0,
        depositTotal: 0,
        withdrawalTotal: 0,
        netDeposit: 0,
        dividendTotal: 0,
        taxAndFeeTotal: 0,
        tradeBuyTotal: -101,
        tradeSellTotal: 0,
        commissionTotal: -1,
        cashReport: {
          beginningCash: 0,
          deposits: 0,
          withdrawals: 0,
          buyCash: -101,
          sellCash: 0,
          dividends: 0,
          paymentInLieu: 0,
          withholdingTax: 0,
          interest: 0,
          commissions: -1,
          fees: 0,
          fxCashPnl: 0,
          otherCashAdjustments: 0,
          accruedDividend: 0,
          cashBalance: 7713.59,
          settledCash: 7713.59,
        },
      },
      amount: -101,
    },
  };
}

describe('ImportConfirmService', () => {
  it('backfills import file summary with the parser cash report during duplicate confirmation', async () => {
    const record = createPreviewRecord();
    const importFileUpdate = jest.fn();
    const prisma = {
      importJob: {
        findUnique: jest.fn(async () => ({
          id: 'job_preview_1',
          status: 'PREVIEWED',
          previewRecords: [record],
        })),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          importJob: {
            update: jest.fn(),
          },
          importFile: {
            findUnique: jest.fn(async () => ({
              id: 'import_file_1',
              status: 'CONFIRMED',
              summary: { totalRecords: 1 },
            })),
            update: importFileUpdate,
          },
          transactionEvent: {
            findUnique: jest.fn(async () => ({ id: 'existing_event_1' })),
          },
          importRecord: {
            createMany: jest.fn(),
          },
        }),
      ),
    };

    const service = new ImportConfirmService(prisma as never, {
      regenerateSnapshotsFromMonth: jest.fn(),
    } as never);

    await service.confirm('job_preview_1');

    expect(importFileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'import_file_1' },
        data: expect.objectContaining({
          summary: expect.objectContaining({
            cashReport: expect.objectContaining({ cashBalance: 7713.59 }),
          }),
        }),
      }),
    );
  });
});
