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

const THON_LABS_ONLY_VALIDATOR_KEY = 'thonLabsOnly';

export const ThonLabsOnly = () =>
  SetMetadata(THON_LABS_ONLY_VALIDATOR_KEY, true);

@Injectable()
export class ThonLabsOnlyGuard implements CanActivate {
  private readonly logger = new Logger(ThonLabsOnlyGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const thonLabsOnly = this.reflector.get(
      THON_LABS_ONLY_VALIDATOR_KEY,
      context.getHandler(),
    );

    if (!thonLabsOnly) {
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
