import { Module } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { CronService } from '@/auth/modules/shared/cron.service';
import { CDNService } from '@/auth/modules/shared/services/cdn.service';
import { HTTPService } from '@/auth/modules/shared/services/http.service';

@Module({
  providers: [DatabaseService, CronService, CDNService, HTTPService],
  exports: [DatabaseService, CronService, CDNService, HTTPService],
})
export class SharedModule {}
