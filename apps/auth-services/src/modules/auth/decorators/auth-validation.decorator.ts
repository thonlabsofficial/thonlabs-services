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

export const AUTH_VALIDATION_DISABLED = 'authValidationDisabled';

export const PublicRoute = () => SetMetadata(AUTH_VALIDATION_DISABLED, true);

@Injectable()
export class AuthValidationGuard implements CanActivate {
  private readonly logger = new Logger(AuthValidationGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authValidationDisabled = this.reflector.getAllAndOverride<boolean>(
      AUTH_VALIDATION_DISABLED,
      [context.getHandler(), context.getClass()],
    );

    if (authValidationDisabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);

    if (!token) {
      this.logger.log('Token not exists');
      throw new UnauthorizedException();
    }

    try {
      const jwtData = this.jwtService.decode(token);

      if (!jwtData?.environmentId || !jwtData?.environmentKey) {
        this.logger.log('Invalid JWT Data');
        throw new UnauthorizedException();
      }

      const authKey = await Crypt.decrypt(
        jwtData.environmentKey,
        Crypt.generateIV(jwtData.environmentId),
        process.env.ENCODE_AUTH_KEYS_SECRET,
      );
      const payload = await this.jwtService.verifyAsync(token, {
        secret: `${authKey}${process.env.AUTHENTICATION_SECRET}`,
      });

      request['authUser'] = {
        userId: payload.sub,
      };
    } catch {
      this.logger.log('Invalid Token');
      throw new UnauthorizedException();
    }
    return true;
  }
}
