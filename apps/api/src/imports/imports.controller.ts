import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { ImportsService } from './imports.service';

@Controller(['imports', 'api/imports'])
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  preview(@UploadedFile() file: Express.Multer.File) {
    return this.importsService.preview(file);
  }

  @Post('confirm')
  confirm(@Body() confirmImportDto: ConfirmImportDto) {
    return this.importsService.confirmIbkrCsv(confirmImportDto);
  }

  @Post('ibkr-csv/preview')
  @UseInterceptors(FilesInterceptor('files', 10))
  previewIbkrCsv(@UploadedFiles() files: Express.Multer.File[]) {
    return this.importsService.previewIbkrCsv(files ?? []);
  }

  @Post('ibkr-csv/confirm')
  confirmIbkrCsv(@Body() confirmImportDto: ConfirmImportDto) {
    return this.importsService.confirmIbkrCsv(confirmImportDto);
  }

  @Get('history')
  history() {
    return this.importsService.history();
  }

  @Delete('history/:id')
  deleteHistory(@Param('id') id: string) {
    return this.importsService.deleteHistory(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importsService.findOne(id);
  }
}
