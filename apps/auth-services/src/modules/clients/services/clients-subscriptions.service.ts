
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ClientsSubscriptionsService {
  private readonly logger = new Logger(ClientsSubscriptionsService.name);

  constructor(private databaseService: DatabaseService) {}
}
