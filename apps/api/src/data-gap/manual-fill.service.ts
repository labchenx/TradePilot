import { ConflictException, Injectable } from '@nestjs/common';
import { ImportConfirmService } from '../imports/import-confirm.service';
import {
  ImportPreviewRecord,
  NormalizedImportRecordData,
} from '../imports/import-preview.types';
import { createTransactionEventHash } from '../imports/transaction-event-hash';
import { PortfolioAnalyticsService } from '../portfolio/portfolio-analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ManualFillTradeDto } from './dto/manual-fill.dto';

export interface ManualFillResponse {
  importJobId: string;
  transactionEventId?: string;
  sourceHash: string;
  warnings: string[];
}

type ManualFillNormalizedRecord = NormalizedImportRecordData & {
  sourceHash: string;
};

@Injectable()
export class ManualFillService {
  constructor(
    private readonly importConfirmService: ImportConfirmService,
    private readonly portfolioAnalyticsService: PortfolioAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  async fill(userId: string, dto: ManualFillTradeDto): Promise<ManualFillResponse> {
    const normalized = this.buildNormalizedRecord(dto);
    const record: ImportPreviewRecord = {
      tempId: `manual-${normalized.sourceHash.slice(0, 12)}`,
      recordType: 'TRADE',
      status: 'NEW',
      sourceHash: normalized.sourceHash,
      data: normalized,
      rawData: normalized.rawData,
    };

    const result = await this.importConfirmService.confirm(userId, undefined, [record]);
    const duplicate = result.records.find((item) => item.status === 'DUPLICATE');
    if (duplicate) {
      throw new ConflictException(
        '这笔补录交易已存在。若确实是同日同价同数量的另一笔交易，请填写不同的成交时间或备注后再提交。',
      );
    }

    const [analytics, transactionEvent] = await Promise.all([
      this.portfolioAnalyticsService.getAnalytics(userId),
      this.prisma.transactionEvent.findUnique({
        where: {
          userId_sourceEventHash: {
            userId,
            sourceEventHash: normalized.sourceHash,
          },
        },
        select: { id: true },
      }),
    ]);
    return {
      importJobId: result.importJobId,
      transactionEventId: transactionEvent?.id,
      sourceHash: normalized.sourceHash,
      warnings: [...result.warnings, ...analytics.warnings],
    };
  }

  private buildNormalizedRecord(dto: ManualFillTradeDto): ManualFillNormalizedRecord {
    const symbol = dto.symbol.trim().toUpperCase();
    const currency = dto.currency.trim().toUpperCase();
    const accountId = dto.accountId?.trim() ?? '';
    const tradeTime = normalizeTradeTime(dto.tradeTime);
    const quantity = Math.abs(dto.quantity);
    const signedQuantity = dto.side === 'SELL' ? -quantity : quantity;
    const grossAmount = dto.side === 'BUY' ? -quantity * dto.price : quantity * dto.price;
    const commission = -Math.abs((dto.commission ?? 0) + (dto.fee ?? 0));
    const netAmount = grossAmount + commission;
    const cashAdjustmentMode = dto.cashAdjustmentMode ?? 'ADJUST_CASH';
    const note = dto.note?.trim() ?? '';
    const sourceFileName = `手动补录_${dto.tradeDate}_${symbol}.json`;
    const rawData: Record<string, string> = {
      source: 'MANUAL_GAP_FILL',
      cashAdjustmentMode,
      symbol,
      tradeDate: dto.tradeDate,
      tradeTime,
      side: dto.side,
      quantity: String(quantity),
      price: String(dto.price),
      commission: String(commission),
      currency,
      accountId,
      note,
    };
    const eventForHash = {
      source: 'IBKR_CSV' as const,
      sourceSection: 'MANUAL_GAP_FILL',
      rawRowIndex: 1,
      rawData,
      tradeDate: dto.tradeDate,
      accountId,
      description: `股票交易 ${symbol}`,
      ibkrType: dto.side,
      eventType: dto.side === 'BUY' ? 'TRADE_BUY' as const : 'TRADE_SELL' as const,
      symbol,
      quantity: signedQuantity,
      absQuantity: quantity,
      price: dto.price,
      currency,
      grossAmount,
      commission,
      netAmount,
      side: dto.side,
      isTrade: true,
      isExternalCashFlow: false,
      isIncome: false,
      isTaxOrFee: false,
    };
    const sourceHash = createTransactionEventHash(eventForHash);

    return {
      ...eventForHash,
      sourceHash,
      sourceFileName,
      sourceFileHash: `manual-fill-${sourceHash}`,
      amount: netAmount,
      realizedPnl: undefined,
    };
  }
}

function normalizeTradeTime(value: string | undefined) {
  if (!value) return '';
  return value.length === 5 ? `${value}:00` : value;
}
