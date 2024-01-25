import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EmailTemplateService } from '../services/email-template.service';
import { PublicRoute } from '../../auth/decorators/auth-validation.decorator';
import { DataReturn } from '@/utils/interfaces/data-return';

@Controller('emails')
export class EmailController {
  constructor(private emailTemplateService: EmailTemplateService) {}

  @Post('/create-templates')
  @PublicRoute()
  async createDefaultTemplates(@Headers() headers) {
    if (headers['thon-labs-staff-api-key'] !== process.env.API_KEY) {
      throw new UnauthorizedException();
    }

    const result = await this.emailTemplateService.createDefaultTemplates('');

    if ((result as DataReturn).error) {
      throw new InternalServerErrorException((result as DataReturn).error);
    }
  }
}
