import { Controller, Get, Query } from '@nestjs/common';
import { ListTransactionEventsDto } from './dto/list-transaction-events.dto';
import { TransactionEventsService } from './transaction-events.service';

@Controller('transaction-events')
export class TransactionEventsController {
  constructor(
    private readonly transactionEventsService: TransactionEventsService,
  ) {}

  @Get()
  findAll(@Query() query: ListTransactionEventsDto) {
    return this.transactionEventsService.findAll(query);
  }
}

