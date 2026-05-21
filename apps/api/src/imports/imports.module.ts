import { Module } from '@nestjs/common';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ImportConfirmService } from './import-confirm.service';
import { ImportDedupService } from './import-dedup.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [PortfolioModule],
  controllers: [ImportsController],
  providers: [ImportConfirmService, ImportDedupService, ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
