import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EmailProvider, EmailScanRange } from '@prisma/client';

export class UpdateEmailSettingsDto {
  @IsEnum(EmailProvider)
  provider!: EmailProvider;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  authCode?: string;

  @IsOptional()
  @IsEnum(EmailScanRange)
  defaultScanRange?: EmailScanRange;

  @IsOptional()
  @IsBoolean()
  onlyIbkrEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  onlyPdfAttachments?: boolean;

  @IsOptional()
  @IsBoolean()
  markAsRead?: boolean;
}
