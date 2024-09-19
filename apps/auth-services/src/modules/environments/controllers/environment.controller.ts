import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { EnvironmentService } from '../services/environment.service';
import { StatusCodes, exceptionsMapper } from '@/utils/enums/errors-metadata';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import {
  createEnvironmentValidator,
  updateGeneralSettingsValidator,
  updateAuthSettingsValidator,
} from '../validators/environment-validators';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { PublicKeyOrThonLabsOnly } from '../../shared/decorators/public-key-or-thon-labs-user.decorator';
import { PublicRoute } from '../../auth/decorators/auth.decorator';

@Controller('environments')
export class EnvironmentController {
  constructor(private environmentService: EnvironmentService) {}

  @Get('/:id')
  @ThonLabsOnly()
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
  @ThonLabsOnly()
  @HasEnvAccess()
  async getSecretKey(@Param('id') id: string) {
    const secretKey = await this.environmentService.getSecretKey(id);

    return { secretKey };
  }

  @Patch('/:id/secret')
  @ThonLabsOnly()
  @HasEnvAccess()
  async updateSecretKey(@Param('id') id: string) {
    const key = await this.environmentService.updateSecretKey(id);

    return key;
  }

  @Patch('/:id/public')
  @ThonLabsOnly()
  @HasEnvAccess()
  async updatePublicKey(@Param('id') id: string) {
    const key = await this.environmentService.updatePublicKey(id);

    return key;
  }

  @Post('/')
  @ThonLabsOnly()
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
  @ThonLabsOnly()
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
  @ThonLabsOnly()
  @HasEnvAccess()
  @SchemaValidator(updateGeneralSettingsValidator)
  async updateGeneralSettings(@Param('id') id: string, @Body() payload) {
    const result = await this.environmentService.updateGeneralSettings(
      id,
      payload,
    );

    if (result?.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }

  @Delete('/:id')
  @ThonLabsOnly()
  @HasEnvAccess()
  async delete(@Param('id') id: string) {
    await this.environmentService.delete(id);
  }
}
