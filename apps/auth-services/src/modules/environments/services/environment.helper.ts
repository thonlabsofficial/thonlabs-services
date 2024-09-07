import { Injectable } from '@nestjs/common';
import { CustomDomainStatus } from '@prisma/client';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import getEnvIdHash from '@/utils/services/get-env-id-hash';

@Injectable()
export class EnvironmentHelper {
  constructor(private databaseService: DatabaseService) {}

  async getAuthURL(environmentId: string) {
    const environment = await this.databaseService.environment.findUnique({
      where: {
        id: environmentId,
        customDomain: { not: null },
        customDomainStatus: CustomDomainStatus.Verified,
      },
      select: {
        customDomain: true,
      },
    });

    let authDomain = environment?.customDomain;

    if (!authDomain) {
      authDomain = `${getEnvIdHash(environmentId)}.auth.${new URL(process.env.APP_ROOT_URL).hostname}`;
    }

    return `https://${authDomain}`;
  }
}
