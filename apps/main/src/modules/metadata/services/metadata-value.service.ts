import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import {
  MetadataValue,
  MetadataModelContext,
  MetadataModelType,
} from '@prisma/client';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import { RedisService } from '@/auth/modules/shared/database/redis.service';
import { RedisKeys } from '../../shared/database/redis-keys';

@Injectable()
export class MetadataValueService {
  private readonly logger = new Logger(MetadataValueService.name);

  constructor(
    private databaseService: DatabaseService,
    private redisService: RedisService,
  ) {}

  /**
   * Transforms metadata values array into a clean key-value object structure.
   *
   * @param metadataValues - Array of metadata values
   * @param keyPath - Path to the key field (default: 'metadataModel.key')
   * @returns {Record<string, any>} - Clean key-value object
   */
  static toMetadataStructure(
    metadataValues: any[],
    keyPath: string = 'metadataModel.key',
  ): Record<string, any> {
    const metadata: Record<string, any> = {};

    metadataValues.forEach((metadataValue) => {
      // Support nested key paths like 'metadataModel.key' or simple 'key'
      const key = keyPath
        .split('.')
        .reduce((obj, path) => obj?.[path], metadataValue);

      if (key) {
        metadata[key] = metadataValue.value;
      }
    });

    return metadata;
  }

  /**
   * Validates if the relation exists in the database based on context.
   *
   * @param relationId - The ID of the relation to validate
   * @param context - The context (User, Organization, Environment)
   * @returns {Promise<boolean>} - True if relation exists, false otherwise
   */
  private async validateRelationExists(
    relationId: string,
    context: MetadataModelContext,
  ): Promise<boolean> {
    try {
      switch (context) {
        case MetadataModelContext.User:
          const user = await this.databaseService.user.findUnique({
            where: { id: relationId },
            select: { id: true },
          });
          return !!user;

        case MetadataModelContext.Organization:
          const organization =
            await this.databaseService.organization.findUnique({
              where: { id: relationId },
              select: { id: true },
            });
          return !!organization;

        case MetadataModelContext.Environment:
          const environment = await this.databaseService.environment.findUnique(
            {
              where: { id: relationId },
              select: { id: true },
            },
          );
          return !!environment;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Error validating relation existence:', error);
      return false;
    }
  }

  /**
   * Finds all metadata values with optional filtering.
   *
   * @param {Object} filters - Optional filters.
   * @param {string} filters.relationId - Filter by relation ID.
   * @param {MetadataModelContext} filters.context - Filter by context.
   * @param {string} filters.metadataModelId - Filter by metadata model ID.
   * @returns {Promise<DataReturn<MetadataValue[]>>} - The metadata values.
   */
  async findAll(filters?: {
    relationId?: string;
    context?: MetadataModelContext;
    metadataModelId?: string;
  }): Promise<DataReturn<MetadataValue[]>> {
    try {
      const where: any = {};

      if (filters?.relationId) {
        where.relationId = filters.relationId;
      }

      if (filters?.metadataModelId) {
        where.metadataModelId = parseInt(filters.metadataModelId);
      }

      if (filters?.context) {
        where.metadataModel = {
          context: filters.context,
        };
      }

      const metadataValues = await this.databaseService.metadataValue.findMany({
        where,
        include: {
          metadataModel: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        data: metadataValues,
      };
    } catch (error) {
      this.logger.error('Error finding metadata values:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }

  /**
   * Finds a metadata value by metadata model ID and relation ID.
   *
   * @param {string} metadataModelId - The metadata model ID.
   * @param {string} relationId - The relation ID.
   * @returns {Promise<DataReturn<MetadataValue>>} - The metadata value.
   */
  async findOne(
    metadataModelId: string,
    relationId: string,
  ): Promise<DataReturn<MetadataValue>> {
    try {
      const metadataValue = await this.databaseService.metadataValue.findUnique(
        {
          where: {
            metadataModelId_relationId: {
              metadataModelId: parseInt(metadataModelId),
              relationId,
            },
          },
          include: {
            metadataModel: true,
          },
        },
      );

      if (!metadataValue) {
        return {
          statusCode: StatusCodes.NotFound,
        };
      }

      return {
        data: metadataValue,
      };
    } catch (error) {
      this.logger.error('Error finding metadata value:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }

  /**
   * Manages metadata for a specific relation and context.
   * This is the main method - handles create/update/delete automatically.
   *
   * API Error Examples:
   *
   * 1. Invalid type error (400):
   *    {
   *      "statusCode": 400,
   *      "message": "Invalid value type for field 'age'. Expected number, received string."
   *    }
   *
   * 2. Invalid List option error (400):
   *    {
   *      "statusCode": 400,
   *      "message": "Invalid option for field 'status'. Value 'invalid' is not in the available options. Available options: \"active\" (Active), \"inactive\" (Inactive), \"pending\" (Pending)"
   *    }
   *
   * 3. Relation not found error (404):
   *    {
   *      "statusCode": 404,
   *      "message": "User with ID abc123 not found"
   *    }
   *
   * @param {string} relationId - The relation ID (user, organization, environment).
   * @param {MetadataModelContext} context - The context (User, Organization, Environment).
   * @param payload - Object with key-value pairs to upsert/delete.
   * @returns {Promise<DataReturn<{ metadata: Record<string, any> }>>} - The result of the operations.
   */
  async manageMetadata(
    relationId: string,
    context: MetadataModelContext,
    payload: Record<string, any>,
  ): Promise<DataReturn<Record<string, any>>> {
    try {
      // Validate if the relation exists
      const relationExists = await this.validateRelationExists(
        relationId,
        context,
      );
      if (!relationExists) {
        return {
          statusCode: StatusCodes.NotFound,
          error: `${context} with ID ${relationId} not found`,
        };
      }
      // Get existing metadata values for this relation and context
      const existingValues = await this.databaseService.metadataValue.findMany({
        where: {
          relationId,
          metadataModel: {
            context,
          },
        },
        include: {
          metadataModel: {
            select: {
              key: true,
            },
          },
        },
      });

      // Get all metadata models for this context
      const metadataModels = await this.databaseService.metadataModel.findMany({
        where: {
          context,
        },
      });

      const operations = [];
      const payloadKeys = new Set(Object.keys(payload));

      // Delete existing values that are not in the payload
      for (const existingValue of existingValues) {
        if (!payloadKeys.has(existingValue.metadataModel.key)) {
          operations.push({
            delete: this.databaseService.metadataValue.delete({
              where: {
                metadataModelId_relationId: {
                  metadataModelId: existingValue.metadataModelId,
                  relationId,
                },
              },
            }),
          });
        }
      }

      // Process each key in the payload (upsert)
      for (const [key, value] of Object.entries(payload)) {
        const metadataModel = metadataModels.find((model) => model.key === key);

        if (!metadataModel) {
          this.logger.warn(`Metadata model not found for key: ${key}`);
          return {
            statusCode: StatusCodes.BadRequest,
            error: `Metadata model not found for key: ${key}`,
          };
        }

        // Skip null/undefined values (they are handled by deletion above)
        if (value === null || value === undefined) {
          continue;
        }

        // Validate value based on metadata model type
        const validationResult = this._validateValueByType(
          value,
          metadataModel,
        );
        if (!validationResult.isValid) {
          this.logger.error(
            `Validation failed for key "${key}": ${validationResult.error?.message}`,
          );

          const errorMessage = this._formatValidationError(validationResult);

          return {
            statusCode: StatusCodes.BadRequest,
            error: errorMessage,
          };
        }

        // Upsert the value
        operations.push({
          upsert: this.databaseService.metadataValue.upsert({
            where: {
              metadataModelId_relationId: {
                metadataModelId: metadataModel.id,
                relationId,
              },
            },
            create: {
              metadataModelId: metadataModel.id,
              relationId,
              value,
            },
            update: {
              value,
            },
          }),
        });
      }

      // Execute all operations in a transaction
      await this.databaseService.$transaction(
        operations.map((operation) => operation.upsert || operation.delete),
      );

      // Get updated metadata
      const updatedValues = await this.databaseService.metadataValue.findMany({
        where: {
          relationId,
          metadataModel: {
            context,
          },
        },
        include: {
          metadataModel: {
            select: {
              key: true,
            },
          },
        },
      });

      const upsertCount = operations.filter(
        (operation) => operation.upsert,
      ).length;
      const deleteCount = operations.filter(
        (operation) => operation.delete,
      ).length;

      this.logger.log(
        `Managed metadata: ${upsertCount} upserts, ${deleteCount} deletes executed (RELATION: ${relationId}, CONTEXT: ${context})`,
      );

      // Invalidate session cache if needed
      await this._invalidateSessionCache(relationId, context);

      // Format response as key-value pairs using the utility function
      const metadata = MetadataValueService.toMetadataStructure(updatedValues);

      return {
        data: metadata,
      };
    } catch (error) {
      this.logger.error('Error managing metadata:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }

  /**
   * Get metadata structure for multiple relations by context
   * If only one relationId is provided, returns metadata for that single relation
   */
  async getMetadataByContext(
    relationIds: string[],
    context: MetadataModelContext,
  ): Promise<Record<string, Record<string, any>>> {
    try {
      const metadataValues = await this.databaseService.metadataValue.findMany({
        where: {
          relationId: { in: relationIds },
          metadataModel: {
            context,
          },
        },
        include: {
          metadataModel: {
            select: {
              key: true,
            },
          },
        },
      });

      if (metadataValues.length === 0) {
        return {};
      }

      // Group metadata by relation ID
      const metadataByRelation = metadataValues.reduce(
        (acc, metadataValue) => {
          if (!acc[metadataValue.relationId]) {
            acc[metadataValue.relationId] = [];
          }
          acc[metadataValue.relationId].push(metadataValue);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      // Transform each group to key-value structure
      const result: Record<string, Record<string, any>> = {};
      for (const relationId of relationIds) {
        const relationMetadata = metadataByRelation[relationId] || [];
        result[relationId] =
          MetadataValueService.toMetadataStructure(relationMetadata);
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting metadata by context:', error);
      return {};
    }
  }

  /**
   * Upserts a single metadata key-value pair for a specific relation and context.
   * This method validates the value against the metadata model and creates or updates accordingly.
   *
   * @param {string} relationId - The relation ID (user, organization, environment).
   * @param {MetadataModelContext} context - The context (User, Organization, Environment).
   * @param {string} key - The metadata key to upsert.
   * @param {any} value - The value to set for the metadata key.
   * @returns {Promise<DataReturn<{ key: string; value: any }>>} - The upserted metadata key-value pair.
   */
  async upsertMetadata(
    relationId: string,
    context: MetadataModelContext,
    key: string,
    value: any,
  ): Promise<DataReturn<{ key: string; value: any }>> {
    try {
      // Validate if the relation exists
      const relationExists = await this.validateRelationExists(
        relationId,
        context,
      );
      if (!relationExists) {
        return {
          statusCode: StatusCodes.NotFound,
          error: `${context} with ID ${relationId} not found`,
        };
      }

      // Find the metadata model for this key and context
      const metadataModel = await this.databaseService.metadataModel.findFirst({
        where: {
          key,
          context,
        },
      });

      if (!metadataModel) {
        return {
          statusCode: StatusCodes.BadRequest,
          error: `Metadata model not found for key: ${key}`,
        };
      }

      // Handle null/undefined values (delete the metadata value to avoid DB clutter)
      if (value === null || value === undefined) {
        try {
          await this.databaseService.metadataValue.delete({
            where: {
              metadataModelId_relationId: {
                metadataModelId: metadataModel.id,
                relationId,
              },
            },
          });

          this.logger.log(
            `Deleted metadata for key "${key}" (RELATION: ${relationId}, CONTEXT: ${context})`,
          );
        } catch (error) {
          this.logger.log(
            `Metadata for key "${key}" does not exist, no deletion needed (RELATION: ${relationId}, CONTEXT: ${context})`,
          );
        }

        return {
          data: { key, value: null },
        };
      }

      // Validate value based on metadata model type
      const validationResult = this._validateValueByType(value, metadataModel);
      if (!validationResult.isValid) {
        this.logger.error(
          `Validation failed for key "${key}": ${validationResult.error?.message}`,
        );

        const errorMessage = this._formatValidationError(validationResult);

        return {
          statusCode: StatusCodes.BadRequest,
          error: errorMessage,
        };
      }

      // Upsert the metadata value
      const metadataValue = await this.databaseService.metadataValue.upsert({
        where: {
          metadataModelId_relationId: {
            metadataModelId: metadataModel.id,
            relationId,
          },
        },
        create: {
          metadataModelId: metadataModel.id,
          relationId,
          value,
        },
        update: {
          value,
        },
      });

      this.logger.log(
        `Upserted metadata for key "${key}" (RELATION: ${relationId}, CONTEXT: ${context})`,
      );

      // Invalidate session cache if needed
      await this._invalidateSessionCache(relationId, context);

      return {
        data: { key, value: metadataValue.value },
      };
    } catch (error) {
      this.logger.error('Error upserting metadata:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }

  /**
   * Invalidates session cache for users when metadata changes.
   * - For User context: invalidates the user's session cache
   * - For Organization context: invalidates all organization users' session caches
   * - For Environment context: no cache invalidation needed
   *
   * @param relationId - The relation ID (user, organization, environment)
   * @param context - The context (User, Organization, Environment)
   */
  private async _invalidateSessionCache(
    relationId: string,
    context: MetadataModelContext,
  ): Promise<void> {
    try {
      if (context === MetadataModelContext.User) {
        await this.redisService.delete(RedisKeys.authKey(relationId));
        this.logger.log(`Invalidated user session cache (USER: ${relationId})`);
      } else if (context === MetadataModelContext.Organization) {
        const orgUsers = await this.databaseService.user.findMany({
          select: {
            id: true,
          },
          where: {
            organizationId: relationId,
          },
        });
        const orgUsersIds = orgUsers.map((user) => user.id);
        await Promise.all(
          orgUsersIds.map((userId) =>
            this.redisService.delete(RedisKeys.authKey(userId)),
          ),
        );
        this.logger.log(
          `Invalidated organization user's sessions cache (ORGANIZATION: ${relationId})`,
        );
      }
    } catch (error) {
      this.logger.error('Error invalidating session cache:', error);
    }
  }

  /**
   * Validates a value based on the metadata model type and options.
   *
   * Examples of error responses that will be returned to the API:
   *
   * For invalid type:
   * - "Invalid value type for field 'age'. Expected number, received string."
   *
   * For invalid List option:
   * - "Invalid option for field 'status'.
   *   Value 'invalid' is not in the available options.
   *   Available options: "active" (Active), "inactive" (Inactive), "pending" (Pending)"
   *
   * @param value - The value to validate
   * @param metadataModel - The metadata model with type and options
   * @returns {object} - Validation result with success flag and error details
   */
  private _validateValueByType(
    value: any,
    metadataModel: any,
  ): {
    isValid: boolean;
    error?: {
      message: string;
      expectedType: string;
      receivedType: string;
      availableOptions?: Array<{ label: string; value: string }>;
    };
  } {
    if (value === null || value === undefined) {
      return { isValid: true };
    }

    const receivedType = typeof value;

    switch (metadataModel.type as MetadataModelType) {
      case MetadataModelType.String:
        if (typeof value === 'string') {
          return { isValid: true };
        }
        return {
          isValid: false,
          error: {
            message: `Invalid value type for field '${metadataModel.key}'. Expected string, received ${receivedType}.`,
            expectedType: 'string',
            receivedType,
          },
        };

      case MetadataModelType.Number:
        if (typeof value === 'number' && !isNaN(value)) {
          return { isValid: true };
        }
        return {
          isValid: false,
          error: {
            message: `Invalid value type for field '${metadataModel.key}'. Expected number, received ${receivedType}.`,
            expectedType: 'number',
            receivedType,
          },
        };

      case MetadataModelType.Boolean:
        if (typeof value === 'boolean') {
          return { isValid: true };
        }
        return {
          isValid: false,
          error: {
            message: `Invalid value type for field '${metadataModel.key}'. Expected boolean, received ${receivedType}.`,
            expectedType: 'boolean',
            receivedType,
          },
        };

      case MetadataModelType.JSON:
        if (typeof value === 'object') {
          return { isValid: true };
        }
        return {
          isValid: false,
          error: {
            message: `Invalid value type for field '${metadataModel.key}'. Expected object, received ${receivedType}.`,
            expectedType: 'object',
            receivedType,
          },
        };

      case MetadataModelType.List:
        if (typeof value !== 'string') {
          return {
            isValid: false,
            error: {
              message: `Invalid value type for field '${metadataModel.key}'. Expected string (from available options), received ${receivedType}.`,
              expectedType: 'string',
              receivedType,
              availableOptions: metadataModel.options as Array<{
                label: string;
                value: string;
              }>,
            },
          };
        }

        const options = metadataModel.options as Array<{
          label: string;
          value: string;
        }>;

        if (!options || !options.some((option) => option.value === value)) {
          return {
            isValid: false,
            error: {
              message: `Invalid option ${value} for field '${metadataModel.key}'.`,
              expectedType: 'string',
              receivedType,
              availableOptions: options,
            },
          };
        }

        return { isValid: true };

      default:
        return {
          isValid: false,
          error: {
            message: `Unsupported metadata type '${metadataModel.type}' for field '${metadataModel.key}'.`,
            expectedType: 'unknown',
            receivedType,
          },
        };
    }
  }

  /**
   * Formats a validation error message with available options if applicable.
   *
   * @param validationResult - The validation result from _validateValueByType
   * @returns {string} - Formatted error message
   */
  private _formatValidationError(validationResult: {
    isValid: boolean;
    error?: {
      message: string;
      expectedType: string;
      receivedType: string;
      availableOptions?: Array<{ label: string; value: string }>;
    };
  }): string {
    let errorMessage = validationResult.error?.message || 'Validation failed';

    // Add available options to error message for List type
    if (validationResult.error?.availableOptions) {
      const optionsText = validationResult.error.availableOptions
        .map((option) => option.value)
        .join(', ');
      errorMessage += ` Available options are ${optionsText}`;
    }

    return errorMessage;
  }
}
