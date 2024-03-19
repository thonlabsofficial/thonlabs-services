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
import { EnvironmentService } from '../../environments/services/environment.service';
import decodeSession from '@/utils/services/decode-session';

const DECORATOR_KEY = 'roles';

export const Roles = (...roles) => SetMetadata(DECORATOR_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private environmentService: EnvironmentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const decoratorValue = this.reflector.get(
      DECORATOR_KEY,
      context.getHandler(),
    );

    if (!decoratorValue) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const session = decodeSession(req);

    if (!session.thonLabsUser) {
      this.logger.log(`User ${session.sub} is not a Thon Labs user`);
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    return true;
  }
}
