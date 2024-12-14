import { Module } from '@nestjs/common';
import { OrganizationService } from './services/organization.service';
import { OrganizationController } from './controllers/organization.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [OrganizationService],
  exports: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
