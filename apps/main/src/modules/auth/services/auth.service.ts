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
import { TokenStorageService } from '@/auth/modules/token-storage/services/token-storage.service';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import getEnvIdHash from '@/utils/services/get-env-id-hash';
import { SSOUser } from '../interfaces/sso-user';
import { HTTPService } from '@/auth/modules/shared/services/http.service';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import {
  EnvironmentDataKeys,
  EnvironmentCredentials,
} from '@/auth/modules/environments/constants/environment-data';
import { EmailTemplateService } from '@/auth/modules/emails/services/email-template.service';
import { SessionData } from '@/utils/interfaces/session-data';
import { decode as jwtDecode } from 'jsonwebtoken';
import Crypt from '@/utils/services/crypt';
import { JwtService } from '@nestjs/jwt';
import { UserDataService } from '@/auth/modules/users/services/user-data.service';
import { UserDetails } from '../../users/models/user';
import { getFirstName, getInitials } from '@/utils/services/names-helpers';

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
    private databaseService: DatabaseService,
    private userService: UserService,
    private tokenStorageService: TokenStorageService,
    private httpService: HTTPService,
    private environmentDataService: EnvironmentDataService,
    private emailTemplateService: EmailTemplateService,
    private jwtService: JwtService,
    private userDataService: UserDataService,
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

    const user = await this.databaseService.user.findFirst({
      where: { email: email, environmentId },
      select: {
        id: true,
        thonLabsUser: true,
        email: true,
        profilePicture: true,
        fullName: true,
        authKey: true,
        environmentId: true,
        active: true,
        password: true,
        lastSignIn: true,
        organizationId: true,
        environment: {
          select: {
            tokenExpiration: true,
            refreshTokenExpiration: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    });

    if (!user) {
      return error;
    }

    if (!user.active) {
      this.logger.error(`User ${user.id} is not active`);
      return error;
    }

    if (user?.organization?.id && !user?.organization?.active) {
      this.logger.error(`Organization ${user.organization.id} is not active`);
      return error;
    }

    if (!user.password) {
      return error;
    }

    const hashPassword = user.password;
    const isValid = await bcrypt.compare(password, hashPassword);

    if (!isValid) {
      this.logger.warn(`Password not match (UID: ${user.id})`);
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

      this.logger.log(`Created auth tokens (UID: ${user.id})`);

      if (!user.lastSignIn) {
        await this.emailTemplateService.sendWelcomeEmail(
          { id: user.id, email: user.email } as User,
          user.environmentId,
        );
      }

      this.userService.updateLastLogin(user.id, user.environmentId);

      return {
        data,
      };
    } catch (e) {
      this.logger.error(
        `Login/Pass - Error on creating tokens for user (UID: ${user.id})`,
      );

      return {
        error: ErrorMessages.InternalError,
        statusCode: StatusCodes.Internal,
      };
    }
  }

  async generateMagicLoginToken(
    userId: string,
    environmentId: string,
  ): Promise<DataReturn<TokenStorage>> {
    await Promise.all([
      this.tokenStorageService.deleteMany(TokenTypes.Refresh, userId),
      this.tokenStorageService.deleteMany(TokenTypes.MagicLogin, userId),
    ]);

    const token = await this.tokenStorageService.create({
      type: TokenTypes.MagicLogin,
      relationId: userId,
      expiresIn: '30m',
      environmentId: environmentId,
    });

    if (token?.error) {
      this.logger.error(
        `generateMagicLoginToken: error creating token (UID: ${userId})`,
      );

      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    return { data: token?.data };
  }

  async sendMagicLink({
    email,
    environment,
  }: {
    email: string;
    environment: Partial<Environment>;
  }) {
    const user = await this.userService.getByEmail(email, environment.id);

    if (!user) {
      this.logger.error(`User email not found`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.EmailNotFound,
      };
    }

    if (user?.organization?.id && !user?.organization?.active) {
      this.logger.error(
        `Organization is not active (OID: ${user.organization.id})`,
      );
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.EmailNotFound,
      };
    }

    const token = await this.generateMagicLoginToken(user.id, environment.id);

    if (token?.statusCode) {
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    await this.emailTemplateService.send({
      to: email,
      userId: user.id,
      emailTemplateType: EmailTemplates.MagicLink,
      environmentId: environment.id,
      data: {
        token: token?.data?.token,
      },
    });
  }

  async authenticateFromMagicLink({
    token,
  }: {
    token: string;
  }): Promise<DataReturn<AuthenticateMethodsReturn>> {
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

    const user = await this.databaseService.user.findFirst({
      where: { id: data.relationId },
      select: {
        id: true,
        active: true,
        thonLabsUser: true,
        email: true,
        profilePicture: true,
        fullName: true,
        authKey: true,
        environmentId: true,
        lastSignIn: true,
        organizationId: true,
        environment: {
          select: {
            tokenExpiration: true,
            refreshTokenExpiration: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.error(`User not found (UID: ${data.relationId})`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidUser,
      };
    }

    if (!user.active) {
      this.logger.error(`User is not active (UID: ${user.id})`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidUser,
      };
    }

    if (user.environmentId !== data.environmentId) {
      this.logger.error(
        `Magic token not allowed for user (UID: ${data.relationId}) (ENV: ${data.environmentId})`,
      );
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidToken,
      };
    }

    const { data: tokenData } = await this.tokenStorageService.createAuthTokens(
      user,
      user.environment,
    );

    await this.tokenStorageService.deleteMany(
      TokenTypes.MagicLogin,
      data.relationId,
    );

    if (!user.lastSignIn) {
      await this.emailTemplateService.sendWelcomeEmail(
        { id: user.id, email: user.email } as User,
        user.environmentId,
      );
    }

    await this.userService.updateLastLogin(user.id, user.environmentId);

    return { data: tokenData };
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
      this.logger.warn(`Refresh Token not found token`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidToken,
      };
    }

    const isTokenValid = isBefore(new Date(), new Date(data?.expires));

    if (!isTokenValid) {
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const user = await this.databaseService.user.findFirst({
      where: { id: data.relationId },
      select: {
        id: true,
        active: true,
        thonLabsUser: true,
        email: true,
        profilePicture: true,
        fullName: true,
        authKey: true,
        environmentId: true,
        organizationId: true,
        environment: {
          select: {
            tokenExpiration: true,
            refreshTokenExpiration: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.error(`User not found (UID: ${data.relationId})`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidUser,
      };
    }

    if (!user?.active) {
      this.logger.error(`User is not active (UID: ${user.id})`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidUser,
      };
    }

    if (user?.organization?.id && !user?.organization?.active) {
      this.logger.error(
        `Organization is not active (OID: ${user.organization.id})`,
      );
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidUser,
      };
    }

    if (user.environmentId !== environmentId) {
      this.logger.error(
        `Refresh token not allowed for user (UID: ${data.relationId}) (ENV: ${environmentId})`,
      );
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: 'Token not allowed for user',
      };
    }

    const authTokens = await this.tokenStorageService.createAuthTokens(
      user,
      user.environment,
    );

    return authTokens;
  }

  async logout(payload: { userId: string; environmentId: string }) {
    const user = await this.userService.getById(payload.userId);

    if (!user) {
      this.logger.error(
        `User not found (UID: ${payload.userId}) (ENV: ${payload.environmentId})`,
      );
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.UserNotFound,
      };
    }

    if (user?.environmentId !== payload.environmentId) {
      this.logger.error(
        `Logout not allowed for user (UID: ${user.id}) (ENV: ${user.environmentId})`,
      );
      return {
        statusCode: StatusCodes.NotAcceptable,
        error: 'Logout not allowed for user',
      };
    }

    await this.tokenStorageService.deleteAllByRelation(user.id);

    this.logger.log(`User logged out (UID: ${user.id})`);
  }

  async validateUserTokenExpiration(
    token: string,
    type: TokenTypes,
  ): Promise<DataReturn<TokenStorage>> {
    const tokenData = await this.tokenStorageService.getByToken(token, type);

    if (!tokenData) {
      this.logger.warn(
        `validateUserTokenExpiration: Token not found (TID: ${token.substring(0, 10)} - TYPE: ${type})`,
      );
      return {
        statusCode: StatusCodes.NotFound,
      };
    }

    const user = await this.userService.getById(tokenData.relationId);

    if (!user || user.environmentId !== tokenData.environmentId) {
      this.logger.warn(
        `validateUserTokenExpiration: invalid user (UID: ${tokenData.relationId})`,
      );
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidUser,
      };
    }

    const data = this.tokenStorageService.isTokenExpirationValid(tokenData);

    if (data?.statusCode) {
      this.logger.warn(
        `validateUserTokenExpiration: token expired (TID: ${token.substring(0, 10)} - TYPE: ${type})`,
      );
      return {
        statusCode: StatusCodes.Unauthorized,
        data: tokenData,
      };
    }

    return { data: tokenData };
  }

  async generateResetPasswordToken(
    userId: string,
    environmentId: string,
  ): Promise<DataReturn<TokenStorage>> {
    const token = await this.tokenStorageService.create({
      expiresIn: '30m',
      relationId: userId,
      type: TokenTypes.ResetPassword,
      environmentId: environmentId,
    });

    if (token?.error) {
      this.logger.error(
        `generateResetPasswordToken: error creating token for user (UID: ${userId})`,
      );

      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    return { data: token?.data };
  }

  getDefaultAuthDomain(environmentId: string) {
    const appDomain = new URL(process.env.APP_ROOT_URL).hostname;
    return `${getEnvIdHash(environmentId)}.auth.${appDomain}`;
  }

  async getGoogleUser(
    token: string,
    environmentId: string,
  ): Promise<DataReturn<SSOUser>> {
    const { data: credentials } =
      await this.environmentDataService.get<EnvironmentCredentials>(
        environmentId,
        EnvironmentDataKeys.Credentials,
      );

    if (!credentials?.google) {
      this.logger.error(
        `Google SSO: invalid credentials found for env (ENV: ${environmentId})`,
      );
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.InvalidCredentials,
      };
    }

    const { clientId, secretKey, redirectURI } = credentials.google;

    try {
      const { data: tokens } = await this.httpService.post({
        url: 'https://oauth2.googleapis.com/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          code: token,
          client_id: clientId,
          client_secret: secretKey,
          redirect_uri: redirectURI,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokens?.access_token) {
        this.logger.error(`getGoogleUser: error fetching tokens`, tokens);
        return {
          statusCode: StatusCodes.Unauthorized,
          error: ErrorMessages.InvalidToken,
        };
      }

      const { data: userInfo } = await this.httpService.get({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfo?.email) {
        this.logger.error(`getGoogleUser: error fetching user info`, userInfo);
        return {
          statusCode: StatusCodes.Unauthorized,
          error: ErrorMessages.InvalidToken,
        };
      }

      return {
        data: {
          fullName: userInfo?.name,
          email: userInfo.email,
          profilePicture: userInfo?.picture,
        },
      };
    } catch (error) {
      if (error.response) {
        this.logger.error(`getGoogleUser: Google OAuth error`, {
          status: error.response.status,
          data: error.response.data,
        });
      }
      this.logger.error(`getGoogleUser: error authenticating - ${error}`);
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }
  }

  async isAnySignUpMethodEnabled(
    environmentId: string,
  ): Promise<DataReturn<boolean>> {
    const [{ data: enableSignUp }, { data: enableSignUpB2BOnly }] =
      await Promise.all([
        this.environmentDataService.get(environmentId, 'enableSignUp'),
        this.environmentDataService.get(environmentId, 'enableSignUpB2BOnly'),
      ]);

    /* 
      If sign up is enabled for B2B only the "user.create" method will validate the domain
    */
    return { data: enableSignUpB2BOnly || enableSignUp };
  }

  async getUserBySessionToken(
    token: string,
  ): Promise<DataReturn<Partial<UserDetails>>> {
    if (!token) {
      this.logger.error(`Token not found`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const session = jwtDecode(token) as SessionData;

    if (!session.sub) {
      this.logger.error(`Sub not found (UID: ${session.sub})`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    // TODO: @gus -> collect this data from redis in the future
    const user = await this.databaseService.user.findFirst({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        profilePicture: true,
        authKey: true,
        active: true,
        lastSignIn: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        environmentId: true,
        emailConfirmed: true,
        invitedAt: true,
        thonLabsUser: true,
      },
    });

    if (!user) {
      this.logger.error(`User not found (UID: ${session.sub})`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    if (!user.active) {
      this.logger.error(`User is not active (UID: ${user.id})`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    const authKey = await Crypt.decrypt(
      user.authKey,
      Crypt.generateIV(user.id),
      process.env.ENCODE_AUTH_KEYS_SECRET,
    );

    try {
      await this.jwtService.verifyAsync(token, {
        secret: `${authKey}${process.env.AUTHENTICATION_SECRET}`,
      });
    } catch (e) {
      this.logger.error(`Token verification failed (UID: ${user.id})`);
      return {
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      };
    }

    let organization = null;
    if (user.organizationId) {
      organization = await this.databaseService.organization.findFirst({
        where: { id: user.organizationId },
        select: {
          id: true,
          name: true,
        },
      });
    }

    let metadata = {};

    if (user.thonLabsUser) {
      metadata = await this.userDataService.fetch(user.id);
    } else {
      metadata = await this.userDataService.fetchMetadata(user.id);
    }

    return {
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firstName: getFirstName(user.fullName),
        initials: getInitials(user.fullName),
        profilePicture: user.profilePicture,
        active: user.active,
        lastSignIn: user.lastSignIn,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        environmentId: user.environmentId,
        emailConfirmed: user.emailConfirmed,
        invitedAt: user.invitedAt,
        metadata,
        ...(organization && { organization }),
      },
    };
  }
}
