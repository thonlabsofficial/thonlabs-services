import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { Environment, TokenStorage, TokenTypes, User } from '@prisma/client';
import { DataReturn } from '@/utils/interfaces/data-return';
import { JwtService } from '@nestjs/jwt';
import rand from '@/utils/services/rand';
import ms from 'ms';
import Crypt from '@/utils/services/crypt';

@Injectable()
export class TokenStorageService {
  private readonly logger = new Logger(TokenStorageService.name);

  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async getByToken(token: string, type: TokenTypes) {
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

  async deleteMany(type: TokenTypes, relationId: string) {
    await this.databaseService.tokenStorage.deleteMany({
      where: { relationId, type },
    });

    this.logger.log(
      `Relation ${type} ${relationId} deleted tokens that already exists`,
    );
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
        expires: new Date(new Date().getTime() + ms(expiresIn)),
      },
    });

    this.logger.log(`Relation ${type} ${relationId} token created`);

    return { data: tokenData };
  }

  async createAuthTokens(
    user: User,
    environment: Environment,
  ): Promise<
    DataReturn<{
      token: string;
      refreshToken?: string;
      refreshTokenExpiresIn?: number;
    }>
  > {
    // Delete all refresh tokens
    await this.deleteMany(TokenTypes.Refresh, user.id);

    this.logger.log(`User ${user.id} tokens deleted`);

    const payload = {
      sub: user.id,
      thonLabsUser: user.thonLabsUser,
      active: user.active,
      environmentId: environment.id,
      environmentKey: environment.authKey,
      roleId: user.roleId,
    };

    const iv = Crypt.generateIV(environment.id);
    const authKey = await Crypt.decrypt(
      environment.authKey,
      iv,
      process.env.ENCODE_AUTH_KEYS_SECRET,
    );

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: environment.tokenExpiration,
      secret: `${authKey}${process.env.AUTHENTICATION_SECRET}`,
    });

    this.logger.log(`User ${user.id} JWT created`);

    let refreshToken: TokenStorage;

    if (environment.refreshTokenExpiration) {
      const { data } = await this.create({
        type: TokenTypes.Refresh,
        relationId: user.id,
        expiresIn: environment.refreshTokenExpiration,
      });

      refreshToken = data;
    }

    this.logger.log(`User ${user.id} refresh created`);

    return {
      data: {
        token,
        refreshToken: refreshToken.token,
        refreshTokenExpiresIn: refreshToken.expires.getTime(),
      },
    };
  }
}
