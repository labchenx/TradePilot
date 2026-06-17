import { IsIn } from 'class-validator';

export type UpdateTransactionSide = 'BUY' | 'SELL';

export class UpdateTransactionSideDto {
  @IsIn(['BUY', 'SELL'])
  side!: UpdateTransactionSide;
}
