import { Controller } from '@nestjs/common';
import { EmailTemplateService } from '../services/email-template.service';

@Controller('emails')
export class EmailController {
  constructor(private emailTemplateService: EmailTemplateService) {}
}
