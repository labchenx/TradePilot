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
import { CurrentUserParam } from '../auth/current-user.decorator';
import { CurrentUser } from '../auth/auth.types';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { ImportsService } from './imports.service';

@Controller(['imports', 'api/imports'])
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  preview(
    @CurrentUserParam() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importsService.preview(user.id, file);
  }

  @Post('confirm')
  confirm(
    @CurrentUserParam() user: CurrentUser,
    @Body() confirmImportDto: ConfirmImportDto,
  ) {
    return this.importsService.confirmIbkrCsv(user.id, confirmImportDto);
  }

  @Post('ibkr-csv/preview')
  @UseInterceptors(FilesInterceptor('files', 10))
  previewIbkrCsv(
    @CurrentUserParam() user: CurrentUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.importsService.previewIbkrCsv(user.id, files ?? []);
  }

  @Post('ibkr-csv/confirm')
  confirmIbkrCsv(
    @CurrentUserParam() user: CurrentUser,
    @Body() confirmImportDto: ConfirmImportDto,
  ) {
    return this.importsService.confirmIbkrCsv(user.id, confirmImportDto);
  }

  @Get('history')
  history(@CurrentUserParam() user: CurrentUser) {
    return this.importsService.history(user.id);
  }

  @Delete('history/:id')
  deleteHistory(
    @CurrentUserParam() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.importsService.deleteHistory(user.id, id);
  }

  @Get(':id')
  findOne(@CurrentUserParam() user: CurrentUser, @Param('id') id: string) {
    return this.importsService.findOne(user.id, id);
  }
}
