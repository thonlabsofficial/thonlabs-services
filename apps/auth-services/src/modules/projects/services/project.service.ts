import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import normalizeString from '@/utils/services/normalize-string';
import prepareString from '@/utils/services/prepare-string';
import rand from '@/utils/services/rand';
import { DataReturn } from '@/utils/interfaces/data-return';
import { Environment, Project } from '@prisma/client';
import { UserService } from '../../users/services/user.service';
import {
  ErrorCodes,
  ErrorMessages,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import { EmailTemplateService } from '../../emails/services/email-template.service';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private databaseService: DatabaseService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => EnvironmentService))
    private environmentsService: EnvironmentService,
    private emailTemplateService: EmailTemplateService,
  ) {}

  async getById(id: string): Promise<DataReturn<Project>> {
    const project = await this.databaseService.project.findUnique({
      where: { id },
    });

    return { data: project };
  }

  async create(payload: {
    appName: string;
    userId: string;
    isThonLabs?: boolean;
  }): Promise<DataReturn<{ project: Project; environment: Environment }>> {
    const userExists = await this.userService.getById(
      payload.userId,
      payload.isThonLabs,
    );

    if (!userExists) {
      this.logger.warn(`User not found: ${payload.userId}`);

      return {
        statusCode: StatusCodes.NotFound,
        code: ErrorCodes.ResourceNotFound,
        error: ErrorMessages.UserNotFound,
      };
    }

    const normalizedName = normalizeString(payload.appName);
    let id = normalizeString(`prj-${normalizedName}-${rand(1)}`);

    // Just to guarantee :)
    const { data: projectExists } = await this.getById(id);
    if (projectExists) {
      this.logger.warn('ID already exists, generating new one...');
      id = normalizeString(`prj-${normalizedName}-${rand(1)}`);
    }

    const project = await this.databaseService.project.create({
      data: {
        id,
        appName: prepareString(payload.appName),
        userOwnerId: payload.userId,
      },
    });

    this.logger.warn('Project created', project.id);

    // Create a default environment
    const { data: environment } = await this.environmentsService.create({
      name: 'Production',
      projectId: project.id,
    });

    // Create email templates for the environment above
    await this.emailTemplateService.createDefaultTemplates(project.id);

    return { data: { project, environment } };
  }
}
