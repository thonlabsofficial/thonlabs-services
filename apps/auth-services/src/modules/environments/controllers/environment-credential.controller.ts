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
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import {
  CreateCredentialPayload,
  createCredentialValidator,
} from '@/auth/modules/environments/validators/environment-credential.validators';
import { EnvironmentCredentialService } from '@/auth/modules/environments/services/environment-credential.service';

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
    @Param('key') key: string,
  ) {
    const data = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    if (!data?.data || data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data?.data?.[key] as SSOCreds;
  }

  @Post('/:key')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  @SchemaValidator(createCredentialValidator)
  async upsertCredential(
    @Param('envId') environmentId: string,
    @Param('key') key: string,
    @Body() payload: CreateCredentialPayload,
  ) {
    const data = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    /*
      Keep the existing credentials and add the new one.
    */
    await Promise.all([
      this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.Credentials,
        value: {
          ...(data?.data || {}),
          [key]: {
            clientId: payload.clientId,
            secretKey: payload.secretKey,
            redirectURI: payload.redirectURI,
            active: true,
          },
        },
      }),
      this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.ActiveSSOProviders,
        value: Array.from(new Set([...Object.keys(data?.data || {}), key])),
      }),
    ]);

    this.logger.log(
      `Created credential ${key} for environment ${environmentId}`,
    );

    return {
      activeSSOProviders:
        await this.environmentCredentialService.getActiveSSOProviders(
          data?.data,
        ),
    };
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

    const credential = data?.data?.[key] as SSOCreds;

    if (!credential) {
      throw new exceptionsMapper[StatusCodes.NotFound](
        ErrorMessages.SSOProviderNotFound,
      );
    }

    delete data?.data?.[key];

    await Promise.all([
      this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.Credentials,
        value: data?.data,
      }),
      this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.ActiveSSOProviders,
        value: Object.keys(data?.data || {}),
      }),
    ]);

    this.logger.log(
      `Deleted credential ${key} from environment ${environmentId}`,
    );

    return {
      activeSSOProviders:
        await this.environmentCredentialService.getActiveSSOProviders(
          data?.data,
        ),
    };
  }
}
