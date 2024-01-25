import { Module } from '@nestjs/common';
import { TokenStorageService } from './services/token-storage.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [TokenStorageService],
  exports: [TokenStorageService],
})
export class TokenStorageModule {}
