import { Injectable, Logger } from '@nestjs/common';
import { EmailTemplates, User } from '@prisma/client';
import { CreateEmailOptions, Resend } from 'resend';
import * as ejs from 'ejs';
import { EmailTemplateService } from './email-template.service';
import { render } from '@react-email/render';
import { ReactElement } from 'react';

export enum EmailInternalFromTypes {
  SUPPORT = 'support',
}

export const internalEmails = {
  [EmailInternalFromTypes.SUPPORT]: {
    from: 'ThonLabs Support Team <support@thonlabs.io>',
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

interface SendEmailParams {
  to: CreateEmailOptions['to'];
  emailTemplateType: EmailTemplates;
  environmentId: string;
  data?: {
    token?: string;
    appName?: string;
    appURL?: string;
    userFirstName?: string;
    inviter?: User;
    publicKey?: string;
  };
  scheduledAt?: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private resend: Resend;

  constructor(private emailTemplatesService: EmailTemplateService) {
    this.resend = new Resend(process.env.EMAIL_PROVIDER_API_KEY);
  }

  async send({
    to,
    environmentId,
    emailTemplateType,
    data,
    scheduledAt,
  }: SendEmailParams) {
    try {
      const emailTemplate = await this.emailTemplatesService.getByType(
        emailTemplateType,
        environmentId,
      );

      await this.resend.emails.send({
        from: `${emailTemplate.fromName} <${emailTemplate.fromEmail}>`,
        to,
        subject: ejs.render(emailTemplate.subject, data),
        html: ejs.render(emailTemplate.content, {
          ...data,
          preview: emailTemplate.preview,
        }),
        replyTo: emailTemplate.replyTo,
        scheduledAt: scheduledAt?.toISOString(),
      });

      this.logger.log(`Email ${emailTemplateType} sent`);
    } catch (e) {
      this.logger.error(
        `Error on sending email ${emailTemplateType} - Env: ${environmentId}`,
        e,
      );
    }
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

      await this.resend.emails.send({
        from: internalEmail.from,
        to,
        subject,
        html: render(content),
        scheduledAt: scheduledAt?.toISOString(),
      });

      this.logger.log(`Email "${subject}" sent (internal)`);
    } catch (e) {
      this.logger.error(`Error on sending email ${subject}`, e);
    }
  }
}
