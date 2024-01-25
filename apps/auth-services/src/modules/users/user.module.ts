import { Module, forwardRef } from '@nestjs/common';
import { UserService } from '@/auth/modules/users/services/user.service';
import { SharedModule } from '@/auth/modules/shared/shared.module';
import { UserController } from './controllers/user.controller';
import { EnvironmentModule } from '../environments/environment.module';

@Module({
  imports: [SharedModule, forwardRef(() => EnvironmentModule)],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
