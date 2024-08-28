import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

export enum CronJobs {
  CustomDomainVerification = 'custom-domain-verification',
}

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private schedulerRegistry: SchedulerRegistry) {}

  startJob(name: CronJobs) {
    const job = this.schedulerRegistry.getCronJob(name);

    if (job.running) {
      this.logger.log(`Job ${name} is already running`);
      return;
    }

    job.start();
    this.logger.log(`Started cron job ${name}`);
  }

  stopJob(name: CronJobs) {
    const job = this.schedulerRegistry.getCronJob(name);
    job.stop();
    this.logger.log(`Stopped cron job ${name}`);
  }
}
