import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.types';
import { CurrentUserParam } from '../auth/current-user.decorator';
import { CheckDataGapDto } from './dto/check-data-gap.dto';
import { ManualFillTradeDto } from './dto/manual-fill.dto';
import { DataGapService } from './data-gap.service';
import { ManualFillService } from './manual-fill.service';

@Controller(['data-gap', 'api/data-gap'])
export class DataGapController {
  constructor(
    private readonly dataGapService: DataGapService,
    private readonly manualFillService: ManualFillService,
  ) {}

  @Get('check')
  check(@CurrentUserParam() user: CurrentUser, @Query() dto: CheckDataGapDto) {
    return this.dataGapService.checkGaps(user.id, dto.lookbackDays);
  }

  @Post('manual-fill')
  manualFill(@CurrentUserParam() user: CurrentUser, @Body() dto: ManualFillTradeDto) {
    return this.manualFillService.fill(user.id, dto);
  }
}
