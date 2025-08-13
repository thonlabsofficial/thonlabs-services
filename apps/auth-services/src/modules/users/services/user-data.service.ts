import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { UserData } from '@prisma/client';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import prepareString from '@/utils/services/prepare-string';
import Crypt from '@/utils/services/crypt';

@Injectable()
export class UserDataService {
  private readonly logger = new Logger(UserDataService.name);

  constructor(private databaseService: DatabaseService) {}

  /**
   * Upserts user data.
   *
   * @param {string} userId - The ID of the user.
   * @param {Object} payload - The payload containing the data to upsert.
   * @param {string} payload.id - The ID of the data.
   * @param {any} payload.value - The value of the data.
   * @returns {Promise<DataReturn<UserData>>} - The upserted user data.
   */
  async upsert(
    userId: string,
    payload: { key: string; value: any },
    encrypt = false,
  ): Promise<DataReturn<UserData>> {
    const key = prepareString(payload.key);
    const currentRegister = await this.databaseService.userData.findFirst({
      where: { key, userId },
    });

    let value = payload.value;

    if (encrypt) {
      const encryptedValue = await Crypt.encrypt(
        JSON.stringify(payload.value),
        Crypt.generateIV(key),
        process.env.ENCODE_SECRET,
      );

      value = `ev:${encryptedValue}`;
    }

    const userData = await this.databaseService.userData.upsert({
      where: { id: currentRegister?.id ?? -1 },
      create: {
        key,
        value,
        userId,
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

    this.logger.log(`Upserted user data ${payload.key} (USER: ${userId})`);

    return { data: userData as UserData };
  }

  /**
   * Fetches all user data for a given user ID.
   *
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Record<string, any>>} - The fetched user data.
   */
  async fetch(
    userId: string,
    keys: string[] = [],
  ): Promise<Record<string, any>> {
    const userData = await this.databaseService.userData.findMany({
      where: {
        userId,
        ...(keys.length > 0 && { key: { in: keys } }),
      },
      select: {
        key: true,
        value: true,
      },
    });

    const values = {};

    for (const data of userData) {
      const parsedValue = await this._parseValue(data.key, data.value);
      values[data.key] = parsedValue;
    }

    return values;
  }

  /**
   * Fetches user data by key.
   *
   * @param {string} key - The key of the data.
   * @returns {Promise<Record<string, any>>} - The fetched user data.
   */
  async fetchByKey(key: string): Promise<Record<string, any>> {
    const userData = await this.databaseService.userData.findMany({
      where: { key },
      select: {
        key: true,
        value: true,
      },
    });

    const values = {};

    for (const data of userData) {
      values[data.key] = await this._parseValue(data.key, data.value);
    }

    return values;
  }

  /**
   * Gets user data by ID.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} id - The ID of the data.
   * @returns {Promise<DataReturn<UserData>>} - The fetched user data.
   */
  async get<T = null>(userId: string, key: string): Promise<DataReturn<T>> {
    const userData = await this.databaseService.userData.findFirst({
      where: { key, userId },
      select: {
        value: true,
      },
    });

    if (!userData) {
      const error = `User data key "${key}" not found`;
      this.logger.warn(`${error} (USER: ${userId})`);

      return {
        statusCode: StatusCodes.NotFound,
        error,
      };
    }

    return { data: (await this._parseValue(key, userData?.value)) as T };
  }

  /**
   * Deletes user data by ID.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} id - The ID of the data.
   * @returns {Promise<DataReturn<UserData>>} - The deleted user data.
   */
  async delete(userId: string, key: string): Promise<DataReturn<UserData>> {
    const userData = await this.databaseService.userData.findFirst({
      where: { key, userId },
    });

    if (!userData) {
      return {
        statusCode: StatusCodes.NotFound,
        error: `User data key ${key} not found`,
      };
    }

    await this.databaseService.userData.delete({
      where: { id: userData.id, userId },
    });
  }

  /**
   * Decrypts a value if it is encrypted.
   *
   * @param {string} key - The key of the data.
   * @param {any} value - The value of the data.
   * @returns {any} - The decrypted value or the original value if not encrypted.
   */
  private async _parseValue(key: string, value: any) {
    if (typeof value === 'string' && value.startsWith('ev:')) {
      const decryptedValue = await Crypt.decrypt(
        value.replace('ev:', ''),
        Crypt.generateIV(key),
        process.env.ENCODE_SECRET,
      );

      return JSON.parse(decryptedValue);
    }

    return value;
  }
}
