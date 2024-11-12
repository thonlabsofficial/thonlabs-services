import { Module, forwardRef } from '@nestjs/common';
import { EmailTemplateService } from './services/email-template.service';
import { SharedModule } from '../shared/shared.module';
import { EmailService } from './services/email.service';
import { EmailTemplateController } from './controllers/email-template.controller';
import { EnvironmentModule } from '../environments/environment.module';
import { AudienceService } from '@/auth/modules/emails/services/audience.service';
import { EmailDomainService } from '@/auth/modules/emails/services/email-domain.service';
import { EmailDomainController } from '@/auth/modules/emails/controllers/email-domain.controller';
import { EmailDomainScheduler } from '@/auth/modules/emails/services/email-domain.scheduler';
@Module({
  imports: [SharedModule, forwardRef(() => EnvironmentModule)],
  providers: [
    EmailTemplateService,
    EmailService,
    AudienceService,
    EmailDomainService,
    EmailDomainScheduler,
  ],
  exports: [
    EmailTemplateService,
    EmailService,
    AudienceService,
    EmailDomainService,
  ],
  controllers: [EmailTemplateController, EmailDomainController],
})
export class EmailModule {}
