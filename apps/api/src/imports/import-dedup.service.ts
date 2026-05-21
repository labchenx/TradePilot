import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ImportPreviewRecord,
  NormalizedImportRecordData,
} from './import-preview.types';

function hasUpdatableFields(data: NormalizedImportRecordData) {
  return (
    data.commission !== 0 ||
    data.rawData !== undefined ||
    data.price !== undefined ||
    data.currency !== undefined
  );
}

function canFillExistingEvent(
  existing: {
    id: string;
    commission: Prisma.Decimal;
    price: Prisma.Decimal | null;
    currency: string | null;
    rawData: Prisma.JsonValue;
  },
  data: NormalizedImportRecordData,
) {
  const commissionIsMissing = existing.commission.equals(0) && data.commission !== 0;
  const priceIsMissing = existing.price === null && data.price !== undefined;
  const currencyIsMissing = !existing.currency && data.currency;
  const rawDataIsMissing =
    existing.rawData === null ||
    (typeof existing.rawData === 'object' &&
      existing.rawData !== null &&
      Object.keys(existing.rawData).length === 0);

  return Boolean(
    hasUpdatableFields(data) &&
      (commissionIsMissing || priceIsMissing || currencyIsMissing || rawDataIsMissing),
  );
}

@Injectable()
export class ImportDedupService {
  constructor(private readonly prisma: PrismaService) {}

  async markPreviewRecords(records: ImportPreviewRecord[]) {
    const hashes = records
      .map((record) => record.sourceHash)
      .filter((hash): hash is string => typeof hash === 'string');

    const existingByHash = await this.prisma.transactionEvent.findMany({
      where: { sourceEventHash: { in: hashes } },
      select: { id: true, sourceEventHash: true },
    });
    const exactDuplicates = new Map(
      existingByHash
        .filter((event) => event.sourceEventHash)
        .map((event) => [event.sourceEventHash as string, event.id]),
    );
    const seenInCurrentPreview = new Map<string, string>();

    for (const record of records) {
      if (record.status === 'ERROR' || !record.sourceHash) {
        continue;
      }

      const existingEventId = exactDuplicates.get(record.sourceHash);
      if (existingEventId) {
        record.status = 'DUPLICATE';
        record.data.existingEventId = existingEventId;
        continue;
      }

      const firstTempId = seenInCurrentPreview.get(record.sourceHash);
      if (firstTempId) {
        record.status = 'DUPLICATE';
        record.errorMessage = `Duplicate inside this preview; first record is ${firstTempId}.`;
        continue;
      }
      seenInCurrentPreview.set(record.sourceHash, record.tempId);

      const updateTarget = await this.findUpdateCandidate(record.data);
      if (updateTarget) {
        record.status = 'UPDATE';
        record.data.existingEventId = updateTarget.id;
      }
    }

    return records;
  }

  private async findUpdateCandidate(data: NormalizedImportRecordData) {
    const candidates = await this.prisma.transactionEvent.findMany({
      where: {
        accountId: data.accountId,
        tradeDate: new Date(`${data.tradeDate}T00:00:00.000Z`),
        eventType: data.eventType,
        symbol: data.symbol ?? null,
        quantity:
          typeof data.quantity === 'number'
            ? new Prisma.Decimal(data.quantity)
            : null,
        price:
          typeof data.price === 'number'
            ? new Prisma.Decimal(data.price)
            : null,
        netAmount: new Prisma.Decimal(data.netAmount),
      },
      select: {
        id: true,
        commission: true,
        price: true,
        currency: true,
        rawData: true,
      },
      take: 5,
    });

    return (
      candidates.find((candidate) => canFillExistingEvent(candidate, data)) ??
      null
    );
  }
}
