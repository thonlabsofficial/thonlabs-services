import { Body, Controller, Param, Put, Req } from '@nestjs/common';
import { EmailTemplateService } from '@/auth/modules/emails/services/email-template.service';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import { updateTemplateValidator } from '../validators/email-template-validators';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';

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
}
