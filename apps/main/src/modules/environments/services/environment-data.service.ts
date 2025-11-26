import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { EnvironmentData } from '@prisma/client';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import prepareString from '@/utils/services/prepare-string';
import Crypt from '@/utils/services/crypt';

@Injectable()
export class EnvironmentDataService {
  private readonly logger = new Logger(EnvironmentDataService.name);

  constructor(private databaseService: DatabaseService) {}

  /**
   * Upserts environment data.
   *
   * @param {string} environmentId - The ID of the environment.
   * @param {Object} payload - The payload containing the data to upsert.
   * @param {string} payload.id - The ID of the data.
   * @param {any} payload.value - The value of the data.
   * @returns {Promise<DataReturn<EnvironmentData>>} - The upserted environment data.
   */
  async upsert(
    environmentId: string,
    payload: { key: string; value: any },
    encrypt = false,
  ): Promise<DataReturn<EnvironmentData>> {
    const key = prepareString(payload.key);
    const currentRegister =
      await this.databaseService.environmentData.findFirst({
        where: { key, environmentId },
      });

    let value = payload.value;

    if (encrypt) {
      const encryptedValue = await Crypt.encrypt(
        JSON.stringify(payload.value),
        process.env.ENCODE_SECRET,
      );

      value = `ev:${encryptedValue}`;
    }

    const environmentData = await this.databaseService.environmentData.upsert({
      where: { id: currentRegister?.id ?? -1 },
      create: {
        key,
        value,
        environmentId,
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

    this.logger.log(
      `Upserted environment data ${payload.key} (ENV: ${environmentId})`,
    );

    return { data: environmentData as EnvironmentData };
  }

  /**
   * Fetches all environment data for a given environment ID.
   *
   * @param {string} environmentId - The ID of the environment.
   * @returns {Promise<Record<string, any>>} - The fetched environment data.
   */
  async fetch(
    environmentId: string,
    keys: string[] = [],
  ): Promise<Record<string, any>> {
    const environmentData = await this.databaseService.environmentData.findMany(
      {
        where: {
          environmentId,
          ...(keys.length > 0 && { key: { in: keys } }),
        },
        select: {
          key: true,
          value: true,
        },
      },
    );

    const values = {};

    for (const data of environmentData) {
      const parsedValue = await Crypt.parseEncryptedValue(data.key, data.value);
      values[data.key] = parsedValue;
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
      values[data.key] = await Crypt.parseEncryptedValue(data.key, data.value);
    }

    return values;
  }

  /**
   * Gets environment data by ID.
   *
   * @param {string} environmentId - The ID of the environment.
   * @param {string} id - The ID of the data.
   * @returns {Promise<DataReturn<EnvironmentData>>} - The fetched environment data.
   */
  async get<T = null>(
    environmentId: string,
    key: string,
  ): Promise<DataReturn<T>> {
    const environmentData =
      await this.databaseService.environmentData.findFirst({
        where: { key, environmentId },
        select: {
          value: true,
        },
      });

    if (!environmentData) {
      const error = `Environment data key "${key}" not found`;
      this.logger.warn(`${error} (ENV: ${environmentId})`);

      return {
        statusCode: StatusCodes.NotFound,
        error,
      };
    }

    return {
      data: (await Crypt.parseEncryptedValue(key, environmentData?.value)) as T,
    };
  }

  /**
   * Deletes environment data by ID.
   *
   * @param {string} environmentId - The ID of the environment.
   * @param {string} id - The ID of the data.
   * @returns {Promise<DataReturn<EnvironmentData>>} - The deleted environment data.
   */
  async delete(
    environmentId: string,
    key: string,
  ): Promise<DataReturn<EnvironmentData>> {
    const environmentData =
      await this.databaseService.environmentData.findFirst({
        where: { key, environmentId },
      });

    if (!environmentData) {
      return {
        statusCode: StatusCodes.NotFound,
        error: `Environment data key ${key} not found`,
      };
    }

    await this.databaseService.environmentData.delete({
      where: { id: environmentData.id, environmentId },
    });
  }
}
