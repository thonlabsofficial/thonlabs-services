import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import {
  NewOrganizationFormData,
  newOrganizationSchema,
  UpdateOrganizationFormData,
  updateOrganizationLogoSchema,
  updateOrganizationSchema,
  UpdateOrganizationStatusData,
  updateOrganizationStatusValidator,
} from '../validators/organization-validators';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import {
  ErrorMessages,
  exceptionsMapper,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { DatabaseService } from '../../shared/database/database.service';
import { Organization } from '@prisma/client';
import { SafeParseError } from 'zod';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private organizationService: OrganizationService,
    private databaseService: DatabaseService,
  ) {}

  @Post('')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(newOrganizationSchema)
  async createOrganization(@Body() data: NewOrganizationFormData, @Req() req) {
    const environmentId = req.headers['tl-env-id'];
    const result = await this.organizationService.create(environmentId, data);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  @Patch('/:id')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(updateOrganizationSchema)
  async updateOrganization(
    @Param('id') id: string,
    @Body() data: UpdateOrganizationFormData,
    @Req() req,
  ) {
    const environmentId = req.headers['tl-env-id'];
    const result = await this.organizationService.update(
      id,
      environmentId,
      data,
    );

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  @Patch('/:id/logo')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const validator = updateOrganizationLogoSchema.safeParse({ file });

    if (!validator.success) {
      throw new exceptionsMapper[StatusCodes.BadRequest](
        (
          validator as SafeParseError<{ file: Express.Multer.File }>
        ).error.issues[0].message,
      );
    }

    return this.organizationService.updateLogo(id, file);
  }

  @Get('')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async fetch(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const items = await this.databaseService.organization.findMany({
      where: {
        environmentId,
      },
      select: {
        id: true,
        name: true,
        domains: true,
        logo: true,
        updatedAt: true,
        createdAt: true,
        environmentId: true,
        active: true,
      },
    });

    return {
      items: items.map((item) => ({
        ...item,
        logo: item.logo
          ? this.organizationService.getLogoUrl(item as Organization)
          : null,
      })),
    };
  }

  @Get('/:id')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async getById(@Param('id') id: string) {
    const data = await this.databaseService.organization.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
        domains: true,
        createdAt: true,
        updatedAt: true,
        environmentId: true,
        active: true,
        users: {
          select: {
            active: true,
            createdAt: true,
            email: true,
            fullName: true,
            id: true,
            lastSignIn: true,
            profilePicture: true,
            updatedAt: true,
            environmentId: true,
            emailConfirmed: true,
            invitedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      throw new exceptionsMapper[StatusCodes.NotFound](
        ErrorMessages.OrganizationNotFound,
      );
    }

    if (data?.logo) {
      data.logo = this.organizationService.getLogoUrl(
        data as unknown as Organization,
      );
    }

    return data;
  }

  @Delete('/:id')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async delete(@Param('id') id: string) {
    const result = await this.organizationService.delete(id);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  @Delete('/:id/logo')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async deleteLogo(@Param('id') id: string) {
    const result = await this.organizationService.deleteLogo(id);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  @Patch('/:id/status')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(updateOrganizationStatusValidator)
  async toggleActive(
    @Param('id') id: string,
    @Body() payload: UpdateOrganizationStatusData,
  ) {
    const result = await this.organizationService.updateStatus(
      id,
      payload.active,
    );

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return {
      id: result?.data?.id,
      active: result?.data?.active,
    };
  }
}
