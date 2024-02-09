import {
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvironmentService } from '../services/environment.service';
import { EmailTemplateService } from '../../emails/services/email-template.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { StatusCodes, exceptionsMapper } from '@/utils/enums/errors-metadata';
import decodeSession from '@/utils/services/decode-session';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';

@Controller('environments')
export class EnvironmentController {
  constructor(
    private environmentService: EnvironmentService,
    private emailTemplateService: EmailTemplateService,
  ) {}

  @Get('/owner/my-keys')
  @ThonLabsOnly()
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
  @ThonLabsOnly()
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

  @Get('/')
  @ThonLabsOnly()
  async fetch(@Req() req) {
    const { sub } = decodeSession(req);

    const { data: environments } =
      await this.environmentService.fetchByUserId(sub);

    return {
      items: environments,
    };
  }

  @Get('/:id')
  @ThonLabsOnly()
  async getById(@Param('id') id: string) {
    const [{ data: environment }, publicKey] = await Promise.all([
      this.environmentService.getById(id),
      this.environmentService.getPublicKey(id),
    ]);

    if (!environment) {
      throw new exceptionsMapper[StatusCodes.NotFound]();
    }

    return { ...environment, publicKey };
  }

  @Get('/:id/secret')
  @ThonLabsOnly()
  async getSecretKey(@Req() req, @Param('id') id: string) {
    const secretKey = await this.environmentService.getSecretKey(id);

    return { secretKey };
  }

  @Patch('/:id/secret')
  @ThonLabsOnly()
  async updateSecretKey(@Req() req, @Param('id') id: string) {
    const key = await this.environmentService.updateSecretKey(id);

    return { key };
  }

  @Patch('/:id/public')
  @ThonLabsOnly()
  async updatePublicKey(@Req() req, @Param('id') id: string) {
    const key = await this.environmentService.updatePublicKey(id);

    return { key };
  }
}
