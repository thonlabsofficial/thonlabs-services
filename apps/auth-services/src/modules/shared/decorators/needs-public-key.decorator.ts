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

const NEEDS_PUBLIC_KEY_VALIDATOR_KEY = 'needsPublicKey';

export const NeedsPublicKey = () =>
  SetMetadata(NEEDS_PUBLIC_KEY_VALIDATOR_KEY, true);

@Injectable()
export class NeedsPublicKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private environmentService: EnvironmentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const needsPublicKey = this.reflector.get(
      NEEDS_PUBLIC_KEY_VALIDATOR_KEY,
      context.getHandler(),
    );

    if (!needsPublicKey) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req.headers['tl-public-key'] || !req.headers['tl-env-id']) {
      res.status(StatusCodes.Unauthorized).json({
        code: ErrorCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    const { data: environment } = await this.environmentService.getByPublicKey(
      req.headers['tl-env-id'],
      req.headers['tl-public-key'],
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
