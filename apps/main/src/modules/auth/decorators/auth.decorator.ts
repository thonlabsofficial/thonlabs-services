import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import extractTokenFromHeader from '@/utils/services/extract-token-from-header';
import { AuthService } from '../services/auth.service';
import { ErrorMessages } from '@/utils/enums/errors-metadata';
import { StatusCodes } from '@/utils/enums/errors-metadata';

export const NEED_AUTH_VALIDATION = 'needAuthValidation';

export const NeedsAuth = () => SetMetadata(NEED_AUTH_VALIDATION, true);

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const needAuthValidation = this.reflector.get<boolean>(
      NEED_AUTH_VALIDATION,
      context.getHandler(),
    );

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!needAuthValidation) {
      return true;
    }

    const token = extractTokenFromHeader(req);

    try {
      const data = await this.authService.getUserBySessionToken(token);

      if (data.statusCode) {
        res.status(data.statusCode).json({
          error: data.error,
        });
        return false;
      }

      if (!data.data.thonLabsUser) {
        this.logger.log(`User ${data.data.id} is not a Thon Labs user`);
        res.status(StatusCodes.Unauthorized).json({
          error: ErrorMessages.Unauthorized,
        });
        return false;
      }

      req['session'] = data.data;

      return true;
    } catch (e) {
      this.logger.error('Invalid Token', e);
      throw new UnauthorizedException();
    }
  }
}
