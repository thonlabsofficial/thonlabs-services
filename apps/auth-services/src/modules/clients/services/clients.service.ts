import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private databaseService: DatabaseService) {}

  async getByEmail(email: string) {
    const data = await this.databaseService.client.findUnique({
      where: { email },
    });

    return data;
  }

  async getById(id: string) {
    const [user, userSubscription] = await Promise.all([
      this.databaseService.user.findUnique({
        where: { id },
      }),
      this.databaseService.clientSubscription.findFirst({
        where: {
          clientId: id,
          active: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return { ...user, subscriptionType: userSubscription?.subscriptionType };
  }

  async userExists(id: string) {
    const userCount = await this.databaseService.user.count({
      where: { id },
    });

    return userCount > 0;
  }
}
