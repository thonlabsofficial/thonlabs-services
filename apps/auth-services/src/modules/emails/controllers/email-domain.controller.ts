import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '../../shared/decorators/has-env-access.decorator';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import { EmailDomainService } from '../services/email-domain.service';
import {
  setEmailTemplateDomainValidator,
  SetEmailTemplateDomainPayload,
} from '../validators/email-domain-validators';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';

@Controller('emails/domains')
export class EmailDomainController {
  constructor(private emailDomainService: EmailDomainService) {}

  @Post('/')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(setEmailTemplateDomainValidator)
  async setDomain(@Req() req, @Body() payload: SetEmailTemplateDomainPayload) {
    const environmentId = req.headers['tl-env-id'];

    const data = await this.emailDomainService.setDomain(
      environmentId,
      payload.domain,
    );

    if (data?.error) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }
  }

  @Get('/')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async getDomain(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const data = await this.emailDomainService.getDomain(environmentId);

    if (data?.error) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data?.data;
  }

  @Delete('/')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async deleteDomain(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    await this.emailDomainService.deleteDomain(environmentId);
  }

  @Post('/verify')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async verifyDomain(@Req() req) {
    const environmentId = req.headers['tl-env-id'];

    const data = await this.emailDomainService.verifyDomain(environmentId);

    if (data?.error) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data?.data;
  }
}
