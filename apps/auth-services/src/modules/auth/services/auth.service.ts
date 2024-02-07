import { Injectable, Logger } from '@nestjs/common';
import { EmailTemplates, Environment, TokenTypes, User } from '@prisma/client';
import { isBefore } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { DataReturn } from '@/utils/interfaces/data-return';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { UserService } from '@/auth/modules/users/services/user.service';
import { EmailService } from '@/auth/modules/emails/services/email.service';
import { TokenStorageService } from '@/auth/modules/token-storage/services/token-storage.service';
import { ProjectService } from '@/auth/modules/projects/services/project.service';

interface AuthenticateMethodsReturn {
  token: string;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private emailService: EmailService,
    private tokenStorageService: TokenStorageService,
    private projectService: ProjectService,
  ) {}

  async authenticateFromEmailAndPassword(
    email: string,
    password: string,
    environmentId: string,
  ): Promise<DataReturn<AuthenticateMethodsReturn>> {
    const error = {
      statusCode: StatusCodes.Unauthorized,
      error: ErrorMessages.InvalidCredentials,
    };

    const user = await this.userService.getByEmail(email, environmentId);

    if (!user) {
      this.logger.warn(`Email not found for user ${user.id}`);
      return error;
    }

    if (!user.password) {
      this.logger.warn(`Password not found for user ${user.id}`);
      return error;
    }

    const hashPassword = user.password;
    const isValid = await bcrypt.compare(password, hashPassword);

    if (!isValid) {
      this.logger.warn('Password nor matches', user.id);
      return error;
    }

    try {
      await this.tokenStorageService.deleteMany(
        TokenTypes.ResetPassword,
        user.id,
      );

      const { data } = await this.tokenStorageService.createAuthTokens(
        user,
        user.environment,
      );

      this.logger.log('Created auth tokens');

      return { data };
    } catch (e) {
      this.logger.error(
        'Login/Pass - Error on creating tokens for user',
        user.id,
        e,
      );

      return {
        error: ErrorMessages.InternalError,
        statusCode: StatusCodes.Internal,
      };
    }
  }

  async loginOrCreateFromMagicLink({
    email,
    fullName,
    environment,
  }: {
    email: string;
    fullName?: string;
    environment: Partial<Environment>;
  }): Promise<DataReturn<AuthenticateMethodsReturn>> {
    let user: Omit<User, 'environment'> = await this.userService.getByEmail(
      email,
      environment.id,
    );

    if (user) {
      await Promise.all([
        this.tokenStorageService.deleteMany(TokenTypes.Refresh, user.id),
        this.tokenStorageService.deleteMany(TokenTypes.MagicLogin, user.id),
      ]);
    } else {
      const result = await this.userService.create({
        email,
        environmentId: environment.id,
        fullName,
      });

      if (result.error) {
        return {
          error: result.error,
          statusCode: result.statusCode,
        };
      }

      user = result.data;

      this.logger.log(`User ${user.id} created from magic link`);
    }

    const { data: project } = await this.projectService.getByEnvironmentId(
      environment.id,
    );

    const {
      data: { token },
    } = await this.tokenStorageService.create({
      type: TokenTypes.MagicLogin,
      relationId: user.id,
      expiresIn: '30m',
    });

    await this.emailService.send({
      to: email,
      emailTemplateType: EmailTemplates.MagicLink,
      environmentId: environment.id,
      data: { token, appName: project.appName, appURL: environment.appURL },
    });
  }

  async authenticateFromMagicLink({
    token,
    environmentId,
  }: {
    token: string;
    environmentId: string;
  }): Promise<DataReturn<{ token: string; refreshToken?: string }>> {
    const data = await this.tokenStorageService.getByToken(
      token,
      TokenTypes.MagicLogin,
    );

    if (!data) {
      this.logger.warn('Magic Token not found');
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const isTokenValid = isBefore(new Date(), new Date(data?.expires));

    if (!isTokenValid) {
      this.logger.warn(`Expired magic login token for ${data.relationId}`);
      await this.tokenStorageService.delete(token);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const user = await this.userService.getDetailedById(data.relationId);

    if (user.environmentId !== environmentId) {
      this.logger.error(
        `Magic token not allowed for user ${data.relationId} on env ${environmentId}`,
      );
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: 'Token not allowed for user',
      };
    }

    const tokens = this.tokenStorageService.createAuthTokens(
      user,
      user.environment,
    );

    await this.tokenStorageService.deleteMany(
      TokenTypes.MagicLogin,
      data.relationId,
    );

    return tokens;
  }

  async reAuthenticateFromRefreshToken({
    token,
    environmentId,
  }: {
    token: string;
    environmentId: string;
  }) {
    const data = await this.tokenStorageService.getByToken(
      token,
      TokenTypes.Refresh,
    );

    if (!data) {
      this.logger.warn('Refresh Token not found');
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const isTokenValid = isBefore(new Date(), new Date(data?.expires));

    if (!isTokenValid) {
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const user = await this.userService.getDetailedById(data.relationId);

    if (user.environmentId !== environmentId) {
      this.logger.error(
        `Refresh token not allowed for user ${data.relationId} on env ${environmentId}`,
      );
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: 'Token not allowed for user',
      };
    }

    return this.tokenStorageService.createAuthTokens(user, user.environment);
  }

  async logout(payload: { userId: string; environmentId: string }) {
    const user = await this.userService.getById(payload.userId);

    if (!user) {
      this.logger.error(
        `User ${payload.userId} not found for Env ${payload.environmentId}`,
      );
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.UserNotFound,
      };
    }

    if (user?.environmentId !== payload.environmentId) {
      this.logger.error(
        `Logout not allowed for user ${user.id} on env ${user.environmentId}`,
      );
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: 'Logout not allowed for user',
      };
    }

    await this.tokenStorageService.deleteAllByRelation(user.id);
  }
}
