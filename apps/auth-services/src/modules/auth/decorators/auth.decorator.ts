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

export const AUTH_VALIDATION_DISABLED = 'authValidationDisabled';

export const PublicRoute = () => SetMetadata(AUTH_VALIDATION_DISABLED, true);

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  static enableAuthGuard(context: ExecutionContext) {
    Reflect.defineMetadata(
      AUTH_VALIDATION_DISABLED,
      false,
      context.getHandler(),
    );
  }

  static disableAuthGuard(context: ExecutionContext) {
    Reflect.defineMetadata(
      AUTH_VALIDATION_DISABLED,
      true,
      context.getHandler(),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authValidationDisabled = this.reflector.get<boolean>(
      AUTH_VALIDATION_DISABLED,
      context.getHandler(),
    );

    if (authValidationDisabled) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    try {
      const token = extractTokenFromHeader(req);
      const data = await this.authService.getUserBySessionToken(token);

      if (data.statusCode) {
        res.status(data.statusCode).json({
          error: data.error,
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
