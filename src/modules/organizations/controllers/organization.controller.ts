import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import {
  NewOrganizationFormData,
  newOrganizationSchema,
  UpdateOrganizationFormData,
  updateOrganizationSchema,
  UpdateOrganizationStatusData,
  updateOrganizationStatusValidator,
} from '../validators/organization-validators';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import {
  ErrorMessages,
  exceptionsMapper,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { DatabaseService } from '../../shared/database/database.service';
import { MetadataValueService } from '@/auth/modules/metadata/services/metadata-value.service';
import { Organization } from '@prisma/client';
import { SafeParseError } from 'zod';
import { logoValidator } from '../../shared/validators/custom-validators';
import { PublicKeyOrThonLabsOnly } from '../../shared/decorators/public-key-or-thon-labs-user.decorator';
import { SecretKeyOrThonLabsOnly } from '../../shared/decorators/secret-key-or-thon-labs-user.decorator';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private organizationService: OrganizationService,
    private databaseService: DatabaseService,
    private metadataValueService: MetadataValueService,
  ) {}

  @Post('')
  @SecretKeyOrThonLabsOnly()
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
  @SecretKeyOrThonLabsOnly()
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
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const validator = logoValidator.safeParse({ file });

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
  @PublicKeyOrThonLabsOnly()
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

    // Get metadata for all organizations in batch
    const organizationIds = items.map((item) => item.id);
    const metadataByOrg = await this.metadataValueService.getMetadataByContext(
      organizationIds,
      'Organization',
    );

    return {
      items: items.map((item) => {
        const metadata = metadataByOrg[item.id] || {};

        return {
          ...item,
          logo: item.logo
            ? this.organizationService.getLogoUrl(item as Organization)
            : null,
          metadata,
        };
      }),
    };
  }

  @Get('/:id')
  @PublicKeyOrThonLabsOnly()
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

    // Get organization metadata
    const metadataResult = await this.metadataValueService.getMetadataByContext(
      [id],
      'Organization',
    );
    const metadata = metadataResult[id] || {};

    return {
      ...data,
      metadata,
    };
  }

  @Delete('/:id')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async delete(@Param('id') id: string) {
    const result = await this.organizationService.delete(id);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  @Delete('/:id/logo')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async deleteLogo(@Param('id') id: string) {
    const result = await this.organizationService.deleteLogo(id);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  @Patch('/:id/status')
  @SecretKeyOrThonLabsOnly()
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

  @Get('/:id/users')
  @PublicKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async getUsers(
    @Req() req,
    @Param('id') id: string,
    @Query('active') active: string = 'false',
  ) {
    const environmentId = req.headers['tl-env-id'];

    const envOrganization =
      await this.organizationService.validateEnvOrganizationById(
        environmentId,
        id,
      );

    if (envOrganization?.statusCode) {
      throw new exceptionsMapper[envOrganization.statusCode]();
    }

    const result = await this.organizationService.getUsers(id, {
      active: active === 'true',
    });

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return { items: result?.data };
  }
}
