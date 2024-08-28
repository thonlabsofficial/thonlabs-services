import dns from 'dns/promises';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvironmentDomainService } from '@/auth/modules/environments/services/environment-domain.service';
import { CustomDomainStatus } from '@prisma/client';
import { CronJobs, CronService } from '@/auth/modules/shared/cron.service';
import getEnvIdHash from '@/utils/services/get-env-id-hash';

@Injectable()
export class EnvironmentScheduler {
  private readonly logger = new Logger(EnvironmentScheduler.name);

  constructor(
    private cronService: CronService,
    private environmentDomainService: EnvironmentDomainService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: CronJobs.CustomDomainVerification,
  })
  async customDomainVerificationCron() {
    const domainsToVerify =
      await this.environmentDomainService.fetchCustomDomainsToVerify();

    if (domainsToVerify.length === 0) {
      this.logger.log('No domains to verify, stopping job...');
      this.cronService.stopJob(CronJobs.CustomDomainVerification);
      return;
    }

    this.logger.log(`Found ${domainsToVerify.length} domains to verify`);

    for (const domain of domainsToVerify) {
      const environmentId = domain.id;

      try {
        const appDomain = `${getEnvIdHash(environmentId)}.auth.${new URL(process.env.APP_ROOT_URL).hostname}`;

        this.logger.log(
          `Checking DNS for domain ${domain.customDomain} -> CNAME -> ${appDomain} (ENV: ${environmentId})`,
        );

        const checkDNS = await dns.resolveCname(domain.customDomain);
        if (checkDNS.includes(appDomain)) {
          await this.environmentDomainService.updateCustomDomainStatus(
            environmentId,
            CustomDomainStatus.Verified,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Custom domain verification failed (ENV: ${environmentId}) - Details: ${error.message}`,
        );
        await this.environmentDomainService.updateCustomDomainLastValidationAt(
          environmentId,
        );
      }
    }
  }
}
