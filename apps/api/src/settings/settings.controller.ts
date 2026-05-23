import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/auth.types';
import { CurrentUserParam } from '../auth/current-user.decorator';
import {
  CreateSymbolMappingDto,
  ListSymbolMappingsDto,
  UpdateSymbolMappingDto,
} from './dto/symbol-mapping.dto';
import { UpdateImportSettingsDto } from './dto/update-import-settings.dto';
import { UpdateMarketDataSettingsDto } from './dto/update-market-data-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SettingsService } from './settings.service';

@Controller(['settings', 'api/settings'])
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Put('profile')
  updateProfile(
    @CurrentUserParam() user: CurrentUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.settingsService.updateProfile(user.id, dto);
  }

  @Get('status')
  getStatus(@CurrentUserParam() user: CurrentUser) {
    return this.settingsService.getStatus(user.id);
  }

  @Get('market-data')
  getMarketDataSettings(@CurrentUserParam() user: CurrentUser) {
    return this.settingsService.getMarketDataSettings(user.id);
  }

  @Put('market-data')
  updateMarketDataSettings(
    @CurrentUserParam() user: CurrentUser,
    @Body() dto: UpdateMarketDataSettingsDto,
  ) {
    return this.settingsService.updateMarketDataSettings(user.id, dto);
  }

  @Get('symbol-mappings')
  listSymbolMappings(
    @CurrentUserParam() user: CurrentUser,
    @Query() query: ListSymbolMappingsDto,
  ) {
    return this.settingsService.listSymbolMappings(user.id, query);
  }

  @Post('symbol-mappings')
  createSymbolMapping(
    @CurrentUserParam() user: CurrentUser,
    @Body() dto: CreateSymbolMappingDto,
  ) {
    return this.settingsService.createSymbolMapping(user.id, dto);
  }

  @Put('symbol-mappings/:id')
  updateSymbolMapping(
    @CurrentUserParam() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateSymbolMappingDto,
  ) {
    return this.settingsService.updateSymbolMapping(user.id, id, dto);
  }

  @Delete('symbol-mappings/:id')
  deleteSymbolMapping(
    @CurrentUserParam() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.settingsService.deleteSymbolMapping(user.id, id);
  }

  @Get('import')
  getImportSettings(@CurrentUserParam() user: CurrentUser) {
    return this.settingsService.getImportSettings(user.id);
  }

  @Put('import')
  updateImportSettings(
    @CurrentUserParam() user: CurrentUser,
    @Body() dto: UpdateImportSettingsDto,
  ) {
    return this.settingsService.updateImportSettings(user.id, dto);
  }
}
