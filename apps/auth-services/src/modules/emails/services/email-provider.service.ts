import { Injectable } from '@nestjs/common';
import { EnvironmentCredentialService } from '../../environments/services/environment-credential.service';
import { ENVIRONMENT_EMAIL_PROVIDER_TYPES } from '../constants/email-providers';

@Injectable()
export class EmailProviderService {
  constructor(
    private environmentCredentialService: EnvironmentCredentialService,
  ) {}

  async getActiveEmailProvider(environmentId: string) {
    const credentials =
      await this.environmentCredentialService.getAll(environmentId);

    if (!credentials) {
      return null;
    }

    const emailProviderKey = ENVIRONMENT_EMAIL_PROVIDER_TYPES.find(
      (key) => credentials?.[key]?.active,
    );

    if (!emailProviderKey) {
      return null;
    }

    return {
      provider: emailProviderKey,
      credentials: credentials?.[emailProviderKey],
    };
  }
}
