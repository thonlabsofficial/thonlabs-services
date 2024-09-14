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

const NEEDS_PUBLIC_KEY_VALIDATOR_KEY = 'needsPublicKey';

export const NeedsPublicKey = () =>
  SetMetadata(NEEDS_PUBLIC_KEY_VALIDATOR_KEY, true);

@Injectable()
export class NeedsPublicKeyGuard implements CanActivate {
  private readonly logger = new Logger(NeedsPublicKeyGuard.name);

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
      this.logger.error('Missing public key or environment id');
      res.status(StatusCodes.Unauthorized).json({
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    const session = decodeSession(req);

    const { data: environment } = await this.environmentService.getByPublicKey(
      req.headers['tl-env-id'],
      req.headers['tl-public-key'],
      session?.sub,
    );

    if (!environment) {
      this.logger.error(`Invalid environment ${req.headers['tl-env-id']}`);
      res.status(StatusCodes.Unauthorized).json({
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    return true;
  }
}
