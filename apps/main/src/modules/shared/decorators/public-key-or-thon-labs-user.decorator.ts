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
import { AuthService } from '@/auth/modules/auth/services/auth.service';
import extractTokenFromHeader from '@/utils/services/extract-token-from-header';

const PUBLIC_KEY_OR_THON_LABS_ONLY_KEY = 'PublicKeyOrThonLabsOnly';

export const PublicKeyOrThonLabsOnly = () =>
  SetMetadata(PUBLIC_KEY_OR_THON_LABS_ONLY_KEY, true);

@Injectable()
export class PublicKeyOrThonLabsOnlyGuard implements CanActivate {
  private readonly logger = new Logger(PublicKeyOrThonLabsOnlyGuard.name);

  constructor(
    private reflector: Reflector,
    private environmentService: EnvironmentService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(
      PUBLIC_KEY_OR_THON_LABS_ONLY_KEY,
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
      if (req.headers['tl-public-key'] && req.headers['tl-env-id']) {
        const { data: environment } =
          await this.environmentService.getByPublicKey(
            req.headers['tl-public-key'],
          );

        if (!environment) {
          this.logger.error(
            `Environment ${req.headers['tl-env-id']} not found for public key`,
          );
          res.status(StatusCodes.Unauthorized).json({
            error: ErrorMessages.Unauthorized,
          });
          return false;
        }

        return true;
      } else {
        const token = extractTokenFromHeader(req);

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
        `No session, environment id or public key was found on request`,
      );

      res.status(StatusCodes.Unauthorized).json({
        error: ErrorMessages.Unauthorized,
      });

      return false;
    } catch (e) {
      this.logger.log('Invalid Token', e);

      res.status(StatusCodes.Unauthorized).json({
        error: ErrorMessages.Unauthorized,
      });

      return false;
    }
  }
}
