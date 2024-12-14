import {
  Body,
  Controller,
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
  updateOrganizationLogoSchema,
} from '../validators/organization-validators';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { exceptionsMapper, StatusCodes } from '@/utils/enums/errors-metadata';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('organizations')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

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
        validator.error.errors[0].message,
      );
    }

    return this.organizationService.updateLogo(id, file);
  }

  @Get('')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async fetch(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const data = await this.organizationService.fetch(environmentId);

    return data?.data;
  }
}
