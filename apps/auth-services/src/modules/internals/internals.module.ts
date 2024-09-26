import { Module } from '@nestjs/common';
import { InternalController } from './controllers/internal.controller';
import { SharedModule } from '../shared/shared.module';
import { EnvironmentModule } from '../environments/environment.module';
import { EmailModule } from '../emails/email.module';
import { UserModule } from '../users/user.module';
import { ProjectModule } from '../projects/project.module';

@Module({
  controllers: [InternalController],
  imports: [
    SharedModule,
    EnvironmentModule,
    EmailModule,
    UserModule,
    ProjectModule,
  ],
})
export class InternalsModule {}
