import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvironmentService } from '../services/environment.service';
import { EmailTemplateService } from '../../emails/services/email-template.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { StatusCodes, exceptionsMapper } from '@/utils/enums/errors-metadata';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import { UserBelongsTo } from '../../shared/decorators/user-belongs-to.decorator';
import { SchemaValidator } from '../../shared/decorators/schema-validator.decorator';
import {
  createEnvironmentValidator,
  updateTokenSettingsValidator,
} from '../validators/environment-validators';

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

  @Get('/:id')
  @ThonLabsOnly()
  @UserBelongsTo('environment')
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
  @UserBelongsTo('environment')
  async getSecretKey(@Param('id') id: string) {
    const secretKey = await this.environmentService.getSecretKey(id);

    return { secretKey };
  }

  @Patch('/:id/secret')
  @ThonLabsOnly()
  @UserBelongsTo('environment')
  async updateSecretKey(@Param('id') id: string) {
    const key = await this.environmentService.updateSecretKey(id);

    return { key };
  }

  @Patch('/:id/public')
  @ThonLabsOnly()
  @UserBelongsTo('environment')
  async updatePublicKey(@Param('id') id: string) {
    const key = await this.environmentService.updatePublicKey(id);

    return { key };
  }

  @Post('/')
  @ThonLabsOnly()
  @SchemaValidator(createEnvironmentValidator)
  async create(@Body() payload) {
    const environment = await this.environmentService.create(payload);

    return {
      id: environment.data.id,
      name: environment.data.name,
      appURL: environment.data.appURL,
    };
  }

  @Patch('/:id/token-settings')
  @ThonLabsOnly()
  @UserBelongsTo('environment')
  @SchemaValidator(updateTokenSettingsValidator)
  async updateTokenSettings(@Param('id') id: string, @Body() payload) {
    const result = await this.environmentService.updateTokenSettings(
      id,
      payload,
    );

    if (result?.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }
}
