import { Controller, Get, Param, Patch, Req, Body } from '@nestjs/common';
import { EnvironmentCredentialService } from '@/auth/modules/environments/services/environment-credential.service';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import {
  ErrorMessages,
  exceptionsMapper,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { EmailProviderType } from '@/auth/modules/emails/interfaces/email-template';
import { ENVIRONMENT_EMAIL_PROVIDER_TYPES } from '../constants/email';

@Controller('email-providers')
export class EmailProviderController {
  constructor(private credentialsService: EnvironmentCredentialService) {}

  @Get('')
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async fetch(@Req() req) {
    const environmentId = req.headers['tl-env-id'];
    const creds = await this.credentialsService.getAll(environmentId);

    if (!creds) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.CredentialsNotFound,
      };
    }

    const emailProvidersData = {};

    Object.keys(creds)
      .filter((key) =>
        ENVIRONMENT_EMAIL_PROVIDER_TYPES.includes(key as EmailProviderType),
      )
      .forEach((key) => {
        emailProvidersData[key] = {
          active: creds[key].active,
        };
      });

    return emailProvidersData;
  }

  @Get('/:provider')
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async getProvider(
    @Req() req,
    @Param('provider') provider: EmailProviderType,
  ) {
    const environmentId = req.headers['tl-env-id'];
    const data = await this.credentialsService.get(environmentId, provider);

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data?.data;
  }

  @Patch('/:provider')
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async updateProvider(
    @Req() req,
    @Param('provider') provider: EmailProviderType,
    @Body() payload: any,
  ) {
    const data = await this.credentialsService.update(
      req.headers['tl-env-id'],
      provider,
      payload,
    );

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }
  }
}
