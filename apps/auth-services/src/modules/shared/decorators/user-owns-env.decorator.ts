import {
  ErrorCodes,
  ErrorMessages,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
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

type UserOwnsEnvParams = {
  param?: string;
  source?: 'params' | 'headers';
};

const METADATA_KEY = 'UserOwnsEnv';

const defaultParams: UserOwnsEnvParams = {
  param: 'id',
  source: 'params',
};

export const UserOwnsEnv = (params: UserOwnsEnvParams = {}) =>
  SetMetadata(METADATA_KEY, { ...defaultParams, ...params });

@Injectable()
export class UserOwnsEnvGuard implements CanActivate {
  private readonly logger = new Logger(UserOwnsEnvGuard.name);

  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(METADATA_KEY, context.getHandler());

    if (!metadata) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const session = decodeSession(req);

    const { param, source } = metadata;
    const environmentId = req?.[source]?.[param];

    if (!environmentId) {
      this.logger.error(
        `Environment ID is missing, Param: ${param}, Source: ${source}`,
      );
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    const userOwnsEnvironment = await this.userService.ownsEnvironment(
      session.sub,
      environmentId,
    );

    if (!userOwnsEnvironment) {
      this.logger.error(
        `User ${session.sub} not allowed for Environment ${environmentId}`,
      );
    }

    return userOwnsEnvironment;
  }
}
