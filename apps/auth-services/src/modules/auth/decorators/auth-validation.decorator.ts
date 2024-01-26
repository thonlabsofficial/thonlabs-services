import {
  CanActivate,
  ExecutionContext,
  Injectable,
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
      throw new UnauthorizedException();
    }

    try {
      const jwtData = this.jwtService.decode(token);

      if (!jwtData?.environmentId || !jwtData?.environmentKey) {
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
      throw new UnauthorizedException();
    }
    return true;
  }
}
