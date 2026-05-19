import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { ImportsModule } from './imports/imports.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionEventsModule } from './transaction-events/transaction-events.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    ImportsModule,
    TransactionEventsModule,
    PortfolioModule,
    DashboardModule,
  ],
})
export class AppModule {}
