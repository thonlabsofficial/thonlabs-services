import { Module } from '@nestjs/common';
import { AuthController } from '@/auth/modules/auth/controllers/auth.controller';
import { AuthService } from '@/auth/modules/auth/services/auth.service';
import { SharedModule } from '@/auth/modules/shared/shared.module';
import { UserModule } from '../users/user.module';
import { EmailModule } from '../emails/email.module';
import { TokenStorageModule } from '../token-storage/token-storage.module';
import { ProjectModule } from '../projects/project.module';
import { EnvironmentModule } from '../environments/environment.module';

@Module({
  imports: [
    SharedModule,
    ProjectModule,
    EnvironmentModule,
    UserModule,
    EmailModule,
    TokenStorageModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
