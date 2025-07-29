import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
  Get,
  Patch,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { PublicRoute } from '@/auth/modules/auth/decorators/auth.decorator';
import { signUpValidator } from '@/auth/modules/auth/validators/signup-validators';
import { UserService } from '@/auth/modules/users/services/user.service';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import {
  ErrorMessages,
  StatusCodes,
  exceptionsMapper,
} from '@/utils/enums/errors-metadata';
import {
  authenticateFromMagicLinkValidator,
  loginSSOValidator,
  LoginSSOValidator,
  loginValidator,
  reauthenticateFromRefreshTokenValidator,
} from '../validators/login-validators';
import { AuthService } from '@/auth/modules/auth/services/auth.service';
import { TokenStorageService } from '@/auth/modules/token-storage/services/token-storage.service';
import {
  AuthProviders,
  EmailTemplates,
  Environment,
  TokenTypes,
  User,
} from '@prisma/client';
import { NeedsPublicKey } from '@/auth/modules/shared/decorators/needs-public-key.decorator';
import decodeSession from '@/utils/services/decode-session';
import {
  newPasswordValidator,
  requestResetPasswordValidator,
} from '../validators/reset-password-validators';
import { getFirstName } from '@/utils/services/names-helpers';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { PublicKeyOrThonLabsOnly } from '@/auth/modules/shared/decorators/public-key-or-thon-labs-user.decorator';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import { OrganizationService } from '@/auth/modules/organizations/services/organization.service';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { EmailTemplateService } from '@/auth/modules/emails/services/email-template.service';
@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private userService: UserService,
    private databaseService: DatabaseService,
    private environmentService: EnvironmentService,
    private environmentDataService: EnvironmentDataService,
    private authService: AuthService,
    private tokenStorageService: TokenStorageService,
    private organizationService: OrganizationService,
    private emailTemplateService: EmailTemplateService,
  ) {}

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

    const { data: enableSignUp } = await this.environmentDataService.get(
      environment.id,
      'enableSignUp',
    );

    if (!enableSignUp) {
      throw new exceptionsMapper[StatusCodes.Forbidden](
        ErrorMessages.Forbidden,
      );
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
      expiresIn: payload.password ? '5h' : '30m',
      environmentId: environment.id,
    });

    if (tokenError.error) {
      throw new exceptionsMapper[tokenError.statusCode](tokenError.error);
    }

    const emailData = {
      token,
      userFirstName: getFirstName(user.fullName),
    };

    if (payload.password) {
      const { data: tokens } = await this.tokenStorageService.createAuthTokens(
        user,
        environment as Environment,
      );

      await Promise.all([
        this.emailTemplateService.send({
          userId: user.id,
          to: user.email,
          emailTemplateType: EmailTemplates.ConfirmEmail,
          environmentId: environment.id,
          data: emailData,
        }),
        this.emailTemplateService.sendWelcomeEmail(user, environment.id),
        this.userService.updateLastLogin(user.id, environment.id),
      ]);

      return tokens;
    } else {
      await Promise.all([
        this.emailTemplateService.send({
          userId: user.id,
          to: user.email,
          emailTemplateType: EmailTemplates.MagicLink,
          environmentId: environment.id,
          data: emailData,
        }),
        this.emailTemplateService.sendWelcomeEmail(user, environment.id),
      ]);

      return {
        emailSent: true,
      };
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

    const { data: enableSignUpB2BOnly } = await this.environmentDataService.get(
      environment.id,
      'enableSignUpB2BOnly',
    );
    if (enableSignUpB2BOnly) {
      const { data: isValidUserOrganization } =
        await this.organizationService.isValidUserOrganization(
          environment.id,
          payload.email,
        );

      if (!isValidUserOrganization) {
        this.logger.error(
          `No organization domain found for email ${payload.email} in environment ${environment.id}`,
        );
        throw new exceptionsMapper[StatusCodes.NotAcceptable](
          ErrorMessages.InvalidEmail,
        );
      }
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
      const result = await this.authService.sendMagicLink({
        email: payload.email,
        environment,
      });

      if (result?.error) {
        throw new exceptionsMapper[result.statusCode](result.error);
      }

      return {
        emailSent: true,
      };
    } else {
      throw new exceptionsMapper[StatusCodes.Unauthorized](
        ErrorMessages.InvalidCredentials,
      );
    }
  }

  @Post('/login/sso/:provider')
  @PublicRoute()
  @HttpCode(StatusCodes.OK)
  @NeedsPublicKey()
  @SchemaValidator(loginSSOValidator)
  async loginSSO(
    @Param('provider') provider: string,
    @Body() payload: LoginSSOValidator,
    @Req() req,
  ) {
    const environmentId = req.headers['tl-env-id'];
    let ssoUser;

    if (provider === 'google') {
      const { data, ...rest } = await this.authService.getGoogleUser(
        payload.token,
        environmentId,
      );

      if (rest.error) {
        throw new exceptionsMapper[rest.statusCode](rest.error);
      }

      ssoUser = data;
    }

    let user = (await this.userService.getByEmail(
      ssoUser.email,
      environmentId,
    )) as User;

    if (!user) {
      const { data: isAnySignUpMethodEnabled } =
        await this.authService.isAnySignUpMethodEnabled(environmentId);

      if (!isAnySignUpMethodEnabled) {
        throw new exceptionsMapper[StatusCodes.Forbidden](
          ErrorMessages.Forbidden,
        );
      }

      const { data: newUser, ...userError } = await this.userService.create({
        ...ssoUser,
        environmentId,
      });
      user = newUser;

      if (userError.error) {
        throw new exceptionsMapper[userError.statusCode](userError.error);
      }

      const {
        data: { token },
        ...tokenError
      } = await this.tokenStorageService.create({
        relationId: user.id,
        type: TokenTypes.ConfirmEmail,
        expiresIn: '5h',
        environmentId,
      });

      if (tokenError.error) {
        throw new exceptionsMapper[tokenError.statusCode](tokenError.error);
      }

      await Promise.all([
        this.emailTemplateService.send({
          userId: user.id,
          to: user.email,
          emailTemplateType: EmailTemplates.ConfirmEmail,
          environmentId,
          data: {
            token,
            userFirstName: getFirstName(user.fullName),
          },
        }),
        this.emailTemplateService.sendWelcomeEmail(user, environmentId),
      ]);
    } else {
      if (!user.profilePicture) {
        await this.databaseService.user.update({
          where: { id: user.id },
          data: {
            profilePicture: ssoUser.profilePicture,
          },
        });
      }
    }

    const { data: environment } =
      await this.environmentService.getById(environmentId);
    const [{ data: tokens }] = await Promise.all([
      this.tokenStorageService.createAuthTokens(
        user,
        environment as Environment,
      ),
      this.userService.updateLastLogin(user.id, environmentId),
    ]);

    return tokens;
  }

  @PublicRoute()
  @NeedsPublicKey()
  @Get('/magic/:token')
  @SchemaValidator(authenticateFromMagicLinkValidator, ['params'])
  public async authenticateFromMagicLink(@Param('token') token: string) {
    const data = await this.authService.authenticateFromMagicLink({
      token,
    });

    if (data?.error) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data?.data;
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

    if (!environment.refreshTokenExpiration) {
      throw new exceptionsMapper[StatusCodes.Unauthorized]();
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
  @PublicKeyOrThonLabsOnly()
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

    if (user?.organization?.id && !user?.organization?.active) {
      this.logger.error(`Organization ${user?.organization?.id} is not active`);
      throw new exceptionsMapper[StatusCodes.NotAcceptable](
        ErrorMessages.OrganizationNotFound,
      );
    }

    if (user && user.active) {
      await this.tokenStorageService.deleteMany(
        TokenTypes.ResetPassword,
        user.id,
      );

      const token = await this.tokenStorageService.create({
        expiresIn: '30m',
        relationId: user.id,
        type: TokenTypes.ResetPassword,
        environmentId: environment.id,
      });

      if (token.error) {
        throw new exceptionsMapper[token.statusCode](token.error);
      }

      await this.emailTemplateService.send({
        emailTemplateType: EmailTemplates.ForgotPassword,
        environmentId: environment.id,
        userId: user.id,
        to: user.email,
        data: {
          token: token.data.token,
        },
      });
    }
  }

  @PublicRoute()
  @NeedsPublicKey()
  @HttpCode(StatusCodes.OK)
  @Get('/reset-password/:token')
  public async validateTokenResetPassword(@Param('token') token: string) {
    const tokenValidation = await this.authService.validateUserTokenExpiration(
      token,
      TokenTypes.ResetPassword,
    );

    if (tokenValidation.statusCode) {
      throw new exceptionsMapper[tokenValidation.statusCode](
        tokenValidation.error,
      );
    }

    const isActiveUser = await this.userService.isActiveUser(
      tokenValidation.data.relationId,
      tokenValidation.data.environmentId,
    );

    if (!isActiveUser) {
      throw new exceptionsMapper[StatusCodes.NotAcceptable](
        ErrorMessages.InvalidUser,
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

    if (tokenValidation?.statusCode) {
      throw new exceptionsMapper[tokenValidation.statusCode](
        tokenValidation.error,
      );
    }

    const [, updatePassword] = await Promise.all([
      this.tokenStorageService.delete(token),
      this.userService.updatePassword(
        tokenValidation.data.relationId,
        environment.id,
        payload.password,
      ),
    ]);

    if (updatePassword?.statusCode) {
      throw new exceptionsMapper[updatePassword.statusCode](
        updatePassword.error,
      );
    }
  }

  @PublicRoute()
  @NeedsPublicKey()
  @HttpCode(StatusCodes.OK)
  @Get('/confirm-email/:token')
  public async confirmEmail(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    let tokenValidation = await this.authService.validateUserTokenExpiration(
      token,
      TokenTypes.ConfirmEmail,
    );

    if (tokenValidation?.statusCode === StatusCodes.NotFound) {
      tokenValidation = await this.authService.validateUserTokenExpiration(
        token,
        TokenTypes.InviteUser,
      );
    }

    /*
      If not found both types of token above, then returns the status code.

      If token is expired but has relationId, then resend the confirmation email.
      The initial request is not valid, but it's like a retry to make sure the user will
      validate his email.
    */
    if (tokenValidation?.statusCode) {
      if (
        tokenValidation?.data?.type === TokenTypes.ConfirmEmail &&
        tokenValidation?.data?.relationId
      ) {
        const emailSent = await this.userService.sendConfirmationEmail(
          tokenValidation.data.relationId,
          tokenValidation.data.environmentId,
        );

        await this.tokenStorageService.delete(token);

        if (emailSent.data) {
          throw new exceptionsMapper[StatusCodes.NotAcceptable]({
            statusCode: StatusCodes.NotAcceptable,
            emailResent: true,
          });
        }
      }

      throw new exceptionsMapper[tokenValidation.statusCode](
        tokenValidation.error,
      );
    }

    const userId = tokenValidation.data.relationId;
    const environmentId = tokenValidation.data.environmentId;

    const updateEmailConfirmation =
      await this.userService.updateEmailConfirmation(userId, environmentId);

    await this.tokenStorageService.delete(token);

    if (updateEmailConfirmation?.statusCode) {
      throw new exceptionsMapper[updateEmailConfirmation.statusCode](
        updateEmailConfirmation.error,
      );
    }

    /*
      In case of invitation, after confirm the email the user
      needs to set a password or login using magic link.

      It's not necessary to check the email, the code is automatically forward to the
      frontend app.
    */
    const user = await this.userService.getById(userId);
    const { data: environment } =
      await this.environmentService.getById(environmentId);

    if (
      tokenValidation.data.type === TokenTypes.InviteUser &&
      !user.lastSignIn
    ) {
      if (environment.authProvider === AuthProviders.EmailAndPassword) {
        const resetPasswordToken =
          await this.authService.generateResetPasswordToken(
            user.id,
            environmentId,
          );

        if (resetPasswordToken?.statusCode) {
          throw new exceptionsMapper[resetPasswordToken.statusCode](
            resetPasswordToken.error,
          );
        }

        return res.status(StatusCodes.OK).json({
          tokenType: TokenTypes.ResetPassword,
          token: resetPasswordToken?.data?.token,
          email: user.email,
        });
      } else if (environment.authProvider === AuthProviders.MagicLogin) {
        const magicLoginToken = await this.authService.generateMagicLoginToken(
          user.id,
          environmentId,
        );

        if (magicLoginToken?.statusCode) {
          throw new exceptionsMapper[magicLoginToken.statusCode](
            magicLoginToken.error,
          );
        }

        return res.status(StatusCodes.OK).json({
          tokenType: TokenTypes.MagicLogin,
          token: magicLoginToken?.data?.token,
        });
      }

      this.logger.error(
        'Error on generating reset password or magic login token.',
      );
      throw new exceptionsMapper[StatusCodes.Internal](
        ErrorMessages.InternalError,
      );
    }

    return res.status(StatusCodes.OK).json({});
  }
}
