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

const THON_LABS_ONLY_VALIDATOR_KEY = 'thonLabsOnly';

export const ThonLabsOnly = () =>
  SetMetadata(THON_LABS_ONLY_VALIDATOR_KEY, true);

@Injectable()
export class ThonLabsOnlyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private environmentService: EnvironmentService,
  ) {}

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
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    return true;
  }
}
