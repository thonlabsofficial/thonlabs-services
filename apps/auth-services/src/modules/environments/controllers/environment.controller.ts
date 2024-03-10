import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvironmentService } from '../services/environment.service';
import { EmailTemplateService } from '../../emails/services/email-template.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { StatusCodes, exceptionsMapper } from '@/utils/enums/errors-metadata';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import {
  createEnvironmentValidator,
  updateGeneralSettingsValidator,
  updateTokenSettingsValidator,
} from '../validators/environment-validators';
import decodeSession from '@/utils/services/decode-session';
import { UserOwnsEnv } from '../../shared/decorators/user-owns-env.decorator';

@Controller('environments')
export class EnvironmentController {
  constructor(
    private environmentService: EnvironmentService,
    private emailTemplateService: EmailTemplateService,
  ) {}

  @Get('/owner/my-keys')
  @ThonLabsOnly()
  public async signUpOwner(@Headers() headers) {
    if (headers['thon-labs-staff-api-key'] !== process.env.API_KEY) {
      throw new UnauthorizedException();
    }

    const environmentId = 'env-production-pv58lzlj6te';
    const [publicKey, secretKey] = await Promise.all([
      this.environmentService.getPublicKey(environmentId),
      this.environmentService.getSecretKey(environmentId),
    ]);

    return { publicKey, secretKey };
  }

  @Post('/:id/create-templates')
  @ThonLabsOnly()
  async createDefaultTemplates(
    @Param('id') environmentId: string,
    @Headers() headers,
  ) {
    if (headers['thon-labs-staff-api-key'] !== process.env.API_KEY) {
      throw new UnauthorizedException();
    }

    const result =
      await this.emailTemplateService.createDefaultTemplates(environmentId);

    if ((result as DataReturn)?.error) {
      throw new exceptionsMapper[(result as DataReturn).statusCode](
        (result as DataReturn).error,
      );
    }
  }

  @Get('/:id')
  @ThonLabsOnly()
  async getById(@Param('id') id: string, @Req() req) {
    // esse projeto pertence ao usuário do token?
    const { sub } = decodeSession(req);

    const result = await this.environmentService.belongsToUser(id, sub);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode]();
    }

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
  @UserOwnsEnv()
  async getSecretKey(@Param('id') id: string) {
    const secretKey = await this.environmentService.getSecretKey(id);

    return { secretKey };
  }

  @Patch('/:id/secret')
  @ThonLabsOnly()
  @UserOwnsEnv()
  async updateSecretKey(@Param('id') id: string) {
    const key = await this.environmentService.updateSecretKey(id);

    return { key };
  }

  @Patch('/:id/public')
  @ThonLabsOnly()
  @UserOwnsEnv()
  async updatePublicKey(@Param('id') id: string) {
    const key = await this.environmentService.updatePublicKey(id);

    return { key };
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

  @Patch('/:id/token-settings')
  @ThonLabsOnly()
  @UserOwnsEnv()
  @SchemaValidator(updateTokenSettingsValidator)
  async updateTokenSettings(@Param('id') id: string, @Body() payload) {
    const result = await this.environmentService.updateTokenSettings(
      id,
      payload,
    );

    if (result?.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }

  @Patch('/:id/general-settings')
  @ThonLabsOnly()
  @UserOwnsEnv()
  @SchemaValidator(updateGeneralSettingsValidator)
  async updateGeneralSettings(@Param('id') id: string, @Body() payload) {
    await this.environmentService.updateGeneralSettings(id, payload);
  }

  @Delete('/:id')
  @ThonLabsOnly()
  @UserOwnsEnv()
  async delete(@Param('id') id: string) {
    const result = await this.environmentService.delete(id);

    if (result?.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }
}
