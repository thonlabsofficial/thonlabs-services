import { Module } from '@nestjs/common';
import { EmailTemplateService } from './services/email-template.service';
import { SharedModule } from '../shared/shared.module';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';

@Module({
  imports: [SharedModule],
  providers: [EmailTemplateService, EmailService],
  exports: [EmailTemplateService, EmailService],
  controllers: [EmailController],
})
export class EmailModule {}
