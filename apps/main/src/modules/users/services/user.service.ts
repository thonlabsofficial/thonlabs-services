import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { EmailTemplates, Organization, TokenTypes, User } from '@prisma/client';
import { DataReturn } from '@/utils/interfaces/data-return';
import {
  ErrorCodes,
  ErrorMessages,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import Crypt from '@/utils/services/crypt';
import prepareString from '@/utils/services/prepare-string';
import { TokenStorageService } from '@/auth/modules/token-storage/services/token-storage.service';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import { OrganizationService } from '@/auth/modules/organizations/services/organization.service';
import { EnvironmentDataKeys } from '@/auth/modules/environments/constants/environment-data';
import { EmailTemplateService } from '@/auth/modules/emails/services/email-template.service';
import { UpdateUserGeneralDataPayload } from '../validators/user-validators';
import { UserDataService } from './user-data.service';
import { MetadataValueService } from '@/auth/modules/metadata/services/metadata-value.service';
import { getFirstName, getInitials } from '@/utils/services/names-helpers';
import { RedisService } from '@/auth/modules/shared/database/redis.service';
import { RedisKeys } from '@/auth/modules/shared/database/redis-keys';
import rand from '@/utils/services/rand';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private databaseService: DatabaseService,
    private environmentService: EnvironmentService,
    private tokenStorageService: TokenStorageService,
    private environmentDataService: EnvironmentDataService,
    private organizationService: OrganizationService,
    private emailTemplateService: EmailTemplateService,
    private userDataService: UserDataService,
    private metadataValueService: MetadataValueService,
    private redisService: RedisService,
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
        organization: true,
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
        invitedAt: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get user metadata
    const metadataResult = await this.metadataValueService.getMetadataByContext(
      [id],
      'User',
    );
    const metadata = metadataResult[id] || {};

    return {
      ...data,
      firstName: getFirstName(data.fullName),
      initials: getInitials(data.fullName),
      metadata,
    };
  }

  async getByIdAndEnv(id: string, environmentId: string) {
    const data = await this.databaseService.user.findFirst({
      where: { id, environmentId },
    });

    return data;
  }

  async createOwner(payload: { password: string }): Promise<DataReturn<User>> {
    const owner = await this.getOurByEmail('gus@thonlabs.io');

    if (owner) {
      this.logger.warn('Owner already exists');
      return { data: owner };
    }

    const password = await Crypt.hash(payload.password);

    const user = await this.databaseService.user.create({
      data: {
        email: 'gus@thonlabs.io',
        fullName: 'Gus Sales',
        password,
        thonLabsUser: true,
        emailConfirmed: true,
      },
    });

    this.logger.warn(`ADMIN Thon Labs owner user created ${user.id}`);

    this.deletePrivateData(user);

    return { data: user };
  }

  async create(payload: {
    fullName: string;
    email: string;
    password?: string;
    environmentId: string;
    invitedAt?: Date;
    organizationId?: string;
    metadata?: Record<string, any>;
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

    const { data: enableSignUpB2BOnly } = await this.environmentDataService.get(
      payload.environmentId,
      EnvironmentDataKeys.EnableSignUpB2BOnly,
    );
    if (enableSignUpB2BOnly) {
      const { data: organizationId } =
        await this.organizationService.isValidUserOrganization(
          payload.environmentId,
          payload.email,
        );

      if (!organizationId) {
        this.logger.error(
          `No organization domain found for email ${payload.email} in environment ${payload.environmentId}`,
        );
        return {
          statusCode: StatusCodes.NotAcceptable,
          error: ErrorMessages.InvalidEmail,
        };
      }

      payload.organizationId = organizationId;
    }

    if (payload.organizationId) {
      const { data: organization } = await this.organizationService.getById(
        payload.organizationId,
      );

      if (!organization) {
        this.logger.error(`Organization ${payload.organizationId} not found`);
        return {
          statusCode: StatusCodes.NotFound,
          error: ErrorMessages.OrganizationNotFound,
        };
      }

      if (!organization.active) {
        this.logger.error(`Organization ${organization.id} is not active`);
        return {
          statusCode: StatusCodes.NotAcceptable,
          error: ErrorMessages.OrganizationNotFound,
        };
      }
    }

    let password = null;
    if (payload.password) {
      password = await Crypt.hash(payload.password);
      this.logger.log('Password has been hashed');
    }

    try {
      const authKey = await Crypt.encrypt(
        `ak_${rand(5)}`,
        process.env.ENCODE_SECRET,
      );

      const user = await this.databaseService.user.create({
        data: {
          email: payload.email,
          fullName: prepareString(payload.fullName),
          password,
          thonLabsUser: false,
          environmentId: payload.environmentId,
          invitedAt: payload.invitedAt,
          organizationId: payload.organizationId,
          authKey,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`User ${user.id} created`);

      this.deletePrivateData(user);

      // Sets user as Thon Labs user if the project is main
      const environment = await this.environmentService.getDetailedById(
        payload.environmentId,
      );

      if (environment.project.main) {
        await this.setAsThonLabsUser(user.id);
        user.thonLabsUser = true;
      }

      let metadata = {};
      if (payload.metadata) {
        const { data: metadataData } =
          await this.metadataValueService.manageMetadata(
            user.id,
            'User',
            payload.metadata,
          );

        metadata = metadataData.metadata;
      }

      return {
        data: { ...user, metadata } as unknown as User & {
          metadata: Record<string, any>;
        },
      };
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

  async updateEmailConfirmation(
    userId: string,
    environmentId: string,
  ): Promise<DataReturn> {
    const isActiveUser = await this.databaseService.user.findFirst({
      where: {
        id: userId,
        active: true,
        environmentId,
      },
      include: {
        organization: true,
      },
    });

    if (!isActiveUser) {
      this.logger.error(`User ${userId} is not active`);
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: ErrorMessages.InvalidUser,
      };
    }

    if (isActiveUser?.organization && !isActiveUser?.organization?.active) {
      this.logger.error(
        `Organization ${isActiveUser?.organization?.id} is not active`,
      );
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
    payload: UpdateUserGeneralDataPayload,
  ) {
    const userExists = await this.getByIdAndEnv(userId, environmentId);

    if (!userExists) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.UserNotFound,
      };
    }

    if (payload.organizationId) {
      const { data: organization } = await this.organizationService.getById(
        payload.organizationId,
      );

      if (!organization) {
        return {
          statusCode: StatusCodes.NotFound,
          error: ErrorMessages.OrganizationNotFound,
        };
      }

      if (!organization.active) {
        this.logger.error(`Organization ${organization.id} is not active`);
        return {
          statusCode: StatusCodes.NotAcceptable,
          error: ErrorMessages.OrganizationInactive,
        };
      }
    }

    let user = {} as User & {
      organization: Organization;
      metadata: Record<string, any>;
    };

    const updatedUser = await this.databaseService.user.update({
      where: {
        id: userId,
        environmentId,
      },
      data: {
        fullName: prepareString(payload.fullName),
        organizationId: payload.organizationId || null,
      },
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
        invitedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.deletePrivateData(updatedUser);

    if (payload.metadata) {
      const metadataResult = await this.metadataValueService.manageMetadata(
        userId,
        'User',
        payload.metadata,
      );

      if (metadataResult?.statusCode) {
        return {
          statusCode: metadataResult.statusCode,
          error: metadataResult.error,
        };
      }

      user.metadata = metadataResult.data.metadata;
    }

    user = { ...updatedUser, metadata: payload.metadata } as typeof user;

    await this.redisService.delete(RedisKeys.session(userId));

    this.logger.log(`General data updated for ${userId}`);

    return user;
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
        invitedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: {
        environmentId: params.environmentId,
      },
    });

    // Get metadata for all users in batch
    const userIds = users.map((user) => user.id);
    const metadataByUser = await this.metadataValueService.getMetadataByContext(
      userIds,
      'User',
    );

    return users.map((user) => {
      const metadata = metadataByUser[user.id] || {};

      return {
        ...user,
        firstName: getFirstName(user.fullName),
        initials: getInitials(user.fullName),
        metadata,
      };
    });
  }

  async exclude(
    userId: string,
    environmentId: string,
  ): Promise<DataReturn<User>> {
    await this.metadataValueService.manageMetadata(userId, 'User', {});
    this.logger.log(`User ${userId} metadata has been deleted`);

    const user = await this.databaseService.user.delete({
      where: {
        id: userId,
        environmentId,
      },
    });

    this.logger.log(`User ${userId} has been deleted with all relations`);

    this.deletePrivateData(user);

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

    await this.redisService.delete(RedisKeys.session(userId));

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

    const invitedAt = new Date();
    await this.databaseService.user.update({
      where: { id: user.id },
      data: { invitedAt },
    });

    let inviter = null;

    if (fromUserId) {
      inviter = await this.databaseService.user.findFirst({
        where: { id: fromUserId },
        select: {
          fullName: true,
          email: true,
        },
      });
    }

    const { data: tokenData } = await this.tokenStorageService.create({
      type: TokenTypes.InviteUser,
      expiresIn: '5h',
      relationId: user.id,
      environmentId,
    });

    try {
      await this.emailTemplateService.send({
        userId: user.id,
        to: user.email,
        emailTemplateType: EmailTemplates.Invite,
        environmentId,
        data: {
          token: tokenData?.token,
          inviter,
        },
      });
    } catch (e) {
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    return {
      data: {
        id: user.id,
        fullName: user.fullName,
        environmentId: user.environmentId,
        invitedAt,
      } as User,
    };
  }

  async sendConfirmationEmail(
    userId: string,
    environmentId: string,
  ): Promise<DataReturn<User>> {
    const user = await this.databaseService.user.findFirst({
      where: {
        id: userId,
        environmentId,
      },
      include: {
        organization: true,
      },
    });

    if (!user?.active) {
      this.logger.error(`User ${userId} is not active`);
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: ErrorMessages.UserIsNotActive,
      };
    }

    if (user?.organization?.id && !user?.organization?.active) {
      this.logger.error(`Organization ${user?.organization?.id} is not active`);
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: ErrorMessages.InvalidUser,
      };
    }

    if (user?.emailConfirmed) {
      this.logger.error(`User ${userId} already confirmed email`);
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: ErrorMessages.UserAlreadyConfirmedEmail,
      };
    }

    const {
      data: { token },
    } = await this.tokenStorageService.create({
      relationId: user.id,
      type: TokenTypes.ConfirmEmail,
      expiresIn: '5h',
      environmentId,
    });

    await this.emailTemplateService.send({
      userId: user.id,
      to: user.email,
      emailTemplateType: EmailTemplates.ConfirmEmail,
      environmentId,
      data: {
        token,
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

  private deletePrivateData(user) {
    delete user.password;
    delete user.thonLabsUser;
  }
}
