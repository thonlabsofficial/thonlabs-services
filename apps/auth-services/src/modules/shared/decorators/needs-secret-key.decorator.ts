import {
  ErrorCodes,
  ErrorMessages,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import extractTokenFromHeader from '@/utils/services/extract-token-from-header';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnvironmentService } from '../../environments/services/environment.service';

const NEEDS_SECRET_KEY_VALIDATOR_KEY = 'needsSecretKey';

export const NeedsSecretKey = () =>
  SetMetadata(NEEDS_SECRET_KEY_VALIDATOR_KEY, true);

@Injectable()
export class NeedsSecretKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private environmentService: EnvironmentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    if (!req.headers['tl-secret-key'] || !req.headers['tl-env-id']) {
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    const { data: environment } = await this.environmentService.getBySecretKey(
      req.headers['tl-env-id'],
      req.headers['tl-secret-key'],
    );

    if (!environment) {
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    return true;
  }
}
