import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { exceptionsMapper, StatusCodes } from '@/utils/enums/errors-metadata';
import { ThonLabsOnly } from '@/auth/modules/shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { UserDataService } from '../services/user-data.service';
import { setUserDataValidator } from '../validators/user-data-validators';
import { UserDataKeys } from '../constants/user-data';
import { PublicKeyOrThonLabsOnly } from '../../shared/decorators/public-key-or-thon-labs-user.decorator';
import { SecretKeyOrThonLabsOnly } from '../../shared/decorators/secret-key-or-thon-labs-user.decorator';

@Controller('users/:userId/data')
export class UserDataController {
  constructor(private userDataService: UserDataService) {}

  /**
   * Get all user data for a specific user.
   *
   * @param userId - The ID of the user
   * @param query - The query parameters
   * @param query.keys - Specific keys to fetch
   * @param query.type - The type of the data
   */
  @Get('/')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async fetch(
    @Param('userId') userId: string,
    @Query() query: { keys: UserDataKeys[] },
  ) {
    const defaultKeys = [UserDataKeys.SubscriptionType];

    return this.userDataService.fetch(userId, query?.keys || defaultKeys);
  }

  /**
   * Get all metadata data for a specific user.
   *
   * @param userId - The ID of the user
   */
  @Get('/metadata')
  @PublicKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async fetchMetadata(@Param('userId') userId: string) {
    return this.userDataService.fetchMetadata(userId);
  }

  /**
   * Get a specific user data by id.
   *
   * @param userId - The ID of the user
   * @param key - The key of the data
   */
  @Get('/:key')
  @PublicKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
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
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
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
