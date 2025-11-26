import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { EmailTemplateService } from '@/auth/modules/emails/services/email-template.service';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import {
  UpdateTemplateEnabledStatusPayload,
  updateTemplateEnabledStatusValidator,
  updateTemplateValidator,
} from '../validators/email-template-validators';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';
import { NeedsInternalKey } from '../../shared/decorators/needs-internal-key.decorator';
import { NeedsAuth } from '@/auth/modules/auth/decorators/auth.decorator';

@Controller('email-templates')
export class EmailTemplateController {
  constructor(private emailTemplateService: EmailTemplateService) {}

  @Patch('/:id')
  @NeedsAuth()
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
  @NeedsAuth()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async fetchTemplates(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const data = await this.emailTemplateService.fetch(environmentId);

    return data?.data;
  }

  @Get('/:id')
  @NeedsAuth()
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
  @NeedsAuth()
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
