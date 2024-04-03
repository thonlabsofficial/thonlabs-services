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
      res.status(StatusCodes.NotFound).json({
        error: ErrorMessages.EnvironmentNotFound,
      });
      return false;
    }

    let session = decodeSession(req);

    /* Special validation only for Refresh Token */
    if (!session && req.url === '/auth/refresh' && req?.body?.token) {
      const tokenData = await this.tokenStorageService.getByToken(
        req.body.token,
        TokenTypes.Refresh,
      );

      if (!tokenData?.relationId) {
        this.logger.error('Relation ID does not exists');
        return false;
      }

      const user = await this.userService.getByIdAndEnv(
        tokenData.relationId,
        environmentId,
      );

      if (!user) {
        this.logger.error(
          `User not found for Relation ID ${tokenData.relationId} (ENV: ${environmentId})`,
        );
        return false;
      }

      session = {
        sub: user.id,
        thonLabsUser: user.thonLabsUser,
      } as SessionData;
    }

    /*
      If is a Thon Labs user means the user should owns the environment
      e.g.: to manage directly on Thon Labs UI

      If is not a Thon Labs user means the user should belongs to environment
      and to use this approach the user should use a public or secret key
      e.g.: to consume the API directly on their UI
    */
    if (session.thonLabsUser) {
      const userOwnsEnvironment = await this.userService.ownsEnvironment(
        session.sub,
        environmentId,
      );

      if (!userOwnsEnvironment) {
        this.logger.error(
          `User ${session.sub} not owns the Environment ${environmentId}`,
        );
      }

      return userOwnsEnvironment;
    } else if (
      req['tl-env-id'] &&
      (req['tl-public-key'] || req['tl-secret-key'])
    ) {
      const userBelongsToEnvironment =
        await this.environmentService.userBelongsTo(session.sub, environmentId);

      if (!userBelongsToEnvironment) {
        this.logger.error(
          `User ${session.sub} not belongs to Environment ${environmentId}`,
        );
      }

      return userBelongsToEnvironment;
    }
  }
}
