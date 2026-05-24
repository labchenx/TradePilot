import { IsIn } from 'class-validator';

export type EmailScanRangeInput = '3d' | '7d' | '30d' | '90d';

export class SearchIbkrMailsDto {
  @IsIn(['3d', '7d', '30d', '90d'])
  range: EmailScanRangeInput = '3d';
}
