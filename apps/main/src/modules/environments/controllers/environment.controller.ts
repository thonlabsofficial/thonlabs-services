import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EnvironmentService } from '../services/environment.service';
import { StatusCodes, exceptionsMapper } from '@/utils/enums/errors-metadata';
import { NeedsAuth } from '@/auth/modules/auth/decorators/auth.decorator';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  createEnvironmentValidator,
  updateGeneralSettingsValidator,
  updateAuthSettingsValidator,
} from '../validators/environment-validators';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { SafeParseError } from 'zod';
import { logoValidator } from '../../shared/validators/custom-validators';

@Controller('environments')
export class EnvironmentController {
  constructor(private environmentService: EnvironmentService) {}

  @Get('/:id')
  @NeedsAuth()
  @HasEnvAccess()
  async getById(@Param('id') id: string) {
    const [{ data: environment }, publicKey] = await Promise.all([
      this.environmentService.getById(id),
      this.environmentService.getPublicKey(id),
    ]);

    if (!environment) {
      throw new exceptionsMapper[StatusCodes.NotFound]();
    }

    return { ...environment, publicKey };
  }

  @Get('/:id/secret')
  @NeedsAuth()
  @HasEnvAccess()
  async getSecretKey(@Param('id') id: string) {
    const secretKey = await this.environmentService.getSecretKey(id);

    return { secretKey };
  }

  @Patch('/:id/secret')
  @NeedsAuth()
  @HasEnvAccess()
  async updateSecretKey(@Param('id') id: string) {
    const key = await this.environmentService.updateSecretKey(id);

    return key;
  }

  @Patch('/:id/public')
  @NeedsAuth()
  @HasEnvAccess()
  async updatePublicKey(@Param('id') id: string) {
    const key = await this.environmentService.updatePublicKey(id);

    return key;
  }

  @Post('/')
  @NeedsAuth()
  @SchemaValidator(createEnvironmentValidator)
  async create(@Body() payload) {
    const environment = await this.environmentService.create(payload);

    if (environment.error) {
      throw new exceptionsMapper[environment.statusCode](environment.error);
    }

    return {
      id: environment.data.id,
      name: environment.data.name,
      appURL: environment.data.appURL,
    };
  }

  @Patch('/:id/auth-settings')
  @NeedsAuth()
  @HasEnvAccess()
  @SchemaValidator(updateAuthSettingsValidator)
  async updateAuthSettings(@Param('id') id: string, @Body() payload) {
    const result = await this.environmentService.updateAuthSettings(
      id,
      payload,
    );

    if (result?.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }

  @Patch('/:id/general-settings')
  @NeedsAuth()
  @HasEnvAccess()
  @SchemaValidator(updateGeneralSettingsValidator)
  async updateGeneralSettings(@Param('id') id: string, @Body() payload) {
    await this.environmentService.updateGeneralSettings(id, payload);
  }

  @Patch('/:id/general-settings/logo')
  @NeedsAuth()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadGeneralSettingsLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const validatorLogo = logoValidator.safeParse({ file });

    if (!validatorLogo.success) {
      throw new exceptionsMapper[StatusCodes.BadRequest](
        (
          validatorLogo as SafeParseError<{ file: Express.Multer.File }>
        ).error.issues[0].message,
      );
    }

    const newLogo = await this.environmentService.updateGeneralSettingsLogo(
      id,
      file,
    );

    if (newLogo.error) {
      throw new exceptionsMapper[newLogo.statusCode](newLogo.error);
    }

    return newLogo.data;
  }

  @Delete('/:id')
  @NeedsAuth()
  @HasEnvAccess()
  async delete(@Param('id') id: string) {
    await this.environmentService.delete(id);
  }
}
