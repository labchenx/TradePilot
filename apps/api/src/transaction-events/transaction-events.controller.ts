import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUserParam } from '../auth/current-user.decorator';
import { CurrentUser } from '../auth/auth.types';
import { ListTransactionEventsDto } from './dto/list-transaction-events.dto';
import { TransactionEventsService } from './transaction-events.service';

@Controller('transaction-events')
export class TransactionEventsController {
  constructor(
    private readonly transactionEventsService: TransactionEventsService,
  ) {}

  @Get()
  findAll(
    @CurrentUserParam() user: CurrentUser,
    @Query() query: ListTransactionEventsDto,
  ) {
    return this.transactionEventsService.findAll(user.id, query);
  }
}
