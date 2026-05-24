import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EmailSyncJobStatus, EmailSyncTriggerType } from '@prisma/client';

export class ListEmailSyncJobsDto {
  @IsOptional()
  @IsEnum(EmailSyncTriggerType)
  triggerType?: EmailSyncTriggerType;

  @IsOptional()
  @IsEnum(EmailSyncJobStatus)
  status?: EmailSyncJobStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
