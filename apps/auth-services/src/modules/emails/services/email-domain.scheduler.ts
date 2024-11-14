import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronJobs } from '@/auth/modules/shared/cron.service';
import { EmailDomainService } from './email-domain.service';
import { EmailDomain, EmailDomainStatus } from '../interfaces/email-domain';
import {
  EmailService,
  EmailInternalFromTypes,
  internalEmails,
} from './email.service';
import { EmailDomainResult } from '@/emails/internals/email-domain-result';
import { getFirstName } from '@/utils/services/names-helpers';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class EmailDomainScheduler {
  private readonly logger = new Logger(EmailDomainScheduler.name);

  constructor(
    private emailDomainService: EmailDomainService,
    private emailService: EmailService,
    private databaseService: DatabaseService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: CronJobs.VerifyNewEmailDomains,
  })
  async verifyNewCustomDomainsCron() {
    const { data: domainsToVerify } = await this.emailDomainService.fetch(
      EmailDomainStatus.Verifying,
    );

    if (domainsToVerify.length === 0) {
      this.logger.log('No new email domains to verify');
      return;
    }

    const partnerDomains = await this.emailDomainService.listPartnerDomains();
    const partnerDomainsToVerify = domainsToVerify.filter((domain) =>
      partnerDomains.some(
        (pd) =>
          pd.id === domain.value.refId &&
          domain.value.status === EmailDomainStatus.Verifying,
      ),
    );

    this.logger.log(
      `Found ${partnerDomainsToVerify.length} partner domains to verify`,
    );

    for (const domain of partnerDomainsToVerify) {
      const [domainData] = await Promise.all([
        this.emailDomainService.getPartnerDomain(domain.value.refId),
        /* This is used to update the records status from the partner domain */
        this.emailDomainService.updateRecordsFromPartner(domain.environmentId),
      ]);

      let status: EmailDomainStatus = null;

      if (
        domainData.status === 'failed' ||
        domainData.status === 'temporary_failure'
      ) {
        status = EmailDomainStatus.Failed;
      } else if (domainData.status === 'verified') {
        status = EmailDomainStatus.Verified;
      }

      if (status) {
        await this.emailDomainService.updateStatus(
          domain.environmentId,
          status,
        );
        await this._sendEmailNotification(domain.environmentId, {
          ...domain.value,
          status,
        });

        this.logger.log(
          `Status changed to ${status} for email domain ${domain.value.domain} (RefID: ${domain.value.refId})`,
        );
      } else {
        this.logger.log(
          `No status change for email domain ${domain.value.domain} (RefID: ${domain.value.refId})`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: CronJobs.VerifyCurrentEmailDomains,
  })
  async verifyCurrentCustomDomainsCron() {
    const { data: domainsToVerify } = await this.emailDomainService.fetch(
      EmailDomainStatus.Verified,
    );

    if (domainsToVerify.length === 0) {
      this.logger.log('No current email domains to verify');
      return;
    }

    const partnerDomains = await this.emailDomainService.listPartnerDomains();
    const partnerDomainsToVerify = domainsToVerify.filter((domain) =>
      partnerDomains.some(
        (pd) =>
          pd.id === domain.value.refId &&
          domain.value.status === EmailDomainStatus.Verified,
      ),
    );

    this.logger.log(
      `Found ${partnerDomainsToVerify.length} verified partner domains to double check`,
    );

    for (const domain of partnerDomainsToVerify) {
      const domainData = await this.emailDomainService.getPartnerDomain(
        domain.value.refId,
      );

      let status: EmailDomainStatus = null;

      if (
        domainData.status === 'failed' ||
        domainData.status === 'temporary_failure'
      ) {
        status = EmailDomainStatus.Failed;
      } else if (domainData.status === 'pending') {
        status = EmailDomainStatus.Verifying;
      }

      if (status) {
        await this.emailDomainService.updateStatus(
          domain.environmentId,
          status,
        );

        if (status === EmailDomainStatus.Failed) {
          await this._sendEmailNotification(domain.environmentId, {
            ...domain.value,
            status,
          });
        }

        this.logger.log(
          `Status changed to ${status} for email domain ${domain.value.domain} (RefID: ${domain.value.refId})`,
        );
      }
    }
  }

  private async _sendEmailNotification(
    environmentId: string,
    emailDomain: EmailDomain,
  ) {
    const environment = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
      select: {
        id: true,
        name: true,
        appURL: true,
        projectId: true,
        project: {
          include: {
            userOwner: true,
          },
        },
      },
    });

    const data = {
      environment,
      user: environment.project.userOwner,
    };

    await this.emailService.sendInternal({
      from: EmailInternalFromTypes.SUPPORT,
      to: `${data.user.fullName} <${data.user.email}>`,
      subject: 'Email Domain Verification Result',
      content: EmailDomainResult({
        userFirstName: getFirstName(data.user.fullName),
        emailDomain,
        tlAppURL: internalEmails[EmailInternalFromTypes.SUPPORT].url,
        environment: data.environment,
      }),
    });
  }
}
