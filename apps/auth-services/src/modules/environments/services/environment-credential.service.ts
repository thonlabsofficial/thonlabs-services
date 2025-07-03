import { Injectable, Logger } from '@nestjs/common';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import { EnvironmentDataKeys } from '../constants/environment-data';
import { EnvironmentCredentials } from '@/auth/modules/environments/constants/environment-data';
import { ErrorMessages } from '@/utils/enums/errors-metadata';
import { DataReturn } from '@/utils/interfaces/data-return';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import { UpdateCredentialStatusPayload } from '../validators/environment-credential.validators';

@Injectable()
export class EnvironmentCredentialService {
  private readonly logger = new Logger(EnvironmentCredentialService.name);

  constructor(private environmentDataService: EnvironmentDataService) {}

  async getAll(environmentId: string) {
    const data = await this.environmentDataService.get<EnvironmentCredentials>(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    if (!data?.data || data?.statusCode) {
      return null;
    }

    return data?.data;
  }

  async get<T = EnvironmentCredentials[keyof EnvironmentCredentials]>(
    environmentId: string,
    key: keyof EnvironmentCredentials,
  ): Promise<DataReturn<T>> {
    const data = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    if (!data?.data || data?.statusCode) {
      return {
        statusCode: data?.statusCode,
        error: data?.error,
      };
    }

    const credential = data?.data?.[key];

    if (!credential) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.CredentialNotFound,
      };
    }

    return { data: credential };
  }

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
    provider: string,
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

    const credential = data?.data?.[provider];

    if (!credential) {
      this.logger.warn(
        `Credential for ${provider} not found for environment ${environmentId}`,
      );
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.CredentialNotFound,
      };
    }

    await this.environmentDataService.upsert(
      environmentId,
      {
        key: EnvironmentDataKeys.Credentials,
        value: {
          ...(data?.data || {}),
          [provider]: { ...credential, active },
        },
      },
      true,
    );

    this.logger.log(
      `Updated credential ${provider} status to ${active} for environment ${environmentId}`,
    );
  }

  async update(
    environmentId: string,
    provider: string,
    payload: any,
  ): Promise<DataReturn<EnvironmentCredentials>> {
    const data = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.Credentials,
    );

    /*
      Keep the existing credentials and add the new one.
    */
    const value = {
      ...(data?.data || {}),
      [provider]: payload,
    } as EnvironmentCredentials;

    await this.environmentDataService.upsert(
      environmentId,
      {
        key: EnvironmentDataKeys.Credentials,
        value,
      },
      true,
    );

    this.logger.log(
      `Created credential ${provider} for environment ${environmentId}`,
    );

    return {
      data: value,
    };
  }
}
