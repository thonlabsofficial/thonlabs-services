import { Module } from '@nestjs/common';
import { AuthController } from '@/auth/modules/auth/controllers/auth.controller';
import { AuthService } from '@/auth/modules/auth/services/auth.service';
import { ClientsModule } from '@/auth/modules/clients/clients.module';
import { SharedModule } from '@/auth/modules/shared/shared.module';

@Module({
  imports: [SharedModule, ClientsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
