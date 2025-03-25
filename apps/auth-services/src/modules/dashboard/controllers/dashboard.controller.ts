import { Controller, Get, Req } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { startOfDay, subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ThonLabsOnly } from '@/auth/modules/shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private databaseService: DatabaseService) {}

  @Get('/summary')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async getSummary(@Req() request: Request) {
    const environmentId = request.headers['tl-env-id'];

    const totalActiveUsersQuery = this.databaseService.user.count({
      where: {
        environmentId,
        active: true,
      },
    });

    const today = new Date();

    console.log(subDays(toZonedTime(startOfDay(today), 'UTC'), 30));
    const monthlyActiveUsersQuery = this.databaseService.user.count({
      where: {
        environmentId,
        active: true,
        lastSignIn: {
          gte: subDays(toZonedTime(startOfDay(today), 'UTC'), 30),
        },
      },
    });

    const currentMonthSignUpsQuery = this.databaseService.user.count({
      where: {
        environmentId,
        createdAt: {
          gte: toZonedTime(
            startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
            'UTC',
          ),
          lt: toZonedTime(
            startOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
            'UTC',
          ),
        },
      },
    });

    const totalActiveOrganizationsQuery =
      this.databaseService.organization.count({
        where: {
          environmentId,
          active: true,
        },
      });

    const [
      totalActiveUsers,
      monthlyActiveUsers,
      currentMonthSignUps,
      totalActiveOrganizations,
    ] = await Promise.all([
      totalActiveUsersQuery,
      monthlyActiveUsersQuery,
      currentMonthSignUpsQuery,
      totalActiveOrganizationsQuery,
    ]);

    return {
      totalActiveUsers,
      monthlyActiveUsers,
      currentMonthSignUps,
      totalActiveOrganizations,
    };
  }
}
