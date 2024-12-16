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
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import {
  createUserValidator,
  updateStatusValidator,
  updateUserGeneralDataValidator,
} from '../validators/user-validators';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { PublicKeyOrThonLabsOnly } from '../../shared/decorators/public-key-or-thon-labs-user.decorator';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

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
      invitedAt: sendInvite === 'true' ? new Date() : null,
      organizationId: payload.organizationId,
    });

    if (data.error) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    const newUser = data.data;

    if (sendInvite === 'true') {
      await this.userService.sendInvitation(
        session.id,
        newUser.id,
        environmentId,
      );
    }

    delete newUser.authKey;
    delete newUser.thonLabsUser;

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

  @Patch('/:id/status')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(updateStatusValidator)
  async updateActive(@Req() req, @Param('id') id: string, @Body() payload) {
    const session = req.session;
    if (id === session?.id) {
      throw new exceptionsMapper[StatusCodes.Forbidden](
        ErrorMessages.CannotChangeOwnStatus,
      );
    }

    const environmentId = req.headers['tl-env-id'];

    const data = await this.userService.updateStatus(
      id,
      environmentId,
      payload.active,
    );

    return {
      id: data?.data?.id,
      fullName: data?.data?.fullName,
      environmentId: data?.data?.environmentId,
      active: data?.data?.active,
    };
  }

  @Delete('/:id')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async delete(@Req() req, @Param('id') id: string) {
    const session = req.session;
    if (id === session?.id) {
      throw new exceptionsMapper[StatusCodes.Forbidden](
        ErrorMessages.CannotDeleteOwnUser,
      );
    }

    const environmentId = req.headers['tl-env-id'];

    const data = await this.userService.exclude(id, environmentId);

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return {
      id: data?.data?.id,
      fullName: data?.data?.fullName,
      environmentId: data?.data?.environmentId,
    };
  }

  @Post(':userId/resend-invitation')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async resendInvitation(@Param('userId') userId: string, @Req() req) {
    const session = req.session;
    const environmentId = req.headers['tl-env-id'];

    const data = await this.userService.sendInvitation(
      session.id,
      userId,
      environmentId,
    );

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data?.data;
  }

  @Post(':userId/resend-confirmation-email')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async resendConfirmationEmail(@Param('userId') userId: string, @Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const data = await this.userService.sendConfirmationEmail(
      userId,
      environmentId,
    );

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data?.data;
  }

  @Patch(':userId/set-as-thon-labs-user')
  @ThonLabsOnly()
  // TODO: update decorator to use ROLES
  async setAsThonLabsUser(@Param('userId') userId: string) {
    await this.userService.setAsThonLabsUser(userId);
  }
}
