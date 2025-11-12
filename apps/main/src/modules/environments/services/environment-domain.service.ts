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
import { EmailService } from '@/auth/modules/emails/services/email.service';
import {
  INTERNAL_EMAILS,
  InternalEmailFrom,
} from '@/auth/modules/emails/constants/email';
import { CustomDomainResult } from '@/emails/internals/custom-domain-result';
import { CustomDomainRemoved } from '@/emails/internals/custom-domain-removed';
import { getFirstName } from '@/utils/services/names-helpers';
import rand from '@/utils/services/rand';
import { getRootDomain } from '@/utils/services/domain';
import Crypt from '@/utils/services/crypt';

@Injectable()
export class EnvironmentDomainService {
  private readonly logger = new Logger(EnvironmentDomainService.name);
  private readonly customDomainVerificationCronTimeInHours = 5;

  constructor(
    private databaseService: DatabaseService,
    private cronService: CronService,
    private environmentService: EnvironmentService,
    private emailService: EmailService,
  ) {}

  async fetch({
    customDomainStatus,
  }: {
    customDomainStatus: CustomDomainStatus;
  }) {
    const domains = await this.databaseService.environment.findMany({
      where: {
        customDomain: { not: null },
        AND: {
          OR: [
            { customDomainStatus },
            { customDomainTXTStatus: customDomainStatus },
          ],
        },
      },
      select: {
        id: true,
        customDomain: true,
        customDomainTXT: true,
      },
    });

    for (const domain of domains) {
      if (domain.customDomainTXT) {
        domain.customDomainTXT = await Crypt.decrypt(
          domain.customDomainTXT,
          Crypt.generateIV(domain.id),
          process.env.ENCODE_SECRET,
        );
      }
    }

    return domains;
  }

  async getCustomDomain(environmentId: string) {
    const data = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
      select: {
        customDomainStatus: true,
        customDomain: true,
        customDomainStartValidationAt: true,
        customDomainLastValidationAt: true,
        customDomainTXT: true,
        customDomainTXTStatus: true,
      },
    });

    if (data.customDomainTXT) {
      data.customDomainTXT = await Crypt.decrypt(
        data.customDomainTXT,
        Crypt.generateIV(environmentId),
        process.env.ENCODE_SECRET,
      );
    }

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
      customDomainTXT: string;
      customDomainTXTStatus: CustomDomainStatus;
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

    const customDomainTXT = `c=${rand(3)}`;
    const encryptedCustomDomainTXT = await Crypt.encrypt(
      customDomainTXT,
      Crypt.generateIV(environmentId),
      process.env.ENCODE_SECRET,
    );

    await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        customDomain: this._normalizeDomain(customDomain),
        customDomainStartValidationAt: new Date(),
        customDomainStatus: CustomDomainStatus.Verifying,
        customDomainTXT: encryptedCustomDomainTXT,
        customDomainTXTStatus: CustomDomainStatus.Verifying,
      },
    });

    this.logger.log(
      `Updated custom domain for environment ${environmentId} to ${customDomain}`,
    );

    await this.validateCustomDomains([
      { id: environmentId, customDomain, customDomainTXT },
    ]);
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
        AND: {
          OR: [
            { customDomainStatus: CustomDomainStatus.Failed },
            { customDomainTXTStatus: CustomDomainStatus.Failed },
          ],
        },
      },
      select: {
        customDomain: true,
        customDomainStatus: true,
        customDomainTXT: true,
      },
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
        customDomainTXTStatus: CustomDomainStatus.Verifying,
      },
    });

    const customDomainTXT = await Crypt.decrypt(
      environment.customDomainTXT,
      Crypt.generateIV(environmentId),
      process.env.ENCODE_SECRET,
    );
    await this.validateCustomDomains([
      {
        id: environmentId,
        customDomain: environment.customDomain,
        customDomainTXT,
      },
    ]);
    this.cronService.startJob(CronJobs.VerifyNewCustomDomains);

    const data = await this.getCustomDomain(environmentId);
    return { data };
  }

  async excludeCustomDomain(environmentId: string) {
    const environmentHasCustomDomain =
      await this.databaseService.environment.count({
        where: {
          id: environmentId,
          customDomain: {
            not: null,
          },
        },
      });

    if (!environmentHasCustomDomain) {
      return {
        statusCode: StatusCodes.NotFound,
        error: 'No custom domain found for this environment',
      };
    }

    const { customDomain, customDomainStatus, customDomainTXTStatus } =
      await this.databaseService.environment.findUnique({
        where: { id: environmentId },
        select: {
          customDomain: true,
          customDomainStatus: true,
          customDomainTXTStatus: true,
        },
      });

    await this.databaseService.environment.update({
      where: { id: environmentId },
      data: {
        customDomain: null,
        customDomainStartValidationAt: null,
        customDomainLastValidationAt: null,
        customDomainStatus: null,
        customDomainTXT: null,
        customDomainTXTStatus: null,
      },
    });

    if (
      customDomainStatus === CustomDomainStatus.Verified &&
      customDomainTXTStatus === CustomDomainStatus.Verified
    ) {
      const removedAt = new Date();
      const environment = await this.databaseService.environment.findUnique({
        where: { id: environmentId },
        select: {
          id: true,
          name: true,
          project: {
            select: {
              id: true,
              appName: true,
              userOwner: true,
            },
          },
        },
      });
      this.emailService.sendInternal({
        from: InternalEmailFrom.Support,
        to: `${environment.project.userOwner.fullName} <${environment.project.userOwner.email}>`,
        subject: 'Custom Domain Removed',
        content: CustomDomainRemoved({
          environment: { ...environment, customDomain },
          project: environment.project,
          removedAt,
          userFirstName: getFirstName(environment.project.userOwner.fullName),
          tlAppURL: INTERNAL_EMAILS[InternalEmailFrom.Support].url,
        }),
      });
    }

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
      },
    });

    this.logger.log(
      `Updated custom domain CNAME status for environment ${environmentId} to ${status}`,
    );
  }

  async updateCustomDomainTXTStatus(
    environmentId: string,
    status: CustomDomainStatus,
  ) {
    await this.databaseService.environment.update({
      where: { id: environmentId },
      data: {
        customDomainTXTStatus: status,
      },
    });

    this.logger.log(
      `Updated custom domain TXT status for environment ${environmentId} to ${status}`,
    );
  }

  async customDomainFullyVerified(customDomain: string, environmentId: string) {
    const customDomainFullyVerified =
      await this.databaseService.environment.count({
        where: {
          id: environmentId,
          customDomain,
          customDomainStatus: CustomDomainStatus.Verified,
          customDomainTXTStatus: CustomDomainStatus.Verified,
        },
      });

    return customDomainFullyVerified > 0;
  }

  async updateCustomDomainLastValidationAt(environmentId: string) {
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
      select: { customDomain: true, customDomainTXT: true },
    });

    if (!environment?.customDomain) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.NoCustomDomainFound,
      };
    }

    const customDomainTXT = await Crypt.decrypt(
      environment.customDomainTXT,
      Crypt.generateIV(environmentId),
      process.env.ENCODE_SECRET,
    );
    await this.validateCustomDomains([
      {
        id: environmentId,
        customDomain: environment.customDomain,
        customDomainTXT,
      },
    ]);

    const data = await this.getCustomDomain(environmentId);
    return { data };
  }

  async validateCustomDomains(
    domainsToVerify: {
      id: string;
      customDomain: string;
      customDomainTXT: string;
    }[],
    sendEmail = true,
  ) {
    if (domainsToVerify.length === 0) {
      this.logger.log('No domains to validate');
      return;
    }

    this.logger.log(`Validating ${domainsToVerify.length} domains`);

    for (const domain of domainsToVerify) {
      const environmentId = domain.id;
      const appDomain = `${getEnvIdHash(environmentId)}.auth.${new URL(process.env.APP_ROOT_URL).hostname}`;

      const { customDomainStatus, customDomainTXTStatus } =
        await this.databaseService.environment.findUnique({
          where: { id: environmentId },
          select: {
            customDomainStatus: true,
            customDomainTXTStatus: true,
          },
        });

      try {
        const cname = await dns.resolveCname(domain.customDomain);
        if (
          customDomainStatus === CustomDomainStatus.Verifying &&
          cname.includes(appDomain)
        ) {
          await this.updateCustomDomainStatus(
            environmentId,
            CustomDomainStatus.Verified,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Custom domain verification CNAME failed (ENV: ${environmentId}) - Details: ${error.message}`,
        );

        if (customDomainStatus === CustomDomainStatus.Verified) {
          this.logger.log(`Custom domain was verified, reverting to verifying`);
          await this.updateCustomDomainStatus(
            environmentId,
            CustomDomainStatus.Verifying,
          );
        }
      }

      try {
        const txt = await dns.resolveTxt(
          `_tl_verify.${getRootDomain(domain.customDomain)}`,
        );

        if (
          customDomainTXTStatus === CustomDomainStatus.Verifying &&
          txt.some((record) => record.includes(domain.customDomainTXT))
        ) {
          await this.updateCustomDomainTXTStatus(
            environmentId,
            CustomDomainStatus.Verified,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Custom domain verification TXT failed (ENV: ${environmentId}) - Details: ${error.message}`,
        );

        if (customDomainTXTStatus === CustomDomainStatus.Verified) {
          this.logger.log(
            `Custom domain TXT was verified, reverting to verifying`,
          );
          await this.updateCustomDomainTXTStatus(
            environmentId,
            CustomDomainStatus.Verifying,
          );
        }
      }

      const customDomainFullyVerified = await this.customDomainFullyVerified(
        domain.customDomain,
        environmentId,
      );

      if (customDomainFullyVerified && sendEmail) {
        const environment = await this.databaseService.environment.findUnique({
          where: { id: environmentId },
          select: {
            id: true,
            name: true,
            customDomain: true,
            customDomainLastValidationAt: true,
            customDomainStartValidationAt: true,
            project: {
              select: {
                id: true,
                appName: true,
                userOwner: true,
              },
            },
          },
        });

        this.emailService.sendInternal({
          from: InternalEmailFrom.Support,
          to: `${environment.project.userOwner.fullName} <${environment.project.userOwner.email}>`,
          subject: 'Custom Domain Successfully Verified',
          content: CustomDomainResult({
            environment: {
              ...environment,
              customDomainStatus: CustomDomainStatus.Verified,
            },
            project: environment.project,
            userFirstName: getFirstName(environment.project.userOwner.fullName),
          }),
        });
      } else {
        const {
          customDomainStatus,
          customDomainTXTStatus,
          customDomainLastValidationAt,
          customDomainStartValidationAt,
        } = await this.databaseService.environment.findUnique({
          where: { id: environmentId },
          select: {
            customDomainStatus: true,
            customDomainTXTStatus: true,
            customDomainStartValidationAt: true,
            customDomainLastValidationAt: true,
          },
        });

        if (
          (customDomainStatus == CustomDomainStatus.Verifying ||
            customDomainTXTStatus == CustomDomainStatus.Verifying) &&
          differenceInHours(
            customDomainLastValidationAt,
            customDomainStartValidationAt,
          ) >= this.customDomainVerificationCronTimeInHours
        ) {
          if (customDomainStatus == CustomDomainStatus.Verifying) {
            await this.updateCustomDomainStatus(
              environmentId,
              CustomDomainStatus.Failed,
            );
          }

          if (customDomainTXTStatus == CustomDomainStatus.Verifying) {
            await this.updateCustomDomainTXTStatus(
              environmentId,
              CustomDomainStatus.Failed,
            );
          }

          this.logger.warn(
            `Custom domain verification failed for environment ${environmentId} after ${this.customDomainVerificationCronTimeInHours} hours`,
          );

          const environment = await this.databaseService.environment.findUnique(
            {
              where: { id: environmentId },
              select: {
                id: true,
                name: true,
                customDomain: true,
                customDomainLastValidationAt: true,
                customDomainStartValidationAt: true,
                project: {
                  select: {
                    id: true,
                    appName: true,
                    userOwner: true,
                  },
                },
              },
            },
          );

          this.emailService.sendInternal({
            from: InternalEmailFrom.Support,
            to: `${environment.project.userOwner.fullName} <${environment.project.userOwner.email}>`,
            subject: 'Custom Domain Verification Failed',
            content: CustomDomainResult({
              environment: {
                ...environment,
                customDomainStatus: CustomDomainStatus.Failed,
              },
              project: environment.project,
              userFirstName: getFirstName(
                environment.project.userOwner.fullName,
              ),
              tlAppURL: INTERNAL_EMAILS[InternalEmailFrom.Support].url,
            }),
          });

          return;
        }

        await this.updateCustomDomainLastValidationAt(environmentId);
      }
    }
  }

  private _normalizeDomain(domain: string) {
    return prepareString(domain).toLowerCase();
  }
}
