import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { EmailTemplates, TokenTypes, User } from '@prisma/client';
import { DataReturn } from '@/utils/interfaces/data-return';
import {
  ErrorCodes,
  ErrorMessages,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import Crypt from '@/utils/services/crypt';
import rand from '@/utils/services/rand';
import prepareString from '@/utils/services/prepare-string';
import { getFirstName } from '@/utils/services/names-helpers';
import { EmailService } from '../../emails/services/email.service';
import { TokenStorageService } from '../../token-storage/services/token-storage.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private databaseService: DatabaseService,
    private environmentService: EnvironmentService,
    private tokenStorageService: TokenStorageService,
    private emailService: EmailService,
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

  async getByIdAndEnv(id: string, environmentId: string) {
    const data = await this.databaseService.user.findFirst({
      where: { id, environmentId },
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

    this.logger.warn(`ADMIN Thon Labs owner user created ${user.id}`);

    const iv = Crypt.generateIV(user.id);
    const authKey = await Crypt.encrypt(
      `${rand(8)}`,
      iv,
      process.env.ENCODE_AUTH_KEYS_SECRET,
    );
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { authKey },
    });

    this.logger.log(`User ${user.id} auth key created`);

    this.deletePrivateData(user);

    return { data: user };
  }

  async create(payload: {
    fullName: string;
    email: string;
    password?: string;
    environmentId: string;
  }): Promise<DataReturn<User>> {
    const environmentExists = await this.environmentService.getById(
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
      this.logger.log('Password has been hashed');
    }

    try {
      const user = await this.databaseService.user.create({
        data: {
          email: payload.email,
          fullName: prepareString(payload.fullName),
          password,
          thonLabsUser: false,
          environmentId: payload.environmentId,
        },
      });

      this.logger.log(`User ${user.id} created`);

      const iv = Crypt.generateIV(user.id);
      const authKey = await Crypt.encrypt(
        `${rand(8)}`,
        iv,
        process.env.ENCODE_AUTH_KEYS_SECRET,
      );
      await this.databaseService.user.update({
        where: { id: user.id },
        data: { authKey },
      });
      user.authKey = authKey;

      this.logger.log(`User ${user.id} auth key created`);

      const { data: environment } = await this.environmentService.getById(
        payload.environmentId,
      );

      if (environment.projectId.startsWith('prj-thon-labs-')) {
        await this.setAsThonLabsUser(user.id);
        user.thonLabsUser = true;
      }

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
    const isActiveUser = await this.isActiveUser(userId, environmentId);

    if (!isActiveUser) {
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: ErrorMessages.InvalidUser,
      };
    }

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
    const isActiveUser = await this.databaseService.user.findFirst({
      where: {
        id: userId,
        active: true,
        environmentId,
      },
    });

    if (!isActiveUser) {
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: ErrorMessages.InvalidUser,
      };
    }

    await this.databaseService.user.update({
      where: {
        id: userId,
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

  async updateGeneralData(
    userId: string,
    environmentId: string,
    payload: { fullName: string },
  ) {
    const user = await this.getByIdAndEnv(userId, environmentId);

    if (!user) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.UserNotFound,
      };
    }

    const updatedUser = await this.databaseService.user.update({
      where: {
        id: userId,
        environmentId,
      },
      data: {
        fullName: prepareString(payload.fullName),
      },
    });

    this.deletePrivateData(updatedUser, true);

    this.logger.log(`General data updated for ${userId}`);

    return updatedUser;
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

    this.logger.log(`User ${userId} updated as Thon Labs User`);
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

  async fetch(params: { environmentId: string }) {
    const users = await this.databaseService.user.findMany({
      select: {
        active: true,
        createdAt: true,
        email: true,
        fullName: true,
        id: true,
        lastSignIn: true,
        profilePicture: true,
        updatedAt: true,
        environmentId: true,
        emailConfirmed: true,
      },
      where: {
        environmentId: params.environmentId,
      },
    });

    return users;
  }

  async exclude(
    userId: string,
    environmentId: string,
  ): Promise<DataReturn<User>> {
    const userProjectsCount = await this.userProjectsCount(userId);

    if (userProjectsCount > 0) {
      return {
        statusCode: StatusCodes.Forbidden,
        error: 'User that has projects cannot be deleted',
      };
    }

    const user = await this.databaseService.user.delete({
      where: {
        id: userId,
        environmentId,
      },
    });

    this.logger.log(`User ${userId} has been deleted with all relations`);

    this.deletePrivateData(user, true);

    return { data: user };
  }

  async updateStatus(
    userId: string,
    environmentId: string,
    active: boolean,
  ): Promise<DataReturn<User>> {
    const user = await this.databaseService.user.update({
      where: {
        id: userId,
        environmentId,
      },
      data: {
        active,
      },
    });

    this.logger.log(
      `User ${userId} has been ${active ? 'activated' : 'deactivated'}`,
    );

    return { data: user };
  }

  async userProjectsCount(userId: string) {
    const userProjectsCount = await this.databaseService.project.count({
      where: {
        userOwnerId: userId,
      },
    });

    return userProjectsCount;
  }

  async isActiveUser(userId: string, environmentId: string) {
    const user = await this.databaseService.user.findFirst({
      where: {
        id: userId,
        environmentId,
      },
    });

    return user?.active || false;
  }

  async sendInvitation(
    fromUserId: string,
    toUserId: string,
    environmentId: string,
  ): Promise<DataReturn<User>> {
    const user = await this.getByIdAndEnv(toUserId, environmentId);

    if (!user?.active) {
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: ErrorMessages.UserIsNotActive,
      };
    }

    if (user?.emailConfirmed) {
      return {
        statusCode: StatusCodes.BadRequest,
        error: ErrorMessages.UserAlreadyAcceptedInvitation,
      };
    }

    const environment =
      await this.environmentService.getDetailedById(environmentId);

    const [inviter, { data: tokenData }] = await Promise.all([
      this.getById(fromUserId),
      this.tokenStorageService.create({
        type: TokenTypes.InviteUser,
        expiresIn: '5h',
        relationId: user.id,
        environmentId,
      }),
    ]);

    await this.emailService.send({
      userId: user.id,
      to: user.email,
      emailTemplateType: EmailTemplates.Invite,
      environmentId,
      data: {
        token: tokenData?.token,
        inviter,
      },
    });

    return {
      data: {
        id: user.id,
        fullName: user.fullName,
        environmentId: user.environmentId,
      } as User,
    };
  }

  private deletePrivateData(user: User, includeInternalData = false) {
    delete user.password;
    delete user.thonLabsUser;
    delete user.roleId;

    if (includeInternalData) {
      delete user.authKey;
    }
  }
}
