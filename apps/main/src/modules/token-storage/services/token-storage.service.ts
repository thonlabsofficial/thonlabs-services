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

  async getByToken(token: string, type: TokenTypes, shouldHash = false) {
    if (!token) {
      this.logger.error(
        `Relation ID does not exists ${type}${token.substring(0, 7)}`,
      );
      return null;
    }

    const plainToken = shouldHash
      ? await Crypt.hash256(token, process.env.ENCODE_SECRET)
      : token;

    return this.databaseService.tokenStorage.findFirst({
      where: {
        token: plainToken,
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
      this.logger.log(
        `Deleted tokens for relation "${type}" (RID: ${relationId})`,
      );
    }
  }

  async deleteAllByRelation(relationId: string) {
    await this.databaseService.tokenStorage.deleteMany({
      where: { relationId },
    });

    this.logger.log(
      `All tokens for relation id were deleted (RID: ${relationId})`,
    );
  }

  async create({
    type,
    relationId,
    expiresIn,
    environmentId,
    encrypt = false,
  }: {
    type: TokenTypes;
    relationId: string;
    expiresIn: string | number;
    environmentId?: string;
    encrypt?: boolean;
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

    const plainToken = token;

    if (encrypt) {
      token = await Crypt.hash256(plainToken, process.env.ENCODE_SECRET);
    }

    const tokenData = await this.databaseService.tokenStorage.create({
      data: {
        environmentId,
        relationId,
        type,
        token,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expires: new Date(Date.now() + ms(expiresIn as any)),
      },
    });

    this.logger.log(`Relation ${type} token created (RID: ${relationId})`);

    return {
      data: {
        ...tokenData,
        token: plainToken,
      },
    };
  }

  async createAuthTokens(
    user: Partial<User & { organization?: { id: string; name: string } }>,
    environment: Partial<Environment>,
  ): Promise<DataReturn<AuthenticateMethodsReturn>> {
    // Delete all refresh tokens
    // @TODO: Think in a better strategy
    // await this.deleteMany(TokenTypes.Refresh, user.id);

    let organization = user.organization;

    if (user.organizationId && !organization) {
      const { name: orgName } =
        await this.databaseService.organization.findFirst({
          select: {
            name: true,
          },
          where: { id: user.organizationId },
        });

      organization = {
        id: user.organizationId,
        name: orgName,
      };
    }

    const payload = {
      sub: user.id,
      thonLabsUser: user.thonLabsUser,
    };

    const result = {};

    const plainAuthKey = await Crypt.decrypt(
      user.authKey,
      process.env.ENCODE_SECRET,
    );

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: environment.tokenExpiration,
      secret: plainAuthKey,
    });
    const tokenExpiresIn = (jwtDecode(token) as SessionData).exp * 1000;

    result['token'] = token;
    result['tokenExpiresIn'] = tokenExpiresIn;

    this.logger.log(`JWT created (UID: ${user.id})`);

    if (environment.refreshTokenExpiration) {
      const { data } = await this.create({
        type: TokenTypes.Refresh,
        relationId: user.id,
        expiresIn: environment.refreshTokenExpiration,
        encrypt: true,
      });

      result['refreshToken'] = data.token;
      result['refreshTokenExpiresIn'] = data.expires.getTime();
    }

    this.logger.log(`Refresh created (UID: ${user.id})`);

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
