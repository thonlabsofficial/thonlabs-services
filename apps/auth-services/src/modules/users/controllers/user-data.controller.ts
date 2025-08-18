import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { exceptionsMapper, StatusCodes } from '@/utils/enums/errors-metadata';
import { ThonLabsOnly } from '@/auth/modules/shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { UserDataService } from '../services/user-data.service';
import { setUserDataValidator } from '../validators/user-data-validators';
import { UserDataKeys } from '../constants/user-data';

@Controller('users/:userId/data')
@ThonLabsOnly()
@HasEnvAccess({ param: 'userId' })
export class UserDataController {
  constructor(private userDataService: UserDataService) {}

  /**
   * Get all user data for a specific user.
   *
   * @param userId - The ID of the user
   * @param query - The query parameters
   * @param query.keys - Specific keys to fetch
   */
  @Get('/')
  async fetch(
    @Param('userId') userId: string,
    @Query() query: { keys: UserDataKeys[] },
  ) {
    const defaultKeys = [UserDataKeys.SubscriptionType];

    return this.userDataService.fetch(userId, query?.keys || defaultKeys);
  }

  /**
   * Get a specific user data by id.
   *
   * @param userId - The ID of the user
   * @param key - The key of the data
   */
  @Get('/:key')
  async getById(
    @Param('userId') userId: string,
    @Param('key') key: UserDataKeys,
  ) {
    const data = await this.userDataService.get(userId, key);

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data.data;
  }

  /**
   * Upsert a specific user data.
   *
   * @param userId - The ID of the user
   * @param payload - The payload of the data
   */
  @Post('/')
  @SchemaValidator(setUserDataValidator)
  async upsert(
    @Param('userId') userId: string,
    @Body() payload,
    @Query() query: { encrypt: boolean },
    @Res() res,
  ) {
    const { data: exists } = await this.userDataService.get(
      userId,
      payload.key,
    );

    const data = await this.userDataService.upsert(
      userId,
      payload,
      query.encrypt,
    );

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    if (exists) {
      return res.status(StatusCodes.OK).send('');
    }

    return res.status(StatusCodes.Created).send('');
  }
}
