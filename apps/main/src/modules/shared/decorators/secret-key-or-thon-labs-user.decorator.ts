import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import extractTokenFromHeader from '@/utils/services/extract-token-from-header';
import { AuthService } from '@/auth/modules/auth/services/auth.service';

const SECRET_KEY_OR_THON_LABS_ONLY_KEY = 'SecretKeyOrThonLabsOnly';

export const SecretKeyOrThonLabsOnly = () =>
  SetMetadata(SECRET_KEY_OR_THON_LABS_ONLY_KEY, true);

@Injectable()
export class SecretKeyOrThonLabsOnlyGuard implements CanActivate {
  private readonly logger = new Logger(SecretKeyOrThonLabsOnlyGuard.name);

  constructor(
    private reflector: Reflector,
    private environmentService: EnvironmentService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(
      SECRET_KEY_OR_THON_LABS_ONLY_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    try {
      // First validates the secret key - if exists
      if (req.headers['tl-secret-key'] && req.headers['tl-env-id']) {
        const { data: environment } =
          await this.environmentService.getBySecretKey(
            req.headers['tl-env-id'],
            req.headers['tl-secret-key'],
          );

        if (!environment) {
          this.logger.error(
            `Environment ${req.headers['tl-env-id']} not found for secret key`,
          );
          res.status(StatusCodes.Unauthorized).json({
            error: ErrorMessages.Unauthorized,
          });
          return false;
        }

        return true;
      } else {
        const token = extractTokenFromHeader(req);

        // User has session, validates the token and thon labs user
        if (token) {
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
        }
      }

      this.logger.error(
        `No session, environment id or secret was found on request`,
      );

      res.status(StatusCodes.Unauthorized).json({
        error: ErrorMessages.Unauthorized,
      });

      return false;
    } catch (e) {
      this.logger.log('Invalid Token');

      res.status(StatusCodes.Unauthorized).json({
        error: ErrorMessages.Unauthorized,
      });

      return false;
    }
  }
}
