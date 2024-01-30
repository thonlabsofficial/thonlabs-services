import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { PublicRoute } from '../../auth/decorators/auth-validation.decorator';
import { EnvironmentService } from '../services/environment.service';
import { EmailTemplateService } from '../../emails/services/email-template.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';

@Controller('environments')
export class EnvironmentController {
  constructor(
    private environmentService: EnvironmentService,
    private emailTemplateService: EmailTemplateService,
  ) {}

  @Get('/owner/my-keys')
  @PublicRoute()
  public async signUpOwner(@Headers() headers) {
    if (headers['thon-labs-staff-api-key'] !== process.env.API_KEY) {
      throw new UnauthorizedException();
    }

    const environmentId = 'env-production-pv58lzlj6te';
    const [publicKey, secretKey] = await Promise.all([
      this.environmentService.getPublicKey(environmentId),
      this.environmentService.getSecretKey(environmentId),
    ]);

    return { publicKey, secretKey };
  }

  @Post('/:id/create-templates')
  @PublicRoute()
  async createDefaultTemplates(
    @Param('id') environmentId: string,
    @Headers() headers,
  ) {
    if (headers['thon-labs-staff-api-key'] !== process.env.API_KEY) {
      throw new UnauthorizedException();
    }

    const result =
      await this.emailTemplateService.createDefaultTemplates(environmentId);

    if ((result as DataReturn)?.error) {
      throw new exceptionsMapper[(result as DataReturn).statusCode](
        (result as DataReturn).error,
      );
    }
  }
}
