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
import { EnvironmentService } from '../../environments/services/environment.service';

export const AUTH_VALIDATION_DISABLED = 'authValidationDisabled';

export const PublicRoute = () => SetMetadata(AUTH_VALIDATION_DISABLED, true);

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private environmentService: EnvironmentService,
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

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (authValidationDisabled) {
      return true;
    }

    const token = extractTokenFromHeader(req);

    /*
      if has some of the key headers we're considering it's an external API request
      that requires public or secret key.
      
      To keep things safe and avoid bypassing the auth guard 
      we need to validate the public or secret key.
    */
    if (req.headers['tl-env-id'] && !token) {
      if (req.headers['tl-public-key']) {
        const publicKey = await this.environmentService.getByPublicKey(
          req.headers['tl-env-id'],
          req.headers['tl-public-key'],
        );

        if (publicKey?.error) {
          this.logger.error('Invalid public key');
          throw new UnauthorizedException();
        }

        return true;
      }

      if (req.headers['tl-secret-key']) {
        const secretKey = await this.environmentService.getBySecretKey(
          req.headers['tl-env-id'],
          req.headers['tl-secret-key'],
        );

        if (secretKey?.error) {
          this.logger.error('Invalid secret key');
          throw new UnauthorizedException();
        }

        return true;
      }
    }

    try {
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
