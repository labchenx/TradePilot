import { Module } from '@nestjs/common';
import { TransactionEventsController } from './transaction-events.controller';
import { TransactionEventsService } from './transaction-events.service';

@Module({
  controllers: [TransactionEventsController],
  providers: [TransactionEventsService],
})
export class TransactionEventsModule {}

