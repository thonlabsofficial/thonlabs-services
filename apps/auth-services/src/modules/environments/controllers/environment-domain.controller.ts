import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { EnvironmentDomainService } from '@/auth/modules/environments/services/environment-domain.service';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { ThonLabsOnly } from '@/auth/modules/shared/decorators/thon-labs-only.decorator';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';
import { setEnvironmentDomainValidator } from '@/auth/modules/environments/validators/environment-domain-validators';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';

@Controller('environments/:envId/domains')
export class EnvironmentDomainController {
  constructor(private environmentDomainService: EnvironmentDomainService) {}

  @Patch('/')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  @SchemaValidator(setEnvironmentDomainValidator)
  async create(@Param('envId') envId: string, @Body() payload) {
    const result = await this.environmentDomainService.setCustomDomain(
      envId,
      payload.customDomain,
    );

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }

  @Delete('/')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  async delete(@Param('envId') envId: string) {
    const result =
      await this.environmentDomainService.excludeCustomDomain(envId);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }

  @Post('/verify')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  async verify(@Param('envId') envId: string) {
    const result =
      await this.environmentDomainService.verifyCustomDomain(envId);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result.data;
  }
}
