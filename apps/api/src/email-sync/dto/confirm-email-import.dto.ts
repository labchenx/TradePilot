import { IsArray } from 'class-validator';
import { EmailPdfTradePreview } from '../email-sync.types';

export class ConfirmEmailImportDto {
  @IsArray()
  trades!: EmailPdfTradePreview[];
}
