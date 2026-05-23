import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListTransactionEventsDto } from './dto/list-transaction-events.dto';

type TransactionEventRow = Prisma.TransactionEventGetPayload<object>;
const DEFAULT_USER_ID = 'default_user';

function decimalToNumber(value: Prisma.Decimal | null): number | undefined {
  return value === null ? undefined : value.toNumber();
}

function toResponse(event: TransactionEventRow) {
  return {
    ...event,
    tradeDate: event.tradeDate.toISOString().slice(0, 10),
    createdAt: event.createdAt.toISOString(),
    quantity: decimalToNumber(event.quantity),
    absQuantity: decimalToNumber(event.absQuantity),
    price: decimalToNumber(event.price),
    grossAmount: event.grossAmount.toNumber(),
    commission: event.commission.toNumber(),
    netAmount: event.netAmount.toNumber(),
  };
}

@Injectable()
export class TransactionEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userIdOrQuery: string | ListTransactionEventsDto,
    maybeQuery?: ListTransactionEventsDto,
  ) {
    const userId =
      typeof userIdOrQuery === 'string' ? userIdOrQuery : DEFAULT_USER_ID;
    const query = (typeof userIdOrQuery === 'string'
      ? (maybeQuery ?? {})
      : userIdOrQuery) as Partial<ListTransactionEventsDto>;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.transactionEvent.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: [{ tradeDate: 'desc' }, { rawRowIndex: 'asc' }],
      }),
      this.prisma.transactionEvent.count({ where: { userId } }),
    ]);

    return {
      list: list.map(toResponse),
      total,
      page,
      pageSize,
    };
  }
}
