import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
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
  autoSyncEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  syncTime?: string;

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
