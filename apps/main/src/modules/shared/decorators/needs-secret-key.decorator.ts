import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnvironmentService } from '../../environments/services/environment.service';

const NEEDS_SECRET_KEY_VALIDATOR_KEY = 'needsSecretKey';

export const NeedsSecretKey = () =>
  SetMetadata(NEEDS_SECRET_KEY_VALIDATOR_KEY, true);

@Injectable()
export class NeedsSecretKeyGuard implements CanActivate {
  private readonly logger = new Logger(NeedsSecretKeyGuard.name);

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
      this.logger.error('Missing secret key or environment id');
      res.status(StatusCodes.Unauthorized).json({
        statusCode: StatusCodes.Unauthorized,
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
        statusCode: StatusCodes.Unauthorized,
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    return true;
  }
}
