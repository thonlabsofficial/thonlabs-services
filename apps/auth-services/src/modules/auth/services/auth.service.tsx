import { Injectable, Logger } from '@nestjs/common';
import { EmailTemplates, Environment, TokenTypes, User } from '@prisma/client';
import { isBefore } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { DataReturn } from '@/utils/interfaces/data-return';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { UserService } from '@/auth/modules/users/services/user.service';
import { EmailService } from '../../emails/services/email.service';
import { TokenStorageService } from '../../token-storage/services/token-storage.service';

interface AuthenticateMethodsReturn {
  token: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private emailService: EmailService,
    private tokenStorageService: TokenStorageService,
  ) {}

  async authenticateFromEmailAndPassword(
    email: string,
    password: string,
    environmentId: string,
  ): Promise<DataReturn<AuthenticateMethodsReturn>> {
    const error = {
      statusCode: StatusCodes.Unauthorized,
      error: ErrorMessages.Unauthorized,
    };

    const user = await this.userService.getByEmail(email, environmentId);

    if (!user) {
      this.logger.warn('Email not found');
      return error;
    }

    const hashPassword = user.password;
    const isValid = await bcrypt.compare(password, hashPassword);

    if (!isValid) {
      this.logger.warn('Password nor matches', user.id);
      return error;
    }

    try {
      const {
        data: { token, refreshToken },
      } = await this.tokenStorageService.createAuthTokens(
        user,
        user.environment,
      );

      this.logger.log('Confirmation email sent');

      return { data: { token, refreshToken } };
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
      const userToken = await this.tokenStorageService.getByRelation(
        TokenTypes.MagicLogin,
        user.id,
      );

      if (userToken) {
        await this.tokenStorageService.deleteMany(
          TokenTypes.MagicLogin,
          user.id,
        );
      }
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

    try {
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
        data: { token },
      });

      this.logger.log('Magic login email sent');
    } catch (e) {
      this.logger.error('Error on send magic link token for user', user.id);

      return {
        error: ErrorMessages.InternalError,
        statusCode: StatusCodes.Internal,
      };
    }
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
    const isTokenValid = isBefore(new Date(), new Date(data?.expires));

    if (!isTokenValid) {
      this.logger.error('Invalid magic login token', data.relationId);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const user = await this.userService.getDetailedById(data.relationId);

    return this.tokenStorageService.createAuthTokens(user, user.environment);
  }

  async reAuthenticateFromRefreshToken({ token }: { token: string }) {
    const data = await this.tokenStorageService.getByToken(
      token,
      TokenTypes.Refresh,
    );
    const isTokenValid = isBefore(new Date(), new Date(data?.expires));

    if (!isTokenValid) {
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const user = await this.userService.getDetailedById(data.relationId);

    return this.tokenStorageService.createAuthTokens(user, user.environment);
  }
}
