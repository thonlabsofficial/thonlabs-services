import { Module, forwardRef } from '@nestjs/common';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import { SharedModule } from '@/auth/modules/shared/shared.module';
import { ProjectModule } from '@/auth/modules/projects/project.module';
import { EnvironmentController } from './controllers/environment.controller';
import { EmailModule } from '@/auth/modules/emails/email.module';
import { EnvironmentScheduler } from '@/auth/modules/environments/services/environment.scheduler';
import { EnvironmentDomainController } from '@/auth/modules/environments/controllers/environment-domain.controller';
import { EnvironmentDomainService } from '@/auth/modules/environments/services/environment-domain.service';
import { EnvironmentHelper } from '@/auth/modules/environments/services/environment.helper';

@Module({
  providers: [
    EnvironmentService,
    EnvironmentDomainService,
    EnvironmentScheduler,
    EnvironmentHelper,
  ],
  exports: [EnvironmentService, EnvironmentDomainService, EnvironmentHelper],
  imports: [SharedModule, forwardRef(() => ProjectModule), EmailModule],
  controllers: [EnvironmentController, EnvironmentDomainController],
})
export class EnvironmentModule {}
