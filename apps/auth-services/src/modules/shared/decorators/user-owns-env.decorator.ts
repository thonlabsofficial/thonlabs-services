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

const DECORATOR_KEY = 'UserOwnsEnv';

export const UserOwnsEnv = (param: string = 'id') =>
  SetMetadata(DECORATOR_KEY, { param });

@Injectable()
export class UserOwnsEnvGuard implements CanActivate {
  private readonly logger = new Logger(UserOwnsEnvGuard.name);

  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const decoratorProps = this.reflector.get(
      DECORATOR_KEY,
      context.getHandler(),
    );

    if (!decoratorProps) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const session = decodeSession(req);

    const envFromParam = req?.params?.[decoratorProps?.param];

    if (!envFromParam) {
      this.logger.error(`Environment parameter is missing`);
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    const userOwnsEnvironment = await this.userService.ownsEnvironment(
      session.sub,
      envFromParam,
    );

    if (!userOwnsEnvironment) {
      this.logger.error(
        `User ${session.sub} not allowed for Environment ${envFromParam}`,
      );
    }

    return userOwnsEnvironment;
  }
}
