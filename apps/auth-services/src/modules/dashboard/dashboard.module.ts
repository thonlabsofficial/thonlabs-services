import { Module } from '@nestjs/common';
import { DashboardController } from '@/auth/modules/dashboard/controllers/dashboard.controller';
import { SharedModule } from '@/auth/modules/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [],
  exports: [],
  controllers: [DashboardController],
})
export class DashboardModule {}
