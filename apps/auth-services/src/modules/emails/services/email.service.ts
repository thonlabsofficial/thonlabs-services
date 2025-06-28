import { Injectable, Logger } from '@nestjs/common';
import { CreateEmailOptions, Resend } from 'resend';
import { render } from '@react-email/render';
import { ReactElement } from 'react';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { getFirstName } from '@/utils/services/names-helpers';
import { EmailProvider } from '@/auth/modules/emails/interfaces/email-template';
import EmailProviderResult from '@/emails/internals/email-domain-result';

export enum EmailInternalFromTypes {
  SUPPORT = 'support',
  FOUNDER = 'founder',
}

export const internalEmails = {
  [EmailInternalFromTypes.SUPPORT]: {
    from: 'ThonLabs Support Team <support@thonlabs.io>',
    url: process.env.API_ROOT_URL,
  },
  [EmailInternalFromTypes.FOUNDER]: {
    from: 'Gus from ThonLabs <gus@thonlabs.io>',
    url: process.env.API_ROOT_URL,
  },
};

interface InternalSendEmailParams {
  from: EmailInternalFromTypes;
  to: CreateEmailOptions['to'];
  subject: CreateEmailOptions['subject'];
  content: ReactElement;
  scheduledAt?: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private resend: Resend;

  constructor(private databaseService: DatabaseService) {
    this.resend = new Resend(process.env.EMAIL_PROVIDER_API_KEY);
  }

  async sendInternal({
    from,
    to,
    subject,
    content,
    scheduledAt,
  }: InternalSendEmailParams) {
    try {
      const internalEmail = internalEmails[from];

      if (!internalEmail) {
        this.logger.error(`Invalid internal email type "${from}"`);
        return;
      }

      const { error } = await this.resend.emails.send({
        from: internalEmail.from,
        to,
        subject,
        html: render(content),
        scheduledAt: scheduledAt?.toISOString(),
      });

      if (error) {
        this.logger.error(
          `Error from partner on sending email`,
          JSON.stringify(error),
        );
      } else {
        this.logger.log(`Email "${subject}" sent (internal)`);
      }
    } catch (e) {
      this.logger.error(`Error on sending email ${subject}`, e);
    }
  }

  async sendEmailProviderStatusEmail(
    environmentId: string,
    emailProvider: EmailProvider,
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

    await this.sendInternal({
      from: EmailInternalFromTypes.SUPPORT,
      to: `${data.user.fullName} <${data.user.email}>`,
      subject: 'Email Domain Verification Result',
      content: EmailProviderResult({
        userFirstName: getFirstName(data.user.fullName),
        emailProvider,
        tlAppURL: internalEmails[EmailInternalFromTypes.SUPPORT].url,
        environment: data.environment,
      }),
    });
  }
}
