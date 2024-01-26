import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { PublicRoute } from '@/auth/modules/auth/decorators/auth-validation.decorator';
import { signUpValidator } from '../validators/signup-validators';
import { UserService } from '@/auth/modules/users/services/user.service';
import { ProjectService } from '@/auth/modules/projects/services/project.service';
import { EnvironmentService } from '../../environments/services/environment.service';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import {
  authenticateFromMagicLinkValidator,
  loginValidator,
  reauthenticateFromRefreshTokenValidator,
} from '../validators/login-validators';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../../emails/services/email.service';
import { TokenStorageService } from '../../token-storage/services/token-storage.service';
import { EmailTemplates, TokenTypes } from '@prisma/client';
import { NeedsPublicKey } from '../../shared/decorators/needs-public-key.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private emailService: EmailService,
    private tokenStorageService: TokenStorageService,
  ) {}

  @Post('/signup/owner')
  @PublicRoute()
  public async signUpOwner(
    @Body() payload: { password: string; environmentId: string },
    @Headers() headers,
  ) {
    if (headers['thon-labs-staff-api-key'] !== process.env.API_KEY) {
      throw new UnauthorizedException();
    }

    const { data: user } = await this.userService.createOwner({
      password: payload.password,
    });

    const {
      data: { project, environment },
    } = await this.projectService.create({
      appName: 'Thon Labs',
      userId: user.id,
      isThonLabs: true,
    });

    await this.userService.setEnvironment(user.id, environment.id);

    return { user, project, environment };
  }

  @PublicRoute()
  @Post('/signup')
  @NeedsPublicKey()
  @SchemaValidator(signUpValidator)
  public async signUp(@Body() payload, @Req() req) {
    const { data: environment } =
      await this.environmentService.getByPublicKeyFromRequest(req);

    if (!environment) {
      throw new UnauthorizedException(ErrorMessages.Unauthorized);
    }

    const { data: user } = await this.userService.create({
      ...payload,
      environmentId: environment.id,
    });

    const {
      data: { token },
    } = await this.tokenStorageService.create({
      relationId: user.id,
      type: payload.password ? TokenTypes.ConfirmEmail : TokenTypes.MagicLogin,
      expiresIn: payload.password ? '1d' : '30m',
    });

    if (payload.password) {
      // No need wait email send after signup
      this.emailService.send({
        to: user.email,
        emailTemplateType: EmailTemplates.ConfirmEmail,
        environmentId: environment.id,
        data: { token },
      });
    } else {
      // Wait the email sending
      await this.emailService.send({
        to: user.email,
        emailTemplateType: EmailTemplates.MagicLink,
        environmentId: environment.id,
        data: { token },
      });
    }

    return user;
  }

  @Post('/login')
  @PublicRoute()
  @HttpCode(200)
  @NeedsPublicKey()
  @SchemaValidator(loginValidator)
  async login(
    @Body() payload: { email: string; password?: string },
    @Req() req,
  ) {
    const { data: environment, ...envError } =
      await this.environmentService.getByPublicKeyFromRequest(req);

    if (envError.statusCode === StatusCodes.Unauthorized) {
      throw new UnauthorizedException(envError.error);
    }

    let token;
    let refreshToken;
    let userError;

    if (payload.password) {
      const result = await this.authService.authenticateFromEmailAndPassword(
        payload.email,
        payload.password,
        environment.id,
      );

      token = result.data.token;
      refreshToken = result.data.refreshToken;
      userError = result;
    } else {
      const result = await this.authService.loginOrCreateFromMagicLink({
        email: payload.email,
        environment,
      });

      token = result.data.token;
      refreshToken = result.data.refreshToken;
      userError = result;
    }

    if (userError.statusCode === StatusCodes.Unauthorized) {
      throw new UnauthorizedException(userError.message);
    }

    return {
      token,
      refreshToken,
    };
  }

  @PublicRoute()
  @Post('/magic/authenticate/:token')
  @SchemaValidator(authenticateFromMagicLinkValidator)
  public async authenticateFromMagicLink(@Param('token') token: string) {
    const data = await this.authService.authenticateFromMagicLink({ token });

    if (data.error) {
      throw new UnauthorizedException(data.error);
    }

    return data;
  }

  @PublicRoute()
  @Post('/refresh')
  @SchemaValidator(reauthenticateFromRefreshTokenValidator)
  public async reAuthenticateFromRefreshToken(@Body('token') token: string) {
    const data = await this.authService.reAuthenticateFromRefreshToken({
      token,
    });

    return data;
  }
}
