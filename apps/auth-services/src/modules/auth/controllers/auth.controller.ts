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
import { signUpValidator } from '@/auth/modules/auth/validators/signup-validators';
import { UserService } from '@/auth/modules/users/services/user.service';
import { ProjectService } from '@/auth/modules/projects/services/project.service';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import {
  ErrorMessages,
  StatusCodes,
  exceptionsMapper,
} from '@/utils/enums/errors-metadata';
import {
  authenticateFromMagicLinkValidator,
  loginValidator,
  reauthenticateFromRefreshTokenValidator,
} from '../validators/login-validators';
import { AuthService } from '@/auth/modules/auth/services/auth.service';
import { EmailService } from '@/auth/modules/emails/services/email.service';
import { TokenStorageService } from '@/auth/modules/token-storage/services/token-storage.service';
import { EmailTemplates, TokenTypes } from '@prisma/client';
import { NeedsPublicKey } from '@/auth/modules/shared/decorators/needs-public-key.decorator';
import decodeSession from '@/utils/services/decode-session';
import { requestResetPasswordValidator } from '../validators/reset-password-validators';
import { getFirstName } from '@/utils/services/names-helpers';

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
      appURL: 'https://thonlabs.io',
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

    const { data: user, ...userError } = await this.userService.create({
      ...payload,
      environmentId: environment.id,
    });

    if (userError.error) {
      throw new exceptionsMapper[userError.statusCode](userError.error);
    }

    const {
      data: { token },
      ...tokenError
    } = await this.tokenStorageService.create({
      relationId: user.id,
      type: payload.password ? TokenTypes.ConfirmEmail : TokenTypes.MagicLogin,
      expiresIn: payload.password ? '1d' : '30m',
    });

    if (tokenError.error) {
      throw new exceptionsMapper[tokenError.statusCode](tokenError.error);
    }

    const { data: project } = await this.projectService.getByEnvironmentId(
      environment.id,
    );

    const emailData = {
      token,
      appName: project.appName,
      appURL: environment.appURL,
      userFirstName: getFirstName(user.fullName),
    };

    if (payload.password) {
      // No need wait email send after signup
      this.emailService.send({
        to: user.email,
        emailTemplateType: EmailTemplates.ConfirmEmail,
        environmentId: environment.id,
        data: emailData,
      });
    } else {
      // Wait the email sending
      await this.emailService.send({
        to: user.email,
        emailTemplateType: EmailTemplates.MagicLink,
        environmentId: environment.id,
        data: emailData,
      });
    }

    return user;
  }

  @Post('/login')
  @PublicRoute()
  @HttpCode(StatusCodes.OK)
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

    if (payload.password) {
      const result = await this.authService.authenticateFromEmailAndPassword(
        payload.email,
        payload.password,
        environment.id,
      );

      if (result?.error) {
        throw new exceptionsMapper[result.statusCode](result.error);
      }

      return result.data;
    } else {
      const result = await this.authService.loginOrCreateFromMagicLink({
        email: payload.email,
        environment,
      });

      if (result?.error) {
        throw new exceptionsMapper[result.statusCode](result.error);
      }
    }
  }

  @PublicRoute()
  @NeedsPublicKey()
  @Post('/magic/:token')
  @SchemaValidator(authenticateFromMagicLinkValidator, ['params'])
  public async authenticateFromMagicLink(
    @Param('token') token: string,
    @Req() req,
  ) {
    const { data: environment, ...envError } =
      await this.environmentService.getByPublicKeyFromRequest(req);

    if (envError?.error) {
      throw new exceptionsMapper[envError.statusCode](envError.error);
    }

    const data = await this.authService.authenticateFromMagicLink({
      token,
      environmentId: environment.id,
    });

    if (data?.error) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data;
  }

  @PublicRoute()
  @Post('/refresh')
  @SchemaValidator(reauthenticateFromRefreshTokenValidator)
  public async reAuthenticateFromRefreshToken(
    @Body('token') token: string,
    @Req() req,
  ) {
    if (!req.headers.authorization) {
      throw new UnauthorizedException(ErrorMessages.Unauthorized);
    }

    const { environmentId } = decodeSession(req);

    const { data: environment, ...envError } =
      await this.environmentService.getById(environmentId);

    if (envError?.error) {
      throw new exceptionsMapper[envError.statusCode](envError.error);
    }

    const data = await this.authService.reAuthenticateFromRefreshToken({
      token,
      environmentId: environment.id,
    });

    return data;
  }

  @Post('/logout')
  @HttpCode(StatusCodes.OK)
  public async logout(@Req() req) {
    const { sub: userId, environmentId } = decodeSession(req);

    const { data: environment, ...envError } =
      await this.environmentService.getById(environmentId);

    if (envError?.error) {
      throw new exceptionsMapper[envError.statusCode](envError.error);
    }

    const data = await this.authService.logout({
      userId,
      environmentId: environment.id,
    });

    return data;
  }

  @PublicRoute()
  @Post('/reset-password')
  @SchemaValidator(requestResetPasswordValidator)
  public async requestResetPassword(@Req() req, @Body() payload) {
    const { data: environment } =
      await this.environmentService.getByPublicKeyFromRequest(req);

    if (!environment) {
      throw new UnauthorizedException(ErrorMessages.Unauthorized);
    }

    const user = await this.userService.getByEmail(
      payload.email,
      environment.id,
    );

    if (!user) {
      throw new exceptionsMapper[StatusCodes.NotFound](
        ErrorMessages.UserNotFound,
      );
    }

    await this.tokenStorageService.deleteMany(
      TokenTypes.ResetPassword,
      user.id,
    );

    const token = await this.tokenStorageService.create({
      expiresIn: '30m',
      relationId: user.id,
      type: TokenTypes.ResetPassword,
    });

    if (token.error) {
      throw new exceptionsMapper[token.statusCode](token.error);
    }

    await this.emailService.send({
      emailTemplateType: EmailTemplates.ForgotPassword,
      environmentId: environment.id,
      to: user.email,
      data: {
        userFirstName: getFirstName(user.fullName),
        appURL: environment.appURL,
        appName: environment.project.appName,
        token: token.data.token,
      },
    });
  }
}
