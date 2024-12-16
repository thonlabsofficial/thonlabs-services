import { Module, forwardRef } from '@nestjs/common';
import { UserService } from '@/auth/modules/users/services/user.service';
import { SharedModule } from '@/auth/modules/shared/shared.module';
import { UserController } from './controllers/user.controller';
import { EnvironmentModule } from '../environments/environment.module';
import { EmailModule } from '../emails/email.module';
import { TokenStorageModule } from '../token-storage/token-storage.module';
import { OrganizationModule } from '../organizations/organization.module';

@Module({
  imports: [
    SharedModule,
    forwardRef(() => EnvironmentModule),
    EmailModule,
    TokenStorageModule,
    OrganizationModule,
  ],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
