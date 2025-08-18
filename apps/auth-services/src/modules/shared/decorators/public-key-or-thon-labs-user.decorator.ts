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
import decodeSession from '@/utils/services/decode-session';
import { UserService } from '@/auth/modules/users/services/user.service';
import { AuthGuard } from '../../auth/decorators/auth.decorator';

const PUBLIC_KEY_OR_THON_LABS_ONLY_KEY = 'PublicKeyOrThonLabsOnly';

export const PublicKeyOrThonLabsOnly = () =>
  SetMetadata(PUBLIC_KEY_OR_THON_LABS_ONLY_KEY, true);

@Injectable()
export class PublicKeyOrThonLabsOnlyGuard implements CanActivate {
  private readonly logger = new Logger(PublicKeyOrThonLabsOnlyGuard.name);

  constructor(
    private reflector: Reflector,
    private environmentService: EnvironmentService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get(
      PUBLIC_KEY_OR_THON_LABS_ONLY_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    AuthGuard.enableAuthGuard(context);

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    try {
      // First validates the secret key - if exists
      if (req.headers['tl-public-key'] && req.headers['tl-env-id']) {
        const { data: environment } =
          await this.environmentService.getByPublicKey(
            req.headers['tl-env-id'],
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

        AuthGuard.disableAuthGuard(context);

        return true;
      } else {
        const session = decodeSession(req);

        // User has session, validates the token and thon labs user
        if (session) {
          if (!session.thonLabsUser) {
            this.logger.error(
              `User ${session.sub} is not a Thon Labs user (session)`,
            );
            res.status(StatusCodes.Unauthorized).json({
              error: ErrorMessages.Unauthorized,
            });
            return false;
          }

          const user = await this.userService.getById(session.sub);

          if (!user.thonLabsUser) {
            this.logger.error(
              `User ${session.sub} is not a Thon Labs user (db)`,
            );
            res.status(StatusCodes.Unauthorized).json({
              error: ErrorMessages.Unauthorized,
            });
            return false;
          }

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
      this.logger.log('Invalid Token');

      res.status(StatusCodes.Unauthorized).json({
        error: ErrorMessages.Unauthorized,
      });

      return false;
    }
  }
}
