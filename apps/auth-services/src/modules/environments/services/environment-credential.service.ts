import { Injectable, Logger } from '@nestjs/common';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import { EnvironmentDataKeys } from '../constants/environment-data';
import { EnvironmentCredentials } from '@/auth/modules/environments/constants/environment-data';
import { SSOCreds, SSOSocialProvider } from '../../auth/interfaces/sso-creds';
import { ErrorMessages } from '@/utils/enums/errors-metadata';
import { DataReturn } from '@/utils/interfaces/data-return';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import { UpdateCredentialStatusPayload } from '../validators/environment-credential.validators';

@Injectable()
export class EnvironmentCredentialService {
  private readonly logger = new Logger(EnvironmentCredentialService.name);

  constructor(private environmentDataService: EnvironmentDataService) {}

  async getActiveSSOProviders(credentials: EnvironmentCredentials) {
    if (!credentials) {
      return [];
    }

    return Object.keys(credentials || {}).filter(
      (key) => credentials?.[key]?.active,
    );
  }

  async updateCredentialStatus(
    environmentId: string,
    provider: SSOSocialProvider,
    { active }: UpdateCredentialStatusPayload,
  ): Promise<DataReturn> {
    const data = await this.environmentDataService.get<EnvironmentCredentials>(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    if (!data?.data || data?.statusCode) {
      this.logger.warn(
        `Credentials not found for environment ${environmentId}`,
      );
      return {
        statusCode: data?.statusCode,
        error: data?.error,
      };
    }

    const credential = data?.data?.[provider] as SSOCreds;

    if (!credential) {
      this.logger.warn(
        `Credential for ${provider} not found for environment ${environmentId}`,
      );
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.SSOProviderNotFound,
      };
    }

    await this.environmentDataService.upsert(
      environmentId,
      {
        key: EnvironmentDataKeys.Credentials,
        value: {
          ...(data?.data || {}),
          [provider]: {
            ...credential,
            active,
          },
        },
      },
      true,
    );

    this.logger.log(
      `Updated credential ${provider} status to ${active} for environment ${environmentId}`,
    );
  }
}
