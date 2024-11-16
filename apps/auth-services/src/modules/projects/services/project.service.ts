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

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private databaseService: DatabaseService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => EnvironmentService))
    private environmentsService: EnvironmentService,
  ) {}

  async getById(id: string): Promise<DataReturn<Project>> {
    const project = await this.databaseService.project.findUnique({
      where: { id },
    });

    return { data: project };
  }

  async getByIdAndOwnerId(
    id: string,
    userOwnerId: string,
  ): Promise<DataReturn<Project>> {
    const project = await this.databaseService.project.findFirst({
      where: { id, userOwnerId },
    });

    return { data: project };
  }

  async fetchByOwnerId(
    userOwnerId: string,
  ): Promise<DataReturn<Partial<Project>[]>> {
    const projects = await this.databaseService.project.findMany({
      where: { userOwnerId, active: true },
      select: {
        id: true,
        appName: true,
        environments: {
          where: {
            active: true,
          },
          select: {
            id: true,
            name: true,
            appURL: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return { data: projects };
  }

  async getByEnvironmentId(
    environmentId: string,
  ): Promise<DataReturn<Project>> {
    const project = await this.databaseService.project.findFirst({
      where: {
        environments: {
          some: {
            id: environmentId,
          },
        },
      },
    });

    return { data: project };
  }

  async create(payload: {
    appName: string;
    appURL: string;
    userId: string;
    main?: boolean;
  }): Promise<DataReturn<{ project: Project; environment: Environment }>> {
    const userExists = await this.userService.getById(payload.userId);

    if (!userExists) {
      this.logger.warn(`User not found: ${payload.userId}`);

      return {
        statusCode: StatusCodes.NotFound,
        code: ErrorCodes.ResourceNotFound,
        error: ErrorMessages.UserNotFound,
      };
    }

    const urlExists = await this.environmentsService.validateURL(
      payload.appURL,
      payload.userId,
    );

    if (urlExists?.error) {
      return urlExists;
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
        main: payload.main, // Only ThonLabs is main, no other project
      },
    });

    this.logger.warn(`Project created (${project.id})`);

    // Create a default environment
    const { data: environment } = await this.environmentsService.create({
      name: 'Production',
      projectId: project.id,
      appURL: payload.appURL,
    });

    return { data: { project, environment } };
  }

  async delete(id: string, userOwnerId: string): Promise<DataReturn> {
    try {
      const project = await this.databaseService.project.findUnique({
        where: { id },
        select: {
          id: true,
          main: true,
          environments: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!project) {
        return {
          statusCode: StatusCodes.NotFound,
          error: ErrorMessages.ProjectNotFound,
        };
      }

      if (project.main) {
        return {
          statusCode: StatusCodes.Forbidden,
          error: 'The ThonLabs is the main project and cannot be deleted',
        };
      }

      const { data: userIsOwner } = await this.getByIdAndOwnerId(
        id,
        userOwnerId,
      );

      if (!userIsOwner) {
        return {
          statusCode: StatusCodes.Forbidden,
          error: 'Only the owner user can delete this project',
        };
      }

      for (const environment of project.environments) {
        await this.environmentsService.delete(environment.id);
      }

      await this.databaseService.project.delete({
        where: { id, userOwnerId },
      });

      this.logger.log(`Project ${id} deleted with all relations`);
    } catch (e) {
      this.logger.error(`Error on delete Project ${id}`, e);
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }
  }

  async updateGeneralInfo(
    id: string,
    payload: {
      userOwnerId: string;
      appName: string;
    },
  ) {
    try {
      const { data: userIsOwner } = await this.getByIdAndOwnerId(
        id,
        payload.userOwnerId,
      );

      if (!userIsOwner) {
        return {
          statusCode: StatusCodes.Forbidden,
          error: 'Only the owner user can delete this project',
        };
      }

      const project = await this.databaseService.project.update({
        where: { id },
        data: {
          appName: prepareString(payload.appName),
        },
      });

      return {
        data: {
          id: project.id,
          appName: project.appName,
        },
      };
    } catch (e) {
      this.logger.error(`Error on update Project ${id}`, e);
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }
  }
}
