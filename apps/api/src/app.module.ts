import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailSyncModule } from './email-sync/email-sync.module';
import { HealthModule } from './health/health.module';
import { ImportsModule } from './imports/imports.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { TransactionEventsModule } from './transaction-events/transaction-events.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    EmailSyncModule,
    ImportsModule,
    TransactionEventsModule,
    PortfolioModule,
    DashboardModule,
    SettingsModule,
  ],
})
export class AppModule {}
