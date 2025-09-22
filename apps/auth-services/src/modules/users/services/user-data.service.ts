import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { UserData, UserDataType } from '@prisma/client';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import prepareString from '@/utils/services/prepare-string';
import Crypt from '@/utils/services/crypt';
import { UserDataKeys } from '@/auth/modules/users/constants/user-data';

@Injectable()
export class UserDataService {
  private readonly logger = new Logger(UserDataService.name);

  constructor(private databaseService: DatabaseService) {}

  /**
   * Upserts user data.
   *
   * @param {string} userId - The ID of the user.
   * @param {Object} payload - The payload containing the data to upsert.
   * @param {string} payload.key - The key of the data.
   * @param {any} payload.value - The value of the data.
   * @returns {Promise<DataReturn<UserData>>} - The upserted user data.
   */
  async upsert(
    userId: string,
    payload: { key: string; value: any; type?: UserDataType },
    encrypt = false,
  ): Promise<DataReturn<UserData>> {
    try {
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
          type: payload.type,
        },
        update: {
          value,
        },
        select: {
          key: true,
          value: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Upserted user data ${payload.key} (USER: ${userId})`);

      return { data: userData as UserData };
    } catch (error) {
      this.logger.error(`Error upserting user data: ${error}`);
      return {
        statusCode: StatusCodes.Internal,
        error: error.message,
      };
    }
  }

  /**
   * Fetches all user data for a given user ID.
   *
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Record<string, any>>} - The fetched user data.
   */
  async fetch(
    userId: string,
    keys: UserDataKeys[] = [],
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
      const parsedValue = await Crypt.parseEncryptedValue(
        data.key as UserDataKeys,
        data.value,
      );
      values[data.key] = parsedValue;
    }

    return values;
  }

  /**
   * Fetches all metadata data for a given user ID.
   *
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Record<string, any>>} - The fetched metadata data.
   */
  async fetchMetadata(userId: string): Promise<Record<string, any>> {
    const userData = await this.databaseService.userData.findMany({
      where: {
        userId,
        type: UserDataType.Metadata,
      },
      select: {
        key: true,
        value: true,
      },
    });

    const values = {};

    for (const data of userData) {
      values[data.key] = data.value;
    }

    return values;
  }

  /**
   * Fetches user data by key.
   *
   * @param {UserDataKeys} key - The key of the data.
   * @returns {Promise<Record<string, any>>} - The fetched user data.
   */
  async fetchByKey(key: UserDataKeys): Promise<Record<string, any>> {
    const userData = await this.databaseService.userData.findMany({
      where: { key },
      select: {
        key: true,
        value: true,
      },
    });

    const values = {};

    for (const data of userData) {
      values[data.key] = await Crypt.parseEncryptedValue(data.key, data.value);
    }

    return values;
  }

  /**
   * Gets user data by ID.
   *
   * @param {string} userId - The ID of the user.
   * @param {UserDataKeys} key - The key of the data.
   * @returns {Promise<DataReturn<UserData>>} - The fetched user data.
   */
  async get<T = null>(
    userId: string,
    key: UserDataKeys,
  ): Promise<DataReturn<T>> {
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

    return {
      data: (await Crypt.parseEncryptedValue(key, userData?.value)) as T,
    };
  }

  /**
   * Deletes user data by ID.
   *
   * @param {string} userId - The ID of the user.
   * @param {UserDataKeys} key - The key of the data.
   * @returns {Promise<DataReturn<UserData>>} - The deleted user data.
   */
  async delete(
    userId: string,
    key: UserDataKeys,
  ): Promise<DataReturn<UserData>> {
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
   * Manages user metadata by upserting or deleting based on the provided payload.
   *
   * @param {string} userId - The ID of the user.
   * @param {Array} payload - Array of metadata operations to perform.
   * @param {string} payload[].key - The key of the metadata.
   * @param {any} payload[].value - The value of the metadata (null/undefined to delete).
   * @returns {Promise<DataReturn<{ upserted: number; deleted: number }>>} - The result of the operations.
   */
  async manageMetadata(
    userId: string,
    payload: { key: string; value: any }[],
  ): Promise<
    DataReturn<{
      metadata: Record<string, any>;
    }>
  > {
    try {
      const existingMetadata = await this.databaseService.userData.findMany({
        where: {
          userId,
          type: UserDataType.Metadata,
        },
      });

      const payloadKeys = new Set(payload.map((item) => item.key));
      const existingMetadataKeys = new Set(
        existingMetadata.map((item) => item.key),
      );

      // Separate operations based on the optimized logic:
      const toCreate: { key: string; value: any }[] = [];
      const toUpdate: { key: string; value: any }[] = [];
      const toDelete: string[] = [];

      // Process payload items
      for (const { key, value } of payload) {
        const existingItem = existingMetadata.find((item) => item.key === key);

        if (!existingItem) {
          // Key doesn't exist in DB -> Create it
          toCreate.push({ key, value });
        } else {
          // Key exists in DB -> Update it only if value changed
          const existingValue = existingItem.value;
          const newValue = value;

          const valuesAreEqual =
            JSON.stringify(existingValue) === JSON.stringify(newValue);

          if (!valuesAreEqual) {
            toUpdate.push({ key, value });
          }
        }
      }

      // Keys that exist in DB but NOT in payload should be deleted
      for (const existingKey of existingMetadataKeys) {
        if (!payloadKeys.has(existingKey)) {
          toDelete.push(existingKey);
        }
      }

      // Perform bulk delete operations
      if (toDelete.length > 0) {
        await this.databaseService.userData.deleteMany({
          where: {
            userId,
            key: { in: toDelete },
            type: UserDataType.Metadata,
          },
        });
      }

      // Bulk create new records
      if (toCreate.length > 0) {
        await this.databaseService.userData.createMany({
          data: toCreate.map(({ key, value }) => ({
            key,
            value,
            userId,
            type: UserDataType.Metadata,
          })),
        });
      }

      // Update existing records that have changed values
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(({ key, value }) =>
            this.upsert(userId, { key, value, type: UserDataType.Metadata }),
          ),
        );
      }

      this.logger.log(
        `Managed user metadata: ${toCreate.length} created, ${toUpdate.length} updated, ${toDelete.length} deleted (USER: ${userId})`,
      );

      const metadata = await this.fetchMetadata(userId);

      return {
        data: {
          metadata,
        },
      };
    } catch (error) {
      this.logger.error(`Error managing user metadata: ${error}`);
      return {
        statusCode: StatusCodes.Internal,
        error: error.message,
      };
    }
  }
}
