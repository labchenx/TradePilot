import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmImportDto {
  @IsString()
  @IsNotEmpty()
  importFileId!: string;
}

