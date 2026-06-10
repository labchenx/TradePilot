import { Module } from '@nestjs/common';
import { ImportsModule } from '../imports/imports.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { DataGapController } from './data-gap.controller';
import { DataGapService } from './data-gap.service';
import { ManualFillService } from './manual-fill.service';

@Module({
  imports: [ImportsModule, PortfolioModule],
  controllers: [DataGapController],
  providers: [DataGapService, ManualFillService],
})
export class DataGapModule {}
