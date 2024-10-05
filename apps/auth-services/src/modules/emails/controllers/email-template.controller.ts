import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { EmailTemplateService } from '@/auth/modules/emails/services/email-template.service';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import {
  UpdateTemplateEnabledStatusPayload,
  updateTemplateEnabledStatusValidator,
  updateTemplateValidator,
} from '../validators/email-template-validators';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';
import { NeedsInternalKey } from '../../shared/decorators/needs-internal-key.decorator';

@Controller('email-templates')
export class EmailTemplateController {
  constructor(private emailTemplateService: EmailTemplateService) {}

  @Put('/:id')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(updateTemplateValidator)
  async updateTemplate(@Req() req, @Param('id') id: string, @Body() payload) {
    const environmentId = req.headers['tl-env-id'];

    const result = await this.emailTemplateService.updateTemplate(
      id,
      environmentId,
      payload,
    );

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  @Post('')
  @NeedsInternalKey()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async createDefaultTemplates(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const result =
      await this.emailTemplateService.createDefaultTemplates(environmentId);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }

  @Get('')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async fetchTemplates(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const data = await this.emailTemplateService.fetch(environmentId);

    return data?.data;
  }

  @Get('/:id')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async getTemplateById(@Req() req, @Param('id') id: string) {
    const environmentId = req.headers['tl-env-id'];

    const emailTemplate = await this.emailTemplateService.getById(
      id,
      environmentId,
    );

    return emailTemplate;
  }

  @Patch('/:id/status')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(updateTemplateEnabledStatusValidator)
  async updateTemplateEnabledStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() payload: UpdateTemplateEnabledStatusPayload,
  ) {
    const environmentId = req.headers['tl-env-id'];

    const result = await this.emailTemplateService.updateEnabledStatus(
      id,
      environmentId,
      payload.enabled,
    );

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }
}
