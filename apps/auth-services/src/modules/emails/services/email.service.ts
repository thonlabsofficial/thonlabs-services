import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { getFirstName } from '@/utils/services/names-helpers';
import { EmailProvider } from '@/auth/modules/emails/interfaces/email-template';
import EmailProviderResult from '@/emails/internals/email-domain-result';
import {
  SendInternalEmailPayload,
  sendInternalEmailValidator,
} from '@/auth/modules/emails/validators/email-validators';
import {
  INTERNAL_EMAILS,
  InternalEmailFrom,
} from '@/auth/modules/emails/constants/email';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private resend: Resend;

  constructor(private databaseService: DatabaseService) {
    this.resend = new Resend(process.env.EMAIL_PROVIDER_API_KEY);
  }

  async sendInternal(payload: SendInternalEmailPayload) {
    try {
      const { from, to, subject, content, scheduledAt, metadata } =
        sendInternalEmailValidator.parse(payload);

      const internalEmail = INTERNAL_EMAILS[from];

      if (!internalEmail) {
        this.logger.error(`Invalid internal email type "${from}"`);
        return;
      }

      const emailData: any = {
        tlAppURL: INTERNAL_EMAILS[from].url,
        ...metadata,
      };

      if (metadata?.userId) {
        const user = await this.databaseService.user.findUnique({
          where: { id: metadata.userId },
        });
        emailData.user = {
          ...user,
          firstName: getFirstName(user.fullName),
        };
      }

      const { error } = await this.resend.emails.send({
        from: internalEmail.from,
        to,
        subject,
        html: render(content(emailData)),
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
      this.logger.error(`Error on sending email ${payload.subject}`);
      this.logger.error(e);
      if (e instanceof Error) {
        this.logger.error(`Stack trace: ${e.stack}`);
      }
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
      from: InternalEmailFrom.Support,
      to: `${data.user.fullName} <${data.user.email}>`,
      subject: 'Email Domain Verification Result',
      content: EmailProviderResult({
        userFirstName: getFirstName(data.user.fullName),
        emailProvider,
        tlAppURL: INTERNAL_EMAILS[InternalEmailFrom.Support].url,
        environment: data.environment,
      }),
    });
  }
}
