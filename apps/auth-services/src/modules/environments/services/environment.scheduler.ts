import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvironmentDomainService } from '@/auth/modules/environments/services/environment-domain.service';
import { CronJobs, CronService } from '@/auth/modules/shared/cron.service';
import { CustomDomainStatus } from '@prisma/client';

@Injectable()
export class EnvironmentScheduler {
  private readonly logger = new Logger(EnvironmentScheduler.name);

  constructor(
    private environmentDomainService: EnvironmentDomainService,
    private cronService: CronService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: CronJobs.VerifyNewCustomDomains,
  })
  async verifyNewCustomDomainsCron() {
    const domainsToVerify = await this.environmentDomainService.fetch({
      customDomainStatus: CustomDomainStatus.Verifying,
    });

    if (domainsToVerify.length === 0) {
      this.logger.log('No new custom domains to verify, stopping job...');
      this.cronService.stopJob(CronJobs.VerifyNewCustomDomains);
      return;
    }

    await this.environmentDomainService.validateCustomDomains(domainsToVerify);
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: CronJobs.VerifyCurrentCustomDomains,
  })
  async verifyCurrentCustomDomainsCron() {
    const domainsToVerify = await this.environmentDomainService.fetch({
      customDomainStatus: CustomDomainStatus.Verified,
    });

    if (domainsToVerify.length === 0) {
      this.logger.log('No current custom domains to verify, stopping job...');
      this.cronService.stopJob(CronJobs.VerifyCurrentCustomDomains);
      return;
    }

    await this.environmentDomainService.validateCustomDomains(
      domainsToVerify,
      false,
    );
  }
}
