import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  preview(@UploadedFile() file: Express.Multer.File) {
    return this.importsService.preview(file);
  }

  @Post('confirm')
  confirm(@Body() confirmImportDto: ConfirmImportDto) {
    return this.importsService.confirm(confirmImportDto.importFileId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importsService.findOne(id);
  }
}

