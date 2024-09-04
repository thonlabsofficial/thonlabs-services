import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { CustomDomainStatus } from '@prisma/client';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { DataReturn } from '@/utils/interfaces/data-return';
import { differenceInHours } from 'date-fns/differenceInHours';
import { CronJobs, CronService } from '@/auth/modules/shared/cron.service';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import prepareString from '@/utils/services/prepare-string';
import dns from 'dns/promises';
import getEnvIdHash from '@/utils/services/get-env-id-hash';

@Injectable()
export class EnvironmentDomainService {
  private readonly logger = new Logger(EnvironmentDomainService.name);
  private readonly customDomainVerificationCronTimeInHours = 5;

  constructor(
    private databaseService: DatabaseService,
    private cronService: CronService,
    private environmentService: EnvironmentService,
  ) {}

  async fetch({
    customDomainStatus,
  }: {
    customDomainStatus: CustomDomainStatus;
  }) {
    const environments = await this.databaseService.environment.findMany({
      where: {
        customDomain: { not: null },
        customDomainStatus,
      },
      select: {
        id: true,
        customDomain: true,
      },
    });

    return environments;
  }

  async getCustomDomain(environmentId: string) {
    const data = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
      select: {
        customDomainStatus: true,
        customDomain: true,
        customDomainStartValidationAt: true,
        customDomainLastValidationAt: true,
      },
    });

    return data;
  }

  async getByCustomDomainAndEnvironmentId(
    customDomain: string,
    environmentId: string,
  ) {
    const data = await this.databaseService.environment.findUnique({
      where: {
        id: environmentId,
        customDomain,
        customDomainStatus: CustomDomainStatus.Verified,
      },
      select: { customDomainStatus: true, customDomain: true },
    });

    return data;
  }

  async setCustomDomain(
    environmentId: string,
    customDomain: string,
  ): Promise<
    DataReturn<{
      customDomain: string;
      customDomainStatus: CustomDomainStatus;
      customDomainStartValidationAt: Date;
      customDomainLastValidationAt: Date;
    }>
  > {
    const environment =
      await this.environmentService.getDetailedById(environmentId);

    if (environment?.customDomain) {
      return {
        statusCode: StatusCodes.Conflict,
        error: `Custom domain is already set, please remove it before set another one`,
      };
    }

    const existingEnvironment =
      await this.databaseService.environment.findFirst({
        where: {
          customDomain: customDomain.toLowerCase(),
          NOT: {
            id: environmentId,
          },
          project: {
            environments: {
              some: {
                id: environmentId,
              },
            },
          },
        },
      });

    if (existingEnvironment) {
      this.logger.warn(
        `Custom domain already in use: ${customDomain} (ENV: ${existingEnvironment.name} ${existingEnvironment.id})`,
      );

      return {
        statusCode: StatusCodes.Conflict,
        error: `Custom domain is already in use by another environment in this project`,
      };
    }

    await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        customDomain: this._normalizeDomain(customDomain),
        customDomainStartValidationAt: new Date(),
        customDomainStatus: CustomDomainStatus.Verifying,
      },
    });

    this.logger.log(
      `Updated custom domain for environment ${environmentId} to ${customDomain}`,
    );

    await this.verifyCustomDomains([{ id: environmentId, customDomain }]);
    this.cronService.startJob(CronJobs.VerifyNewCustomDomains);

    const data = await this.getCustomDomain(environmentId);
    return { data };
  }

  async verifyCustomDomain(environmentId: string): Promise<
    DataReturn<{
      customDomain: string;
      customDomainStatus: CustomDomainStatus;
      customDomainStartValidationAt: Date;
      customDomainLastValidationAt: Date;
    }>
  > {
    const environment = await this.databaseService.environment.findUnique({
      where: {
        id: environmentId,
        customDomainStatus: CustomDomainStatus.Failed,
      },
      select: { customDomain: true, customDomainStatus: true },
    });

    if (!environment?.customDomain) {
      return {
        statusCode: StatusCodes.NotFound,
        error: 'No custom domain available for verification',
      };
    }

    await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        customDomainStartValidationAt: new Date(),
        customDomainLastValidationAt: null,
        customDomainStatus: CustomDomainStatus.Verifying,
      },
    });

    await this.verifyCustomDomains([
      { id: environmentId, customDomain: environment.customDomain },
    ]);
    this.cronService.startJob(CronJobs.VerifyNewCustomDomains);

    const data = await this.getCustomDomain(environmentId);
    return { data };
  }

  async excludeCustomDomain(environmentId: string) {
    const environment = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
      select: { customDomain: true },
    });

    if (!environment?.customDomain) {
      return {
        statusCode: StatusCodes.NotFound,
        error: 'No custom domain found for this environment',
      };
    }

    await this.databaseService.environment.update({
      where: { id: environmentId },
      data: {
        customDomain: null,
        customDomainStartValidationAt: null,
        customDomainLastValidationAt: null,
        customDomainStatus: null,
      },
    });

    this.logger.log(`Removed custom domain for environment ${environmentId}`);
  }

  async updateCustomDomainStatus(
    environmentId: string,
    status: CustomDomainStatus,
  ) {
    await this.databaseService.environment.update({
      where: { id: environmentId },
      data: {
        customDomainStatus: status,
        customDomainLastValidationAt: new Date(),
      },
    });

    this.logger.log(
      `Updated custom domain status for environment ${environmentId} to ${status}`,
    );
  }

  async updateCustomDomainLastValidationAt(environmentId: string) {
    const data = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
      select: {
        customDomainStartValidationAt: true,
        customDomainLastValidationAt: true,
      },
    });

    if (
      differenceInHours(
        data.customDomainLastValidationAt,
        data.customDomainStartValidationAt,
      ) >= this.customDomainVerificationCronTimeInHours
    ) {
      await this.updateCustomDomainStatus(
        environmentId,
        CustomDomainStatus.Failed,
      );

      this.logger.warn(
        `Custom domain verification failed for environment ${environmentId} after ${this.customDomainVerificationCronTimeInHours} hours`,
      );

      return;
    }

    await this.databaseService.environment.update({
      where: { id: environmentId },
      data: {
        customDomainLastValidationAt: new Date(),
      },
    });
  }

  async reverifyCustomDomain(environmentId: string): Promise<
    DataReturn<{
      customDomain: string;
      customDomainStatus: CustomDomainStatus;
      customDomainStartValidationAt: Date;
      customDomainLastValidationAt: Date;
    }>
  > {
    const environment = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
      select: { customDomain: true },
    });

    if (!environment?.customDomain) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.NoCustomDomainFound,
      };
    }

    await this.verifyCustomDomains([
      { id: environmentId, customDomain: environment.customDomain },
    ]);

    const data = await this.getCustomDomain(environmentId);
    return { data };
  }

  async verifyCustomDomains(
    domainsToVerify: {
      id: string;
      customDomain: string;
    }[],
  ) {
    if (domainsToVerify.length === 0) {
      this.logger.log('No domains to verify');
      return;
    }

    this.logger.log(`Verifying ${domainsToVerify.length} domains`);

    for (const domain of domainsToVerify) {
      const environmentId = domain.id;

      try {
        const appDomain = `${getEnvIdHash(environmentId)}.auth.${new URL(process.env.APP_ROOT_URL).hostname}`;

        this.logger.log(
          `Checking DNS for domain ${domain.customDomain} -> CNAME -> ${appDomain} (ENV: ${environmentId})`,
        );

        const checkDNS = await dns.resolveCname(domain.customDomain);
        if (checkDNS.includes(appDomain)) {
          await this.updateCustomDomainStatus(
            environmentId,
            CustomDomainStatus.Verified,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Custom domain verification failed (ENV: ${environmentId}) - Details: ${error.message}`,
        );
        await this.updateCustomDomainLastValidationAt(environmentId);
      }
    }
  }

  private _normalizeDomain(domain: string) {
    return prepareString(domain).toLowerCase();
  }
}
