import { Module, forwardRef } from '@nestjs/common';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import { SharedModule } from '@/auth/modules/shared/shared.module';
import { ProjectModule } from '../projects/project.module';

@Module({
  providers: [EnvironmentService],
  exports: [EnvironmentService],
  imports: [SharedModule, forwardRef(() => ProjectModule)],
})
export class EnvironmentModule {}
