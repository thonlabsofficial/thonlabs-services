import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { CustomDomainStatus } from '@prisma/client';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import { DataReturn } from '@/utils/interfaces/data-return';
import { differenceInHours } from 'date-fns/differenceInHours';
import { CronJobs, CronService } from '@/auth/modules/shared/cron.service';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import prepareString from '@/utils/services/prepare-string';

@Injectable()
export class EnvironmentDomainService {
  private readonly logger = new Logger(EnvironmentDomainService.name);
  private readonly customDomainVerificationCronTimeInHours = 5;

  constructor(
    private databaseService: DatabaseService,
    private cronService: CronService,
    private environmentService: EnvironmentService,
  ) {}

  async fetchCustomDomainsToVerify() {
    const environments = await this.databaseService.environment.findMany({
      where: {
        customDomain: { not: null },
        customDomainStatus: CustomDomainStatus.Verifying,
      },
      select: {
        id: true,
        customDomain: true,
      },
    });

    return environments;
  }

  async setCustomDomain(
    environmentId: string,
    customDomain: string,
  ): Promise<DataReturn<{ customDomainStatus: CustomDomainStatus }>> {
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

    const data = await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        customDomain: this._normalizeDomain(customDomain),
        customDomainStartValidationAt: new Date(),
        customDomainStatus: CustomDomainStatus.Verifying,
      },
      select: {
        customDomainStatus: true,
      },
    });

    this.logger.log(
      `Updated custom domain for environment ${environmentId} to ${customDomain}`,
    );

    this.cronService.startJob(CronJobs.CustomDomainVerification);

    return { data };
  }

  async verifyCustomDomain(
    environmentId: string,
  ): Promise<DataReturn<{ customDomainStatus: CustomDomainStatus }>> {
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

    const data = await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        customDomainStartValidationAt: new Date(),
        customDomainLastValidationAt: null,
        customDomainStatus: CustomDomainStatus.Verifying,
      },
      select: {
        customDomainStatus: true,
      },
    });

    this.cronService.startJob(CronJobs.CustomDomainVerification);

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

  private _normalizeDomain(domain: string) {
    return prepareString(domain).toLowerCase();
  }
}
