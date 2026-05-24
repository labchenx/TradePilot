import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.types';
import { CurrentUserParam } from '../auth/current-user.decorator';
import { ConfirmEmailImportDto } from './dto/confirm-email-import.dto';
import { ListEmailSyncJobsDto } from './dto/list-email-sync-jobs.dto';
import { SearchIbkrMailsDto } from './dto/search-ibkr-mails.dto';
import { EmailSyncService } from './email-sync.service';

@Controller(['email-sync', 'api/email-sync'])
export class EmailSyncController {
  constructor(private readonly emailSyncService: EmailSyncService) {}

  @Post('search-ibkr-mails')
  searchIbkrMails(
    @CurrentUserParam() user: CurrentUser,
    @Body() dto: SearchIbkrMailsDto,
  ) {
    return this.emailSyncService.searchIbkrMails(user.id, dto);
  }

  @Post('scan-and-preview')
  scanAndPreview(
    @CurrentUserParam() user: CurrentUser,
    @Body() dto: SearchIbkrMailsDto,
  ) {
    return this.emailSyncService.scanAndPreview(user.id, dto);
  }

  @Post('confirm-import')
  confirmImport(
    @CurrentUserParam() user: CurrentUser,
    @Body() dto: ConfirmEmailImportDto,
  ) {
    return this.emailSyncService.confirmImport(user.id, dto);
  }

  @Post('run-now')
  runNow(@CurrentUserParam() user: CurrentUser) {
    return this.emailSyncService.runNow(user.id);
  }

  @Get('jobs')
  listJobs(
    @CurrentUserParam() user: CurrentUser,
    @Query() query: ListEmailSyncJobsDto,
  ) {
    return this.emailSyncService.listJobs(user.id, query);
  }
}
