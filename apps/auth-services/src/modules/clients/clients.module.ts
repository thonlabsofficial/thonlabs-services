import { Module } from '@nestjs/common';
import { ClientsService } from '@/auth/modules/clients/services/clients.service';
import { SharedModule } from '@/auth/modules/shared/shared.module';

@Module({
  imports: [SharedModule],
  exports: [ClientsService],
  providers: [ClientsService],
})
export class ClientsModule {}
