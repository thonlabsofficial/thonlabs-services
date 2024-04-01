import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  Headers,
  UnauthorizedException,
  Get,
  Patch,
} from '@nestjs/common';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { PublicRoute } from '@/auth/modules/auth/decorators/auth.decorator';
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
import {
  AuthProviders,
  EmailTemplates,
  Environment,
  TokenTypes,
} from '@prisma/client';
import { NeedsPublicKey } from '@/auth/modules/shared/decorators/needs-public-key.decorator';
import decodeSession from '@/utils/services/decode-session';
import {
  newPasswordValidator,
  requestResetPasswordValidator,
} from '../validators/reset-password-validators';
import { getFirstName } from '@/utils/services/names-helpers';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';

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
    if (
      headers['thon-labs-staff-api-key'] !== process.env.TL_INTERNAL_API_KEY
    ) {
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

    const [, , publicKey] = await Promise.all([
      this.userService.setEnvironment(user.id, environment.id),
      this.environmentService.updateAuthSettings(environment.id, {
        ...environment,
        authProvider: AuthProviders.EmailAndPassword,
      }),
      await this.environmentService.getPublicKey(environment.id),
    ]);

    return { user, project, ...{ ...environment, publicKey } };
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

      const { data: tokens } = await this.tokenStorageService.createAuthTokens(
        user,
        environment as Environment,
      );

      return tokens;
    } else {
      // Wait the email sending
      await this.emailService.send({
        to: user.email,
        emailTemplateType: EmailTemplates.MagicLink,
        environmentId: environment.id,
        data: emailData,
      });
    }
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

    if (
      environment.authProvider === AuthProviders.EmailAndPassword &&
      payload.password
    ) {
      const result = await this.authService.authenticateFromEmailAndPassword(
        payload.email,
        payload.password,
        environment.id,
      );

      if (result?.error) {
        throw new exceptionsMapper[result.statusCode](result.error);
      }

      return result.data;
    } else if (environment.authProvider === AuthProviders.MagicLogin) {
      const result = await this.authService.loginOrCreateFromMagicLink({
        email: payload.email,
        environment,
      });

      if (result?.error) {
        throw new exceptionsMapper[result.statusCode](result.error);
      }
    } else {
      throw new exceptionsMapper[StatusCodes.Unauthorized](
        ErrorMessages.InvalidCredentials,
      );
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
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(reauthenticateFromRefreshTokenValidator)
  public async reAuthenticateFromRefreshToken(
    @Body('token') token: string,
    @Req() req,
  ) {
    const environmentId = req.headers['tl-env-id'];

    const { data: environment, ...envError } =
      await this.environmentService.getById(environmentId);

    if (envError?.error) {
      throw new exceptionsMapper[envError.statusCode](envError.error);
    }

    const data = await this.authService.reAuthenticateFromRefreshToken({
      token,
      environmentId: environment.id,
    });

    if (data?.error) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data;
  }

  @Post('/logout')
  @HttpCode(StatusCodes.OK)
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  public async logout(@Req() req) {
    const { sub: userId } = decodeSession(req);
    const environmentId = req.headers['tl-env-id'];

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
  @NeedsPublicKey()
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

    if (user) {
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

  @PublicRoute()
  @NeedsPublicKey()
  @HttpCode(StatusCodes.OK)
  @Get('/reset-password/:token')
  public async validateTokenResetPassword(
    @Req() req,
    @Param('token') token: string,
  ) {
    const { data: environment } =
      await this.environmentService.getByPublicKeyFromRequest(req);

    if (!environment) {
      throw new UnauthorizedException(ErrorMessages.Unauthorized);
    }

    const tokenValidation = await this.authService.validateUserTokenExpiration(
      token,
      TokenTypes.ResetPassword,
    );

    if (tokenValidation.statusCode) {
      throw new exceptionsMapper[tokenValidation.statusCode](
        tokenValidation.error,
      );
    }
  }

  @PublicRoute()
  @HttpCode(StatusCodes.OK)
  @NeedsPublicKey()
  @Patch('/reset-password/:token')
  @SchemaValidator(newPasswordValidator)
  public async updateTokenResetPassword(
    @Req() req,
    @Param('token') token: string,
    @Body() payload,
  ) {
    const { data: environment } =
      await this.environmentService.getByPublicKeyFromRequest(req);

    if (!environment) {
      throw new UnauthorizedException(ErrorMessages.Unauthorized);
    }

    const tokenValidation = await this.authService.validateUserTokenExpiration(
      token,
      TokenTypes.ResetPassword,
    );

    if (tokenValidation.statusCode) {
      await this.tokenStorageService.delete(token);
      throw new exceptionsMapper[tokenValidation.statusCode](
        tokenValidation.error,
      );
    }

    await Promise.all([
      this.tokenStorageService.delete(token),
      this.userService.updatePassword(
        tokenValidation.data.relationId,
        environment.id,
        payload.password,
      ),
    ]);
  }

  @PublicRoute()
  @HttpCode(StatusCodes.OK)
  @NeedsPublicKey()
  @Get('/confirm-email/:token')
  public async confirmEmail(@Req() req, @Param('token') token: string) {
    const { data: environment } =
      await this.environmentService.getByPublicKeyFromRequest(req);

    if (!environment) {
      throw new UnauthorizedException(ErrorMessages.Unauthorized);
    }

    const tokenValidation = await this.authService.validateUserTokenExpiration(
      token,
      TokenTypes.ConfirmEmail,
    );

    if (tokenValidation.statusCode) {
      throw new exceptionsMapper[tokenValidation.statusCode](
        tokenValidation.error,
      );
    }

    await this.userService.updateEmailConfirmation(
      tokenValidation.data.relationId,
      environment.id,
    );

    await this.tokenStorageService.delete(token);
  }
}
