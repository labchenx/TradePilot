import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ClearDataBody {
  confirmation?: string;
}

@Injectable()
export class PortfolioClearDataService {
  constructor(private readonly prisma: PrismaService) {}

  async clearCurrentUserData(body: ClearDataBody) {
    if (body.confirmation !== 'CLEAR') {
      throw new BadRequestException('Type CLEAR to confirm data clearing.');
    }

    // Current MVP is single-user and has no auth/userId yet. This deletes only
    // investment/import data tables and keeps public market quote caches intact.
    return this.prisma.$transaction(async (tx) => {
      const deletedCounts = {
        importRecords: 0,
        importJobs: 0,
        cashFlows: 0,
        transactionEvents: 0,
        importFiles: 0,
        portfolioMonthlySnapshots: 0,
        positionMonthlySnapshots: 0,
      };

      deletedCounts.importRecords = (await tx.importRecord.deleteMany()).count;
      deletedCounts.importJobs = (await tx.importJob.deleteMany()).count;
      deletedCounts.cashFlows = (await tx.cashFlow.deleteMany()).count;
      deletedCounts.positionMonthlySnapshots = (
        await tx.positionMonthlySnapshot.deleteMany()
      ).count;
      deletedCounts.portfolioMonthlySnapshots = (
        await tx.portfolioMonthlySnapshot.deleteMany()
      ).count;
      deletedCounts.transactionEvents = (
        await tx.transactionEvent.deleteMany()
      ).count;
      deletedCounts.importFiles = (await tx.importFile.deleteMany()).count;

      return {
        success: true,
        deletedCounts,
      };
    });
  }
}
