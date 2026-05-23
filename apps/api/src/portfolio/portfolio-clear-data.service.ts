import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ClearDataBody {
  confirmation?: string;
}

@Injectable()
export class PortfolioClearDataService {
  constructor(private readonly prisma: PrismaService) {}

  async clearCurrentUserData(userId: string, body: ClearDataBody) {
    if (body.confirmation !== 'CLEAR') {
      throw new BadRequestException('Type CLEAR to confirm data clearing.');
    }

    // Only private rows owned by currentUser are deleted. Public market quote
    // caches such as price_history stay intact and can be reused by every user.
    return this.prisma.$transaction(async (tx) => {
      const deletedCounts = {
        importRecords: 0,
        importJobs: 0,
        cashFlows: 0,
        transactionEvents: 0,
        importFiles: 0,
        portfolioMonthlySnapshots: 0,
        positionMonthlySnapshots: 0,
        symbolMappings: 0,
        userSettings: 0,
      };

      deletedCounts.importRecords = (await tx.importRecord.deleteMany({ where: { userId } })).count;
      deletedCounts.importJobs = (await tx.importJob.deleteMany({ where: { userId } })).count;
      deletedCounts.cashFlows = (await tx.cashFlow.deleteMany({ where: { userId } })).count;
      deletedCounts.symbolMappings = (await tx.symbolMapping.deleteMany({ where: { userId } })).count;
      deletedCounts.userSettings = (await tx.userSettings.deleteMany({ where: { userId } })).count;
      deletedCounts.positionMonthlySnapshots = (
        await tx.positionMonthlySnapshot.deleteMany({ where: { userId } })
      ).count;
      deletedCounts.portfolioMonthlySnapshots = (
        await tx.portfolioMonthlySnapshot.deleteMany({ where: { userId } })
      ).count;
      deletedCounts.transactionEvents = (
        await tx.transactionEvent.deleteMany({ where: { userId } })
      ).count;
      deletedCounts.importFiles = (await tx.importFile.deleteMany({ where: { userId } })).count;

      return {
        success: true,
        deletedCounts,
      };
    });
  }
}
