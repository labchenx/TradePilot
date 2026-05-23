import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { DuplicateStrategy, ImportSource } from '@prisma/client';

export class UpdateImportSettingsDto {
  @IsOptional()
  @IsEnum(ImportSource)
  defaultImportSource?: ImportSource;

  @IsOptional()
  @IsEnum(DuplicateStrategy)
  duplicateStrategy?: DuplicateStrategy;

  @IsOptional()
  @IsBoolean()
  autoRefreshQuotesAfterImport?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRegenerateSnapshotsAfterImport?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRecalculateMetricsAfterImport?: boolean;

  @IsOptional()
  @IsBoolean()
  saveRawData?: boolean;
}
