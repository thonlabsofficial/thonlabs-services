import {
  Body,
  Controller,
  Post,
  Query,
  Req,
  Patch,
  Param,
  HttpCode,
} from '@nestjs/common';
import { UserService } from '@/auth/modules/users/services/user.service';
import { SecretKeyOrThonLabsOnly } from '@/auth/modules/shared/decorators/secret-key-or-thon-labs-user.decorator';
import { StatusCodes, exceptionsMapper } from '@/utils/enums/errors-metadata';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import { EmailService } from '@/auth/modules/emails/services/email.service';
import { EmailTemplates, TokenTypes } from '@prisma/client';
import { TokenStorageService } from '../../token-storage/services/token-storage.service';
import { getFirstName } from '@/utils/services/names-helpers';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import { createUserValidator } from '../validators/user-validators';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { UserOwnsEnv } from '../../shared/decorators/user-owns-env.decorator';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private environmentService: EnvironmentService,
    private emailService: EmailService,
    private tokenStorageService: TokenStorageService,
  ) {}

  @Post('/')
  @HttpCode(StatusCodes.Created)
  @SecretKeyOrThonLabsOnly()
  @UserOwnsEnv({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(createUserValidator)
  async inviteUser(
    @Req() req,
    @Body() payload,
    @Query('sendInvite') sendInvite: boolean,
  ) {
    const session = req.session;
    const environmentId = req.headers['tl-env-id'];

    const data = await this.userService.create({
      fullName: payload.fullName,
      email: payload.email,
      environmentId,
    });

    if (data.error) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    const newUser = data.data;

    if (sendInvite) {
      const [environment, inviter, { data: tokenData }] = await Promise.all([
        this.environmentService.getDetailedById(environmentId),
        this.userService.getById(session.id),
        this.tokenStorageService.create({
          type: TokenTypes.InviteUser,
          expiresIn: '7d',
          relationId: newUser.id,
        }),
      ]);

      await this.emailService.send({
        to: payload.email,
        emailTemplateType: EmailTemplates.Invite,
        environmentId,
        data: {
          token: tokenData?.token,
          appName: environment.project.appName,
          appURL: environment.appURL,
          inviter,
          userFirstName: getFirstName(newUser.fullName),
        },
      });
    }

    return newUser;
  }

  @Patch(':userId/set-as-thon-labs-user')
  @ThonLabsOnly()
  // TODO: update decorator to use ROLES
  async setAsThonLabsUser(@Param('userId') userId: string) {
    await this.userService.setAsThonLabsUser(userId);
  }
}
