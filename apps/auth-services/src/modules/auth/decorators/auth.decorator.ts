import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import extractTokenFromHeader from '@/utils/services/extract-token-from-header';
import Crypt from '@/utils/services/crypt';
import { UserService } from '../../users/services/user.service';
import decodeSession from '@/utils/services/decode-session';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';

export const AUTH_VALIDATION_DISABLED = 'authValidationDisabled';

export const PublicRoute = () => SetMetadata(AUTH_VALIDATION_DISABLED, true);

export const ByPassAuthGuard = (context: ExecutionContext) =>
  Reflect.defineMetadata(AUTH_VALIDATION_DISABLED, true, context.getHandler());

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private userService: UserService,
  ) {}

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

    const session = decodeSession(req);

    if (!session) {
      this.logger.log('Token not found');
      res.status(StatusCodes.Unauthorized).json({
        error: ErrorMessages.Unauthorized,
      });
      return false;
    }

    try {
      if (!session.sub) {
        this.logger.error(`Sub not found`);
        res.status(StatusCodes.Unauthorized).json({
          error: ErrorMessages.Unauthorized,
        });
        return false;
      }

      const user = await this.userService.getById(session.sub);

      if (!user) {
        this.logger.error(`user not found`);
        res.status(StatusCodes.Unauthorized).json({
          error: ErrorMessages.Unauthorized,
        });
        return false;
      }

      if (!user.active) {
        this.logger.error(`User ${user.id} is not active`);
        res.status(StatusCodes.Unauthorized).json({
          error: ErrorMessages.Unauthorized,
        });
        return false;
      }

      const authKey = await Crypt.decrypt(
        user.authKey,
        Crypt.generateIV(user.id),
        process.env.ENCODE_AUTH_KEYS_SECRET,
      );
      const token = extractTokenFromHeader(req);

      await this.jwtService.verifyAsync(token, {
        secret: `${authKey}${process.env.AUTHENTICATION_SECRET}`,
      });

      req['session'] = user;

      return true;
    } catch (e) {
      this.logger.error('Invalid Token', e);
      throw new UnauthorizedException();
    }
  }
}
