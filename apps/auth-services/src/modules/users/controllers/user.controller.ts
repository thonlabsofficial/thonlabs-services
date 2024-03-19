import {
  Body,
  Controller,
  Post,
  Query,
  Req,
  Patch,
  Param,
  HttpCode,
  Get,
  Delete,
} from '@nestjs/common';
import { UserService } from '@/auth/modules/users/services/user.service';
import { SecretKeyOrThonLabsOnly } from '@/auth/modules/shared/decorators/secret-key-or-thon-labs-user.decorator';
import {
  ErrorMessages,
  StatusCodes,
  exceptionsMapper,
} from '@/utils/enums/errors-metadata';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import { EmailService } from '@/auth/modules/emails/services/email.service';
import { EmailTemplates, TokenTypes } from '@prisma/client';
import { TokenStorageService } from '../../token-storage/services/token-storage.service';
import { getFirstName } from '@/utils/services/names-helpers';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import {
  createUserValidator,
  updateUserGeneralDataValidator,
} from '../validators/user-validators';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { PublicKeyOrThonLabsOnly } from '../../shared/decorators/public-key-or-thon-labs-user.decorator';

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
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(createUserValidator)
  async create(
    @Req() req,
    @Body() payload,
    @Query('sendInvite') sendInvite: string,
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

    if (sendInvite === 'true') {
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

  @Get('/')
  @PublicKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async fetch(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const items = await this.userService.fetch({
      environmentId,
    });

    return {
      items,
    };
  }

  @Get('/:id')
  @PublicKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async getById(@Req() req, @Param('id') id: string) {
    const environmentId = req.headers['tl-env-id'];

    const user = await this.userService.getDetailedById(id);

    if (user.environmentId !== environmentId) {
      throw new exceptionsMapper[StatusCodes.NotFound](
        ErrorMessages.UserNotFound,
      );
    }

    return user;
  }

  @Patch('/:id/general-data')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(updateUserGeneralDataValidator)
  async updateGeneralData(
    @Req() req,
    @Param('id') id: string,
    @Body() payload,
  ) {
    const environmentId = req.headers['tl-env-id'];

    const user = await this.userService.updateGeneralData(
      id,
      environmentId,
      payload,
    );

    return user;
  }

  @Delete('/:id')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async delete(@Req() req, @Param('id') id: string) {
    const environmentId = req.headers['tl-env-id'];

    await this.userService.deleteUser(id, environmentId);
  }

  @Patch(':userId/set-as-thon-labs-user')
  @ThonLabsOnly()
  // TODO: update decorator to use ROLES
  async setAsThonLabsUser(@Param('userId') userId: string) {
    await this.userService.setAsThonLabsUser(userId);
  }
}
