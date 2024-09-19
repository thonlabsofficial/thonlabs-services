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
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import { EnvironmentDataController } from '@/auth/modules/environments/controllers/environment-data.controller';

@Module({
  providers: [
    EnvironmentService,
    EnvironmentDomainService,
    EnvironmentScheduler,
    EnvironmentHelper,
    EnvironmentDataService,
  ],
  exports: [
    EnvironmentService,
    EnvironmentDomainService,
    EnvironmentHelper,
    EnvironmentDataService,
  ],
  imports: [SharedModule, forwardRef(() => ProjectModule), EmailModule],
  controllers: [
    EnvironmentController,
    EnvironmentDomainController,
    EnvironmentDataController,
  ],
})
export class EnvironmentModule {}
