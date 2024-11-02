import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { EmailTemplate, EmailTemplates } from '@prisma/client';
import emailTemplatesMapper from '@/auth/modules/emails/constants/email-templates';
import { DataReturn } from '@/utils/interfaces/data-return';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { unescape } from 'lodash';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import { getRootDomain } from '@/utils/services/domain';
import { JsonValue } from '@prisma/client/runtime/library';
import * as ejs from 'ejs';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor(
    private databaseService: DatabaseService,
    @Inject(forwardRef(() => EnvironmentService))
    private environmentService: EnvironmentService,
  ) {}

  async getByType(type: EmailTemplates, environmentId: string) {
    const emailTemplate = await this.databaseService.emailTemplate.findFirst({
      where: {
        type,
        environmentId,
      },
    });

    return emailTemplate;
  }

  async getById(id: string, environmentId: string) {
    const emailTemplate = await this.databaseService.emailTemplate.findUnique({
      where: {
        id,
        environmentId,
      },
      select: {
        id: true,
        type: true,
        name: true,
        subject: true,
        fromName: true,
        fromEmail: true,
        preview: true,
        replyTo: true,
        enabled: true,
        content: true,
        contentJSON: true,
        bodyStyles: true,
        updatedAt: true,
        environmentId: true,
      },
    });

    return emailTemplate;
  }

  async createDefaultTemplates(environmentId: string): Promise<DataReturn> {
    try {
      await this.databaseService.emailTemplate.deleteMany({
        where: { environmentId },
      });
      this.logger.log(`Deleted all templates for env: ${environmentId}`);

      const environment =
        await this.environmentService.getDetailedById(environmentId);

      const emailDomain = getRootDomain(new URL(environment.appURL).hostname);

      for (const [type, data] of Object.entries(emailTemplatesMapper)) {
        const content = unescape(data.content);

        await this.databaseService.emailTemplate.create({
          data: {
            type: type as EmailTemplates,
            content,
            contentJSON: data.contentJSON,
            bodyStyles: data.bodyStyles,
            name: data.name,
            subject: data.subject,
            fromEmail: `${data.fromEmail}@${emailDomain}`,
            fromName: `${environment.project.appName} Team`,
            preview: data.preview,
            replyTo: data.replyTo,
            environmentId,
          },
        });

        this.logger.log(`Email template ${type} created`);
      }

      this.logger.log(`Email templates created for env: ${environmentId}`);
    } catch (e) {
      this.logger.log('Error on creating email templates', e);
      return {
        error: ErrorMessages.InternalError,
        statusCode: StatusCodes.Internal,
      };
    }
  }

  async updateTemplate(
    id: string,
    environmentId: string,
    payload: {
      subject: string;
      fromName: string;
      fromEmail: string;
      content: string;
      preview?: string;
      replyTo: string;
      contentJSON: JsonValue;
      bodyStyles: JsonValue;
    },
  ): Promise<DataReturn<EmailTemplate>> {
    const emailTemplateCount = await this.databaseService.emailTemplate.count({
      where: {
        id,
        environmentId,
      },
    });

    if (!emailTemplateCount) {
      this.logger.error(`Email template ${id} not found`);
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.EmailTemplateNotFound,
      };
    }

    const content = unescape(payload.content);

    try {
      const emailData = {
        token: 'test-token',
        environment: {
          id: 'test-env-id',
          name: 'test-env-name',
          appURL: 'https://test.thonlabs.com',
          project: {
            id: 'test-project-id',
            appName: 'test-app-name',
          },
        },
        user: {
          id: 'test-user-id',
          firstName: 'test-user-first-name',
          fullName: 'test-user-full-name',
          email: 'test-user-email',
          lastSignIn: new Date(),
          emailConfirmed: true,
          profilePicture: 'test-user-profile-picture',
        },
        inviter: {
          fullName: 'test-inviter-full-name',
          email: 'test-inviter-email',
        },
      };

      ejs.render(payload.fromName, emailData);
      ejs.render(payload.subject, emailData);
      ejs.render(content, {
        ...emailData,
        preview: ejs.render(payload.preview, emailData),
      });
    } catch (e) {
      this.logger.error(`Error on rendering email template ${id}`, e);
      return {
        statusCode: StatusCodes.BadRequest,
        error: ErrorMessages.InvalidEmailTemplateEJS,
      };
    }

    const updatedEmailTemplate =
      await this.databaseService.emailTemplate.update({
        where: {
          id,
          environmentId,
        },
        data: {
          subject: payload.subject,
          fromName: payload.fromName,
          fromEmail: payload.fromEmail,
          content,
          contentJSON: payload.contentJSON,
          bodyStyles: payload.bodyStyles,
          preview: payload.preview,
          replyTo: payload.replyTo,
        },
      });

    this.logger.log(`Email template ${id} updated`);

    return {
      data: updatedEmailTemplate,
    };
  }

  async updateEnabledStatus(
    id: string,
    environmentId: string,
    enabled: boolean,
  ) {
    const emailTemplate = await this.databaseService.emailTemplate.findUnique({
      where: {
        id,
        environmentId,
      },
      select: {
        type: true,
      },
    });

    if (!emailTemplate) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.EmailTemplateNotFound,
      };
    }

    const requiredEnabledTypes: EmailTemplates[] = [
      EmailTemplates.ConfirmEmail,
      EmailTemplates.ForgotPassword,
      EmailTemplates.Invite,
      EmailTemplates.MagicLink,
    ];

    if (requiredEnabledTypes.includes(emailTemplate.type)) {
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: ErrorMessages.EmailTemplateRequiredEnabled,
      };
    }

    const updatedEmailTemplate =
      await this.databaseService.emailTemplate.update({
        where: {
          id,
          environmentId,
        },
        data: {
          enabled,
        },
        select: {
          id: true,
          enabled: true,
          name: true,
          type: true,
        },
      });

    this.logger.log(`Email template ${id} status updated`);

    return { data: updatedEmailTemplate };
  }

  async fetch(environmentId: string) {
    const templates = await this.databaseService.emailTemplate.findMany({
      where: {
        environmentId,
      },
      select: {
        id: true,
        type: true,
        name: true,
        enabled: true,
        updatedAt: true,
        environmentId: true,
      },
    });

    return { data: { items: templates } };
  }

  async isEnabled(type: EmailTemplates, environmentId: string) {
    const emailTemplate = await this.databaseService.emailTemplate.findFirst({
      where: {
        type,
        environmentId,
      },
      select: {
        enabled: true,
      },
    });

    return {
      data: emailTemplate?.enabled,
    };
  }
}
