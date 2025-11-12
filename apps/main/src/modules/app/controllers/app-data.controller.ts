import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { exceptionsMapper, StatusCodes } from '@/utils/enums/errors-metadata';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { PublicRoute } from '@/auth/modules/auth/decorators/auth.decorator';
import { NeedsInternalKey } from '@/auth/modules/shared/decorators/needs-internal-key.decorator';
import { AppDataService } from '@/auth/modules/app/services/app-data.service';
import { AppDataKeys } from '../constants/app-data';
import { setAppDataValidator } from '../validators/app-data-validators';

@Controller('app/data')
export class AppDataController {
  constructor(private appDataService: AppDataService) {}

  /**
   * Get all app data.
   *
   * @param query - The query parameters
   * @param query.keys - Specific keys to fetch
   */
  @Get('/')
  @PublicRoute()
  @NeedsInternalKey()
  async fetch(@Query() query: { keys: string[] }) {
    const keys = [AppDataKeys.PaymentProviderProductRefId];

    return await this.appDataService.fetch(query?.keys || keys);
  }

  /**
   * Get a specific app data by id.
   *
   * @param key - The key of the data
   */
  @Get('/:key')
  @PublicRoute()
  @NeedsInternalKey()
  async getById(@Param('key') key: string) {
    const data = await this.appDataService.get(key);

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data.data;
  }

  /**
   * Upsert a specific app data.
   *
   * @param key - The key of the data
   * @param payload - The payload of the data
   */
  @Post('/')
  @PublicRoute()
  @NeedsInternalKey()
  @SchemaValidator(setAppDataValidator)
  async upsert(@Param('key') key: string, @Body() payload, @Res() res) {
    const [{ data: exists }, data] = await Promise.all([
      this.appDataService.get(key),
      this.appDataService.upsert(payload),
    ]);

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    if (exists) {
      return res.status(StatusCodes.OK).send('');
    }

    return res.status(StatusCodes.Created).send('');
  }

  /**
   * Delete a specific app data.
   *
   * @param key - The key of the data
   */
  @Delete('/:key')
  @PublicRoute()
  @NeedsInternalKey()
  async delete(@Param('key') key: string) {
    const data = await this.appDataService.delete(key);

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }
  }
}
