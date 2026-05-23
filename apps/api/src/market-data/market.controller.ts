import { Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.types';
import { CurrentUserParam } from '../auth/current-user.decorator';
import { MarketMaintenanceService } from './market-maintenance.service';

@Controller(['market', 'api/market'])
export class MarketController {
  constructor(
    private readonly marketMaintenanceService: MarketMaintenanceService,
  ) {}

  @Post('refresh-quotes')
  refreshQuotes(@CurrentUserParam() user: CurrentUser) {
    return this.marketMaintenanceService.refreshQuotes(user.id);
  }

  @Post('backfill-history')
  backfillHistory(@CurrentUserParam() user: CurrentUser) {
    return this.marketMaintenanceService.backfillHistory(user.id);
  }
}
