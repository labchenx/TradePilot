import { IsArray, IsOptional, IsString } from 'class-validator';

export class ConfirmImportDto {
  @IsOptional()
  @IsString()
  importFileId?: string;

  @IsOptional()
  @IsString()
  jobPreviewId?: string;

  @IsOptional()
  @IsArray()
  records?: unknown[];
}
