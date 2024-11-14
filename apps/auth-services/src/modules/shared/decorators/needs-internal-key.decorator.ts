import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const NEEDS_INTERNAL_KEY_VALIDATOR_KEY = 'needsInternalKey';

export const NeedsInternalKey = () =>
  SetMetadata(NEEDS_INTERNAL_KEY_VALIDATOR_KEY, true);

@Injectable()
export class NeedsInternalKeyGuard implements CanActivate {
  private readonly logger = new Logger(NeedsInternalKeyGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const needsInternalKey = this.reflector.get(
      NEEDS_INTERNAL_KEY_VALIDATOR_KEY,
      context.getHandler(),
    );

    if (!needsInternalKey) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req.headers['tl-int-key']) {
      this.logger.error('Missing internal key');
      res.status(StatusCodes.Unauthorized).json({
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    if (req.headers['tl-int-key'] !== process.env.TL_INTERNAL_API_KEY) {
      this.logger.error('Invalid internal key');
      res.status(StatusCodes.Unauthorized).json({
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    return true;
  }
}
