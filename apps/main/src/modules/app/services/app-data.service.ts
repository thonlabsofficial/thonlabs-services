import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { AppData } from '@prisma/client';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import prepareString from '@/utils/services/prepare-string';

@Injectable()
export class AppDataService {
  private readonly logger = new Logger(AppDataService.name);

  constructor(private databaseService: DatabaseService) {}

  /**
   * Upserts app data.
   *
   * @param {Object} payload - The payload containing the data to upsert.
   * @param {string} payload.id - The ID of the data.
   * @param {any} payload.value - The value of the data.
   * @returns {Promise<DataReturn<AppData>>} - The upserted app data.
   */
  async upsert(payload: {
    key: string;
    value: any;
  }): Promise<DataReturn<AppData>> {
    const key = prepareString(payload.key);
    const currentRegister = await this.databaseService.appData.findFirst({
      where: { key },
    });

    const value = payload.value;

    const appData = await this.databaseService.appData.upsert({
      where: { id: currentRegister?.id ?? -1 },
      create: {
        key,
        value,
      },
      update: {
        value,
      },
      select: {
        id: true,
        value: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Upserted app data ${payload.key}`);

    return { data: appData as AppData };
  }

  /**
   * Fetches all app data.
   *
   * @returns {Promise<Record<string, any>>} - The fetched app data.
   */
  async fetch(keys: string[] = []): Promise<Record<string, any>> {
    const appData = await this.databaseService.appData.findMany({
      where: {
        ...(keys.length > 0 && { key: { in: keys } }),
      },
      select: {
        key: true,
        value: true,
      },
    });

    const values = {};

    for (const data of appData) {
      values[data.key] = data.value;
    }

    return values;
  }

  /**
   * Fetches environment data by key.
   *
   * @param {string} key - The key of the data.
   * @returns {Promise<Record<string, any>>} - The fetched environment data.
   */
  async fetchByKey(key: string): Promise<Record<string, any>> {
    const environmentData = await this.databaseService.environmentData.findMany(
      {
        where: { key },
        select: {
          key: true,
          value: true,
        },
      },
    );

    const values = {};

    for (const data of environmentData) {
      values[data.key] = data.value;
    }

    return values;
  }

  /**
   * Gets app data by key.
   *
   * @param {string} key - The key of the data.
   * @returns {Promise<DataReturn<AppData>>} - The fetched app data.
   */
  async get<T = null>(key: string): Promise<DataReturn<T>> {
    const appData = await this.databaseService.appData.findFirst({
      where: { key },
      select: {
        value: true,
      },
    });

    if (!appData) {
      const error = `App data key "${key}" not found`;
      this.logger.warn(`${error}`);

      return {
        statusCode: StatusCodes.NotFound,
        error,
      };
    }

    return { data: appData?.value as T };
  }

  /**
   * Deletes app data by key.
   *
   * @param {string} key - The key of the data.
   * @returns {Promise<DataReturn<AppData>>} - The deleted app data.
   */
  async delete(key: string): Promise<DataReturn<AppData>> {
    const appData = await this.databaseService.appData.findFirst({
      where: { key },
    });

    if (!appData) {
      return {
        statusCode: StatusCodes.NotFound,
        error: `App data key ${key} not found`,
      };
    }

    await this.databaseService.appData.delete({
      where: { id: appData.id },
    });
  }
}
