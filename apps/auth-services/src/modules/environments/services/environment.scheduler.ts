import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvironmentDomainService } from '@/auth/modules/environments/services/environment-domain.service';
import { CronJobs } from '@/auth/modules/shared/cron.service';

@Injectable()
export class EnvironmentScheduler {
  constructor(private environmentDomainService: EnvironmentDomainService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: CronJobs.CustomDomainVerification,
  })
  async customDomainVerificationCron() {
    await this.environmentDomainService.verifyAllCustomDomains();
  }
}
