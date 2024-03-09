import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { DataReturn } from '@/utils/interfaces/data-return';
import {
  ErrorCodes,
  ErrorMessages,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import Crypt from '@/utils/services/crypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private databaseService: DatabaseService,
    private environmentsService: EnvironmentService,
  ) {}

  async getOurByEmail(email: string) {
    const data = await this.databaseService.user.findFirst({
      where: { email, thonLabsUser: true },
    });

    return data;
  }

  async getByEmail(email: string, environmentId: string) {
    const data = await this.databaseService.user.findFirst({
      where: { email, environmentId },
      include: {
        environment: true,
      },
    });

    return data;
  }

  async getById(id: string) {
    const data = await this.databaseService.user.findFirst({
      where: { id },
    });

    return data;
  }

  async getDetailedById(id: string) {
    const data = await this.databaseService.user.findFirst({
      where: { id },
      include: {
        environment: true,
        role: true,
        userSubscriptions: true,
        projects: true,
      },
    });

    return data;
  }

  async createOwner(payload: { password: string }): Promise<DataReturn<User>> {
    const owner = await this.getOurByEmail('guscsales@gmail.com');

    if (owner) {
      this.logger.warn('Owner already exists');
      return { data: owner };
    }

    const password = await Crypt.hash(payload.password);

    const user = await this.databaseService.user.create({
      data: {
        email: 'guscsales@gmail.com',
        fullName: 'Gustavo Owner',
        password,
        thonLabsUser: true,
        emailConfirmed: true,
      },
    });

    this.logger.warn('Thon Labs owner user created', user.id);

    this.deletePrivateData(user);

    return { data: user };
  }

  async create(payload: {
    fullName: string;
    email: string;
    password?: string;
    environmentId: string;
  }): Promise<DataReturn<User>> {
    const environmentExists = await this.environmentsService.getById(
      payload.environmentId,
    );

    if (!environmentExists) {
      this.logger.warn(`Environment not found: ${payload.environmentId}`);
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.EnvironmentNotFound,
        code: ErrorCodes.ResourceNotFound,
      };
    }

    const emailExists = await this.getByEmail(
      payload.email,
      payload.environmentId,
    );

    if (emailExists) {
      return {
        statusCode: StatusCodes.Conflict,
        error: ErrorMessages.EmailInUse,
        code: ErrorCodes.EmailInUse,
      };
    }

    let password = null;
    if (payload.password) {
      password = await Crypt.hash(payload.password);
      this.logger.warn('Password has been hashed');
    }

    try {
      const user = await this.databaseService.user.create({
        data: {
          email: payload.email,
          fullName: payload.fullName,
          password,
          thonLabsUser: false,
          environmentId: payload.environmentId,
        },
      });

      this.logger.warn('User created', user.id);

      this.deletePrivateData(user);

      return { data: user };
    } catch (e) {
      this.logger.error('Error when creating user', e);

      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }
  }

  async setEnvironment(userId: string, environmentId: string) {
    await this.databaseService.user.update({
      where: { id: userId },
      data: {
        environmentId,
      },
    });
  }

  async updatePassword(
    userId: string,
    environmentId: string,
    password: string,
  ) {
    const hashPassword = await Crypt.hash(password);

    await this.databaseService.user.update({
      where: {
        id: userId,
        environmentId,
      },
      data: {
        password: hashPassword,
      },
    });

    this.logger.log(`Password updated for ${userId}`);
  }

  async updateEmailConfirmation(userId: string, environmentId: string) {
    await this.databaseService.user.update({
      where: {
        id: userId,
        environmentId,
      },
      data: {
        emailConfirmed: true,
      },
    });

    this.logger.log(`Email confirmed for ${userId}`);
  }

  async updateLastLogin(userId: string, environmentId: string) {
    await this.databaseService.user.update({
      where: {
        id: userId,
        environmentId,
      },
      data: {
        lastSignIn: new Date(),
      },
    });

    this.logger.log(`Last Login updated for ${userId}`);
  }

  async setAsThonLabsUser(userId: string) {
    await this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: {
        thonLabsUser: true,
      },
    });
  }

  async ownsEnvironment(userId: string, environmentId: string) {
    const count = await this.databaseService.user.count({
      where: {
        id: userId,
        projects: {
          some: {
            environments: {
              some: {
                id: environmentId,
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  async ownsProject(userId: string, projectId: string) {
    const count = await this.databaseService.user.count({
      where: {
        id: userId,
        projects: {
          some: {
            id: projectId,
          },
        },
      },
    });

    return count > 0;
  }

  private deletePrivateData(user: User) {
    delete user.password;
    delete user.thonLabsUser;
  }
}
