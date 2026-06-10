import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DataGapItem {
  date: string;
  reasons: string[];
  hasPrecedingData: boolean;
  hasFollowingData: boolean;
}

export interface DataGapCheckResponse {
  gaps: DataGapItem[];
  checkedRange: { start: string; end: string };
  tradingDaysChecked: number;
  status: 'NO_TRADE_DATA' | 'HEALTHY' | 'HAS_GAPS';
}

@Injectable()
export class DataGapService {
  constructor(private readonly prisma: PrismaService) {}

  async checkGaps(userId: string, lookbackDays = 30): Promise<DataGapCheckResponse> {
    const endDate = toDateOnly(new Date());
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - lookbackDays);

    const [emailDates, importDates, transactionDates] = await Promise.all([
      this.getEmailMessageDates(userId, startDate, endDate),
      this.getImportFileDates(userId, startDate, endDate),
      this.getTransactionDates(userId, startDate, endDate),
    ]);
    const activeDates = new Set([...emailDates, ...importDates, ...transactionDates]);
    const sortedActiveDates = Array.from(activeDates).sort();

    if (transactionDates.size === 0) {
      const checkedRange = sortedActiveDates.length > 0
        ? {
            start: sortedActiveDates[0],
            end: sortedActiveDates[sortedActiveDates.length - 1],
          }
        : { start: formatDate(startDate), end: formatDate(endDate) };

      return {
        gaps: [],
        checkedRange,
        tradingDaysChecked: 0,
        status: 'NO_TRADE_DATA',
      };
    }

    const earliestActive = sortedActiveDates[0];
    const latestActive = sortedActiveDates[sortedActiveDates.length - 1];
    const weekdays = getWeekdaysBetween(earliestActive, latestActive);
    const gaps: DataGapItem[] = [];

    for (const day of weekdays) {
      if (activeDates.has(day)) continue;

      const hasPrecedingData = sortedActiveDates.some((activeDay) => activeDay < day);
      const hasFollowingData = sortedActiveDates.some((activeDay) => activeDay > day);
      if (!hasPrecedingData || !hasFollowingData) continue;

      gaps.push({
        date: day,
        reasons: [
          '无邮件同步记录',
          '无导入记录',
          '无交易事件',
        ],
        hasPrecedingData,
        hasFollowingData,
      });
    }

    return {
      gaps,
      checkedRange: { start: earliestActive, end: latestActive },
      tradingDaysChecked: weekdays.length,
      status: gaps.length > 0 ? 'HAS_GAPS' : 'HEALTHY',
    };
  }

  private async getEmailMessageDates(userId: string, start: Date, end: Date) {
    const records = await this.prisma.emailMessageRecord.findMany({
      where: {
        userId,
        receivedAt: { gte: start, lte: end },
        status: { in: ['FOUND', 'PARSED', 'IMPORTED'] },
      },
      select: { receivedAt: true },
    });

    return new Set(
      records
        .map((record) => record.receivedAt)
        .filter((date): date is Date => date instanceof Date)
        .map(formatDate),
    );
  }

  private async getImportFileDates(userId: string, start: Date, end: Date) {
    const files = await this.prisma.importFile.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        OR: [
          { periodStart: { gte: start, lte: end } },
          { periodEnd: { gte: start, lte: end } },
          { createdAt: { gte: start, lte: end } },
        ],
      },
      select: { periodStart: true, periodEnd: true, createdAt: true },
    });

    const dates = new Set<string>();
    for (const file of files) {
      const fileStart = file.periodStart ?? file.periodEnd ?? file.createdAt;
      const fileEnd = file.periodEnd ?? file.periodStart ?? file.createdAt;
      for (const date of getWeekdaysBetween(
        formatDate(maxDate(fileStart, start)),
        formatDate(minDate(fileEnd, end)),
      )) {
        dates.add(date);
      }
    }
    return dates;
  }

  private async getTransactionDates(userId: string, start: Date, end: Date) {
    const events = await this.prisma.transactionEvent.findMany({
      where: {
        userId,
        isTrade: true,
        tradeDate: { gte: start, lte: end },
      },
      select: { tradeDate: true },
      distinct: ['tradeDate'],
    });

    return new Set(events.map((event) => formatDate(event.tradeDate)));
  }
}

function toDateOnly(value: Date) {
  return new Date(`${value.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function minDate(left: Date, right: Date) {
  return left.getTime() <= right.getTime() ? left : right;
}

function maxDate(left: Date, right: Date) {
  return left.getTime() >= right.getTime() ? left : right;
}

function getWeekdaysBetween(start: string, end: string) {
  const result: string[] = [];
  const current = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);

  while (current <= endDate) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      result.push(formatDate(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}
