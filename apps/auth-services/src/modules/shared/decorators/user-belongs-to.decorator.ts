import {
  ErrorCodes,
  ErrorMessages,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnvironmentService } from '../../environments/services/environment.service';
import decodeSession from '@/utils/services/decode-session';

type ValidatorTypes = 'environment';

const DECORATOR_KEY = 'userBelongsTo';

export const UserBelongsTo = (type: ValidatorTypes) =>
  SetMetadata(DECORATOR_KEY, { type });

@Injectable()
export class UserBelongsToGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private environmentService: EnvironmentService,
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

    if (!session.environmentId) {
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    if (decoratorProps.type === 'environment') {
      const userBelongsTo = await this.environmentService.userBelongsTo(
        session.sub,
        session.environmentId,
      );

      return userBelongsTo;
    }

    res.status(StatusCodes.Unauthorized).json({
      code: ErrorCodes.Unauthorized,
      error: ErrorMessages.Unauthorized,
    });
    return false;
  }
}
