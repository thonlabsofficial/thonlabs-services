import { Module } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class SharedModule {}
