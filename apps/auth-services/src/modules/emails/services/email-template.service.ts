import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { EmailTemplate, EmailTemplates } from '@prisma/client';
import { render } from '@react-email/render';
import emailTemplatesMapper from '../mappers/email-templates-mapper';
import { DataReturn } from '@/utils/interfaces/data-return';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { unescape } from 'lodash';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor(private databaseService: DatabaseService) {}

  async getByType(type: EmailTemplates, environmentId: string) {
    const emailTemplate = await this.databaseService.emailTemplate.findFirst({
      where: {
        type,
        environmentId,
      },
    });

    return emailTemplate;
  }

  async createDefaultTemplates(projectId: string): Promise<DataReturn | void> {
    try {
      const { environments } = await this.databaseService.project.findUnique({
        where: { id: projectId },
        include: {
          environments: true,
        },
      });

      const emailTemplates: Partial<EmailTemplate>[] = [];

      for (const [type, data] of Object.entries(emailTemplatesMapper)) {
        for (const environemnt of environments) {
          emailTemplates.push({
            type: type as EmailTemplates,
            content: unescape(render(data.content, { pretty: true })),
            name: data.name,
            subject: data.subject,
            fromEmail: data.fromEmail,
            fromName: data.fromName,
            preview: data.preview,
            replyTo: data.replyTo,
            environmentId: environemnt.id,
          });
        }
      }

      await this.databaseService.emailTemplate.createMany({
        data: emailTemplates as EmailTemplate[],
      });

      this.logger.log('Email templates created for all environments');
    } catch (e) {
      this.logger.log('Error on creating email templates', e);
      return {
        error: ErrorMessages.InternalError,
        statusCode: StatusCodes.Internal,
      };
    }
  }
}
