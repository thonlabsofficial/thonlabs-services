import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { Environment, TokenStorage, TokenTypes, User } from '@prisma/client';
import { DataReturn } from '@/utils/interfaces/data-return';
import { JwtService } from '@nestjs/jwt';
import rand from '@/utils/services/rand';
import ms from 'ms';
import Crypt from '@/utils/services/crypt';
import { isBefore } from 'date-fns';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import { decode as jwtDecode } from 'jsonwebtoken';
import { SessionData } from '@/utils/interfaces/session-data';
import { AuthenticateMethodsReturn } from '../../auth/services/auth.service';

@Injectable()
export class TokenStorageService {
  private readonly logger = new Logger(TokenStorageService.name);

  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async getByToken(token: string, type: TokenTypes) {
    if (!token) {
      return null;
    }

    return this.databaseService.tokenStorage.findFirst({
      where: {
        token,
        type,
      },
    });
  }

  async getByRelation(type: TokenTypes, relationId: string) {
    return this.databaseService.tokenStorage.findFirst({
      where: {
        type,
        relationId,
      },
    });
  }

  async delete(token: string) {
    await this.databaseService.tokenStorage.delete({
      where: { token },
    });

    this.logger.log(`Token deleted`);
  }

  async deleteMany(type: TokenTypes, relationId: string) {
    const { count } = await this.databaseService.tokenStorage.deleteMany({
      where: { relationId, type },
    });

    if (count > 0) {
      this.logger.log(`Deleted tokens for relation ${type} ${relationId}`);
    }
  }

  async deleteAllByRelation(relationId: string) {
    await this.databaseService.tokenStorage.deleteMany({
      where: { relationId },
    });

    this.logger.log(`All tokens for relation id ${relationId} deleted`);
  }

  async create({
    type,
    relationId,
    expiresIn,
  }: {
    type: TokenTypes;
    relationId: string;
    expiresIn: string | number;
  }): Promise<DataReturn<TokenStorage>> {
    // Register a new token for magic link
    let foundTokenToUse = false;
    let token;

    while (!foundTokenToUse) {
      // Generate random key
      token = rand(6);

      const tokenCount = await this.databaseService.tokenStorage.count({
        where: { token },
      });
      foundTokenToUse = tokenCount === 0;
    }

    this.logger.log(`Found a token for ${type}`);

    const tokenData = await this.databaseService.tokenStorage.create({
      data: {
        relationId,
        type,
        token,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expires: new Date(new Date().getTime() + ms(expiresIn as any)),
      },
    });

    this.logger.log(`Relation ${type} ${relationId} token created`);

    return { data: tokenData };
  }

  async createAuthTokens(
    user: User,
    environment: Environment,
  ): Promise<DataReturn<AuthenticateMethodsReturn>> {
    // Delete all refresh tokens
    await this.deleteMany(TokenTypes.Refresh, user.id);

    this.logger.log(`User ${user.id} tokens deleted`);

    const payload = {
      sub: user.id,
      thonLabsUser: user.thonLabsUser,
      email: user.email,
      profilePicture: user.profilePicture,
      fullName: user.fullName,
    };

    const iv = Crypt.generateIV(user.id);
    const authKey = await Crypt.decrypt(
      user.authKey,
      iv,
      process.env.ENCODE_AUTH_KEYS_SECRET,
    );

    const result = {};

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: environment.tokenExpiration,
      secret: `${authKey}${process.env.AUTHENTICATION_SECRET}`,
    });
    const tokenExpiresIn = (jwtDecode(token) as SessionData).exp * 1000;

    result['token'] = token;
    result['tokenExpiresIn'] = tokenExpiresIn;

    this.logger.log(`User ${user.id} JWT created`);

    if (environment.refreshTokenExpiration) {
      const { data } = await this.create({
        type: TokenTypes.Refresh,
        relationId: user.id,
        expiresIn: environment.refreshTokenExpiration,
      });

      result['refreshToken'] = data.token;
      result['refreshTokenExpiresIn'] = data.expires.getTime();
    }

    this.logger.log(`User ${user.id} refresh created`);

    return {
      data: result as AuthenticateMethodsReturn,
    };
  }

  public isTokenExpirationValid(token: TokenStorage): DataReturn {
    const isTokenValid = isBefore(new Date(), new Date(token.expires));

    if (!isTokenValid) {
      this.logger.log(`Token Expired for ${token.type} ${token.relationId}`);
      return {
        statusCode: StatusCodes.NotFound,
      };
    }

    return {};
  }
}
