import { Module, forwardRef } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { ProjectController } from './controllers/project.controller';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../users/user.module';
import { EnvironmentModule } from '../environments/environment.module';

@Module({
  imports: [
    SharedModule,
    forwardRef(() => UserModule),
    forwardRef(() => EnvironmentModule),
  ],
  providers: [ProjectService],
  exports: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule {}
