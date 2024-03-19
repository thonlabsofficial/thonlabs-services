import { Module, forwardRef } from '@nestjs/common';
import { EmailTemplateService } from './services/email-template.service';
import { SharedModule } from '../shared/shared.module';
import { EmailService } from './services/email.service';
import { EmailTemplateController } from './controllers/email-template.controller';
import { EnvironmentModule } from '../environments/environment.module';

@Module({
  imports: [SharedModule, forwardRef(() => EnvironmentModule)],
  providers: [EmailTemplateService, EmailService],
  exports: [EmailTemplateService, EmailService],
  controllers: [EmailTemplateController],
})
export class EmailModule {}
