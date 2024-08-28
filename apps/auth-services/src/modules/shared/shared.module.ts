import { Module } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { CronService } from '@/auth/modules/shared/cron.service';
@Module({
  providers: [DatabaseService, CronService],
  exports: [DatabaseService, CronService],
})
export class SharedModule {}
