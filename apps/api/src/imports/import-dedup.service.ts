import { Injectable } from '@nestjs/common';
import { DuplicateStrategy, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ImportPreviewRecord,
  NormalizedImportRecordData,
} from './import-preview.types';
import { createCrossSourceTradeFingerprint } from './trade-identity';

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

  async markPreviewRecords(userId: string, records: ImportPreviewRecord[]) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { duplicateStrategy: true },
    });
    const duplicateStrategy =
      settings?.duplicateStrategy ?? DuplicateStrategy.UPDATE_EMPTY_FIELDS;
    const hashes = records
      .map((record) => record.sourceHash)
      .filter((hash): hash is string => typeof hash === 'string');

    const existingByHash = await this.prisma.transactionEvent.findMany({
      where: { userId, sourceEventHash: { in: hashes } },
      select: { id: true, sourceEventHash: true },
    });
    const exactDuplicates = new Map(
      existingByHash
        .filter((event) => event.sourceEventHash)
        .map((event) => [event.sourceEventHash as string, event.id]),
    );
    const seenInCurrentPreview = new Map<string, string>();
    const seenTradeFingerprints = new Map<string, string>();

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

      const tradeFingerprint = createCrossSourceTradeFingerprint(record.data);
      if (tradeFingerprint) {
        const firstTempId = seenTradeFingerprints.get(tradeFingerprint);
        if (firstTempId) {
          record.status = 'DUPLICATE';
          record.errorMessage = `Duplicate trade inside this preview; first record is ${firstTempId}.`;
          continue;
        }
        seenTradeFingerprints.set(tradeFingerprint, record.tempId);

        const crossSourceDuplicate = await this.findCrossSourceDuplicateCandidate(
          userId,
          record.data,
          tradeFingerprint,
        );
        if (crossSourceDuplicate) {
          record.status = 'DUPLICATE';
          record.data.existingEventId = crossSourceDuplicate.id;
          continue;
        }
      }

      if (duplicateStrategy === DuplicateStrategy.UPDATE_EMPTY_FIELDS) {
        const updateTarget = await this.findUpdateCandidate(userId, record.data);
        if (updateTarget) {
          record.status = 'UPDATE';
          record.data.existingEventId = updateTarget.id;
        }
      }
    }

    return records;
  }

  private async findCrossSourceDuplicateCandidate(
    userId: string,
    data: NormalizedImportRecordData,
    fingerprint: string,
  ) {
    if (!data.isTrade || !data.symbol || !data.side || data.absQuantity === undefined) {
      return null;
    }

    const candidates = await this.prisma.transactionEvent.findMany({
      where: {
        userId,
        isTrade: true,
        tradeDate: new Date(`${data.tradeDate}T00:00:00.000Z`),
        eventType: data.eventType,
        symbol: data.symbol,
        side: data.side,
        absQuantity: new Prisma.Decimal(data.absQuantity),
        price:
          typeof data.price === 'number'
            ? new Prisma.Decimal(data.price)
            : null,
        currency: data.currency ?? null,
      },
      take: 20,
    });

    return (
      candidates.find(
        (candidate) => createCrossSourceTradeFingerprint(candidate) === fingerprint,
      ) ?? null
    );
  }

  private async findUpdateCandidate(userId: string, data: NormalizedImportRecordData) {
    const candidates = await this.prisma.transactionEvent.findMany({
      where: {
        userId,
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
