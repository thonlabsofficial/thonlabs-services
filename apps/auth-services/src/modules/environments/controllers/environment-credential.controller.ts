import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import {
  ErrorMessages,
  exceptionsMapper,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { ThonLabsOnly } from '@/auth/modules/shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import { NeedsPublicKey } from '@/auth/modules/shared/decorators/needs-public-key.decorator';
import { PublicRoute } from '@/auth/modules/auth/decorators/auth.decorator';
import {
  EnvironmentCredentials,
  EnvironmentDataKeys,
} from '@/auth/modules/environments/constants/environment-data';
import {
  SSOCreds,
  SSOSocialProvider,
} from '@/auth/modules/auth/interfaces/sso-creds';
import {
  createEmailProviderCredentialValidator,
  createSSOCredentialValidator,
} from '@/auth/modules/environments/validators/environment-credential.validators';
import { EnvironmentCredentialService } from '@/auth/modules/environments/services/environment-credential.service';
import {
  ENVIRONMENT_EMAIL_PROVIDER_TYPES,
  ENVIRONMENT_SSO_CREDENTIAL_TYPES,
} from '@/auth/modules/environments/constants/environment-data';
import { EmailProviderType } from '@/auth/modules/emails/interfaces/email-template';

@Controller('environments/:envId/credentials')
export class EnvironmentCredentialController {
  private readonly logger = new Logger(EnvironmentCredentialController.name);

  constructor(
    private environmentDataService: EnvironmentDataService,
    private environmentCredentialService: EnvironmentCredentialService,
  ) {}

  /**
   * Get only PUBLIC credentials for SSO providers, like publicKey and redirectURI.
   * Pay attention on the data returned before commit anything new.
   * Requires environment id and public key.
   *
   * @param environmentId - The ID of the environment
   * @returns The credentials for the provider
   */
  @Get('/sso/public')
  @PublicRoute()
  @NeedsPublicKey()
  async getSSOCredentialsPublicData(@Param('envId') environmentId: string) {
    const data = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    const credentials = data?.data;

    if (!credentials || data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    const filteredCredentials = {};

    Object.keys(credentials)
      .filter(
        (key) =>
          Object.values(SSOSocialProvider).includes(key as SSOSocialProvider) &&
          (credentials[key] as SSOCreds).active,
      )
      .forEach((key) => {
        const credential = credentials[key] as SSOCreds;
        filteredCredentials[key] = {
          clientId: credential.clientId,
          redirectURI: credential.redirectURI,
        };
      });

    return filteredCredentials;
  }

  /**
   * Get all credentials for a specific provider.
   * Requires ThonLabs access and access token.
   *
   * @param environmentId - The ID of the environment
   * @param key - The key of the provider
   * @returns The credentials for the provider
   */
  @Get('/:key')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  async getCredential(
    @Param('envId') environmentId: string,
    @Param('key') key: keyof EnvironmentCredentials,
  ) {
    const data = await this.environmentCredentialService.get(
      environmentId,
      key,
    );

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data?.data;
  }

  @Post('/:key')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  async upsertCredential(
    @Param('envId') environmentId: string,
    @Param('key') key: keyof EnvironmentCredentials,
    @Body() payload: any,
  ) {
    const isSSOProvider = ENVIRONMENT_SSO_CREDENTIAL_TYPES.includes(
      key as SSOSocialProvider,
    );
    const isEmailProvider = ENVIRONMENT_EMAIL_PROVIDER_TYPES.includes(
      key as EmailProviderType,
    );

    let schemaResult = null;
    if (isSSOProvider) {
      schemaResult = createSSOCredentialValidator.safeParse(payload);
    } else if (isEmailProvider) {
      schemaResult = createEmailProviderCredentialValidator.safeParse(payload);
    }

    if (!schemaResult.success) {
      throw new exceptionsMapper[StatusCodes.BadRequest](schemaResult.error);
    }

    const data = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    /*
      Keep the existing credentials and add the new one.
    */
    await this.environmentDataService.upsert(
      environmentId,
      {
        key: EnvironmentDataKeys.Credentials,
        value: {
          ...(data?.data || {}),
          [key]: payload,
        },
      },
      true,
    );

    if (isSSOProvider) {
      await this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.ActiveSSOProviders,
        value: Array.from(new Set([...Object.keys(data?.data || {}), key])),
      });
    }

    this.logger.log(
      `Created credential ${key} for environment ${environmentId}`,
    );

    if (isSSOProvider) {
      return {
        activeSSOProviders:
          await this.environmentCredentialService.getActiveSSOProviders(
            data?.data,
          ),
      };
    }

    return {};
  }

  @Delete('/:key')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  async deleteCredential(
    @Param('envId') environmentId: string,
    @Param('key') key: string,
  ) {
    const data = await this.environmentDataService.get<EnvironmentCredentials>(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    if (!data?.data || data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    const credential = data?.data?.[key];

    if (!credential) {
      throw new exceptionsMapper[StatusCodes.NotFound](
        ErrorMessages.CredentialNotFound,
      );
    }

    delete data?.data?.[key];

    await this.environmentDataService.upsert(environmentId, {
      key: EnvironmentDataKeys.Credentials,
      value: data?.data,
    });

    const isSSOProvider = ENVIRONMENT_SSO_CREDENTIAL_TYPES.includes(
      key as SSOSocialProvider,
    );

    if (isSSOProvider) {
      await this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.ActiveSSOProviders,
        value: Object.keys(data?.data || {}),
      });
    }

    this.logger.log(
      `Deleted credential ${key} from environment ${environmentId}`,
    );

    if (isSSOProvider) {
      return {
        activeSSOProviders:
          await this.environmentCredentialService.getActiveSSOProviders(
            data?.data,
          ),
      };
    }

    return {};
  }
}
