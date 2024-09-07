import { Injectable, Logger } from '@nestjs/common';
import {
  EmailTemplates,
  Environment,
  TokenStorage,
  TokenTypes,
  User,
} from '@prisma/client';
import { isBefore } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { DataReturn } from '@/utils/interfaces/data-return';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { UserService } from '@/auth/modules/users/services/user.service';
import { EmailService } from '@/auth/modules/emails/services/email.service';
import { TokenStorageService } from '@/auth/modules/token-storage/services/token-storage.service';
import { ProjectService } from '@/auth/modules/projects/services/project.service';
import { getFirstName } from '@/utils/services/names-helpers';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';

export interface AuthenticateMethodsReturn {
  token: string;
  tokenExpiresIn: number;
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
    private environmentService: EnvironmentService,
  ) {}

  async authenticateFromEmailAndPassword(
    email: string,
    password: string,
    environmentId: string,
  ): Promise<DataReturn<AuthenticateMethodsReturn>> {
    const error = {
      statusCode: StatusCodes.Unauthorized,
      error: ErrorMessages.InvalidEmailOrPass,
    };

    const user = await this.userService.getByEmail(email, environmentId);

    if (!user) {
      return error;
    }

    if (!user.active) {
      this.logger.error(`User ${user.id} is not active`);
      return error;
    }

    if (!user.password) {
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

      this.userService.updateLastLogin(user.id, user.environment.id);

      return {
        data,
      };
    } catch (e) {
      this.logger.error(
        `Login/Pass - Error on creating tokens for user ${user.id}`,
      );
      console.error(e);

      return {
        error: ErrorMessages.InternalError,
        statusCode: StatusCodes.Internal,
      };
    }
  }

  async sendMagicLink({
    email,
    environment,
  }: {
    email: string;
    environment: Partial<Environment>;
  }): Promise<DataReturn<AuthenticateMethodsReturn>> {
    let user: Omit<User, 'environment'> = await this.userService.getByEmail(
      email,
      environment.id,
    );

    if (!user) {
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.EmailNotFound,
      };
    }

    await Promise.all([
      this.tokenStorageService.deleteMany(TokenTypes.Refresh, user.id),
      this.tokenStorageService.deleteMany(TokenTypes.MagicLogin, user.id),
    ]);

    const {
      data: { token },
    } = await this.tokenStorageService.create({
      type: TokenTypes.MagicLogin,
      relationId: user.id,
      expiresIn: '30m',
      environmentId: environment.id,
    });

    await this.emailService.send({
      to: email,
      userId: user.id,
      emailTemplateType: EmailTemplates.MagicLink,
      environmentId: environment.id,
      data: {
        token,
      },
    });
  }

  async authenticateFromMagicLink({
    token,
  }: {
    token: string;
  }): Promise<DataReturn<{ token: string; refreshToken?: string }>> {
    const data = await this.tokenStorageService.getByToken(
      token,
      TokenTypes.MagicLogin,
    );

    if (!data) {
      this.logger.warn('Magic Token not found');
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidToken,
      };
    }

    const isTokenValid = isBefore(new Date(), new Date(data?.expires));

    if (!isTokenValid) {
      this.logger.warn(`Expired magic login token for ${data.relationId}`);
      await this.tokenStorageService.delete(token);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidToken,
      };
    }

    const user = await this.userService.getDetailedById(data.relationId);

    if (!user.active) {
      this.logger.error(`User ${user.id} is not active`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidUser,
      };
    }

    if (user.environmentId !== data.environmentId) {
      this.logger.error(
        `Magic token not allowed for user ${data.relationId} on env ${data.environmentId}`,
      );
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidToken,
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

    this.userService.updateLastLogin(user.id, user.environment.id);

    return {
      ...tokens,
      user: {
        email: user.email,
        profilePicture: user.profilePicture,
        fullName: user.fullName,
      },
    };
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

  async validateUserTokenExpiration(
    token: string,
    type: TokenTypes,
  ): Promise<DataReturn<TokenStorage>> {
    const tokenData = await this.tokenStorageService.getByToken(token, type);

    if (!tokenData) {
      this.logger.warn(
        `validateUserTokenExpiration: Token not found (${token.substring(0, 10)} - ${type})`,
      );
      return {
        statusCode: StatusCodes.NotFound,
      };
    }

    const user = await this.userService.getById(tokenData.relationId);

    if (!user || user.environmentId !== tokenData.environmentId) {
      this.logger.warn(
        `validateUserTokenExpiration: user not found (${tokenData.relationId})`,
      );
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.UserNotFound,
      };
    }

    const data = this.tokenStorageService.isTokenExpirationValid(tokenData);

    if (data?.statusCode) {
      this.logger.warn(
        `validateUserTokenExpiration: token expired (${token.substring(0, 10)} - ${type})`,
      );
      return {
        statusCode: StatusCodes.NotFound,
      };
    }

    return { data: tokenData };
  }
}
