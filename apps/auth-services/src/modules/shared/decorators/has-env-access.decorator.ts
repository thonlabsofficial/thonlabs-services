import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import decodeSession from '@/utils/services/decode-session';
import { UserService } from '../../users/services/user.service';
import { EnvironmentService } from '../../environments/services/environment.service';
import { TokenStorageService } from '../../token-storage/services/token-storage.service';
import { TokenTypes } from '@prisma/client';
import { SessionData } from '@/utils/interfaces/session-data';

type HasEnvAccessParams = {
  param?: string;
  source?: 'params' | 'headers';
};

export const HAS_ENV_ACCESS_KEY = 'HasEnvAccess';

const defaultParams: HasEnvAccessParams = {
  param: 'id',
  source: 'params',
};

export const HasEnvAccess = (params: HasEnvAccessParams = {}) =>
  SetMetadata(HAS_ENV_ACCESS_KEY, { ...defaultParams, ...params });

@Injectable()
export class HasEnvAccessGuard implements CanActivate {
  private readonly logger = new Logger(HasEnvAccessGuard.name);

  constructor(
    private reflector: Reflector,
    private userService: UserService,
    private environmentService: EnvironmentService,
    private tokenStorageService: TokenStorageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(
      HAS_ENV_ACCESS_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const { param, source } = metadata;
    const environmentId = req?.[source]?.[param];

    if (!environmentId) {
      this.logger.error(
        `Environment ID is missing, Param: ${param}, Source: ${source}`,
      );
      res.status(StatusCodes.Unauthorized).json({
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    const result = await this.environmentService.getById(environmentId);

    if (!result?.data) {
      this.logger.error(`Environment not found`);
      res.status(StatusCodes.NotFound).json({
        error: ErrorMessages.EnvironmentNotFound,
      });
      return false;
    }

    let user = decodeSession(req);

    if (!user && req.url === '/auth/refresh' && req?.body?.token) {
      /* 
        Special validation only for Refresh Token
      */
      const tokenData = await this.tokenStorageService.getByToken(
        req.body.token,
        TokenTypes.Refresh,
      );

      if (!tokenData?.relationId) {
        this.logger.error(
          `Refresh token relation ID not found (ENV: ${environmentId})`,
        );
        res.status(StatusCodes.Unauthorized).json({
          error: ErrorMessages.Unauthorized,
        });
        return false;
      }

      const relationUser = await this.userService.getByIdAndEnv(
        tokenData.relationId,
        environmentId,
      );

      if (!relationUser) {
        this.logger.error(
          `User not found for Relation ID ${tokenData.relationId} (ENV: ${environmentId})`,
        );
        res.status(StatusCodes.Unauthorized).json({
          error: ErrorMessages.Unauthorized,
        });
        return false;
      }

      user = {
        sub: relationUser.id,
        thonLabsUser: relationUser.thonLabsUser,
      } as SessionData;
    } else if (!user && req?.params?.userId) {
      /* 
        If session is empty but there is userId on params
        commonly from usage of public/secret key 
      */

      user = {
        sub: req.params.userId,
      } as SessionData;
    }

    if (!user) {
      this.logger.warn('User not exists');
      res.status(StatusCodes.Unauthorized).json({
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    /*
      If is a Thon Labs user means the user should owns the environment
      e.g.: to manage directly on Thon Labs UI

      If is not a Thon Labs user means the user should belongs to environment
      and to use this approach the user should use a public or secret key
      e.g.: to consume the API directly on their UI
    */

    if (user?.thonLabsUser) {
      const userOwnsEnvironment = await this.userService.ownsEnvironment(
        user.sub,
        environmentId,
      );

      if (userOwnsEnvironment) {
        return true;
      }

      this.logger.warn(
        `User ${user.sub} not owns the Environment ${environmentId}`,
      );
    }

    if (
      req?.headers['tl-env-id'] &&
      (req?.headers['tl-public-key'] || req?.headers['tl-secret-key'])
    ) {
      const userBelongsToEnvironment =
        await this.environmentService.userBelongsTo(user.sub, environmentId);

      if (userBelongsToEnvironment) {
        return true;
      }

      this.logger.warn(
        `User ${user.sub} not belongs to Environment ${environmentId}`,
      );
    }

    return false;
  }
}
