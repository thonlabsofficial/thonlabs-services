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

const NEEDS_SECRET_KEY_VALIDATOR_KEY = 'needsSecretKey';

export const NeedsSecretKey = () =>
  SetMetadata(NEEDS_SECRET_KEY_VALIDATOR_KEY, true);

@Injectable()
export class NeedsSecretKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const needsSecretKey = this.reflector.get(
      NEEDS_SECRET_KEY_VALIDATOR_KEY,
      context.getHandler(),
    );

    if (!needsSecretKey) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req.headers['thon-labs-secret-key']) {
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    return true;
  }
}
