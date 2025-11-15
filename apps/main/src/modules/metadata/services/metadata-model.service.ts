import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { MetadataModel, MetadataModelContext } from '@prisma/client';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import {
  CreateMetadataModelPayload,
  UpdateMetadataModelPayload,
} from '../validators/metadata-model-validators';

@Injectable()
export class MetadataModelService {
  private readonly logger = new Logger(MetadataModelService.name);

  constructor(private databaseService: DatabaseService) {}

  /**
   * Creates a new metadata model.
   *
   * @param {CreateMetadataModelPayload} payload - The payload containing the metadata model data.
   * @returns {Promise<DataReturn<MetadataModel>>} - The created metadata model.
   */
  async create(
    payload: CreateMetadataModelPayload,
  ): Promise<DataReturn<MetadataModel>> {
    try {
      const metadataModel = await this.databaseService.metadataModel.create({
        data: {
          name: payload.name,
          key: payload.key,
          description: payload.description,
          type: payload.type,
          options: payload.options,
          context: payload.context,
        },
      });

      return {
        data: metadataModel,
      };
    } catch (error) {
      this.logger.error('Error creating metadata model:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }

  /**
   * Finds all metadata models with optional filtering.
   *
   * @param {Object} filters - Optional filters.
   * @param {MetadataModelContext} filters.context - Filter by context.
   * @returns {Promise<DataReturn<MetadataModel[]>>} - The metadata models.
   */
  async findAll(filters?: {
    context?: MetadataModelContext;
  }): Promise<DataReturn<MetadataModel[]>> {
    try {
      const where: any = {};

      if (filters?.context) {
        where.context = filters.context;
      }

      const metadataModels = await this.databaseService.metadataModel.findMany({
        where,
      });

      return {
        data: metadataModels,
      };
    } catch (error) {
      this.logger.error('Error finding metadata models:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }

  /**
   * Finds a metadata model by ID.
   *
   * @param {string} id - The ID of the metadata model.
   * @returns {Promise<DataReturn<MetadataModel>>} - The metadata model.
   */
  async findOne(id: string): Promise<DataReturn<MetadataModel>> {
    try {
      const metadataModel = await this.databaseService.metadataModel.findUnique(
        {
          where: { id: parseInt(id) },
        },
      );

      if (!metadataModel) {
        return {
          statusCode: StatusCodes.NotFound,
        };
      }

      return {
        data: metadataModel,
      };
    } catch (error) {
      this.logger.error('Error finding metadata model:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }

  /**
   * Updates a metadata model.
   *
   * @param {string} id - The ID of the metadata model.
   * @param {UpdateMetadataModelPayload} payload - The payload containing the updated data.
   * @returns {Promise<DataReturn<MetadataModel>>} - The updated metadata model.
   */
  async update(
    id: string,
    payload: UpdateMetadataModelPayload,
  ): Promise<DataReturn<MetadataModel>> {
    try {
      // Extract only allowed fields, filtering out undefined values
      const { name, description, options } = payload;
      const updateData = Object.fromEntries(
        Object.entries({ name, description, options }).filter(
          ([, value]) => value !== undefined,
        ),
      );

      if (Object.keys(updateData).length === 0) {
        return {
          statusCode: StatusCodes.BadRequest,
        };
      }

      const metadataModel = await this.databaseService.metadataModel.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      return {
        data: metadataModel,
      };
    } catch (error) {
      this.logger.error('Error updating metadata model:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }

  /**
   * Deletes a metadata model.
   *
   * @param {string} id - The ID of the metadata model.
   * @returns {Promise<DataReturn>} - The result of the deletion.
   */
  async delete(id: string): Promise<DataReturn> {
    try {
      const modelId = parseInt(id);

      await this.databaseService.metadataModel.delete({
        where: { id: modelId },
      });
    } catch (error) {
      this.logger.error('Error deleting metadata model:', error);
      return {
        statusCode: StatusCodes.Internal,
      };
    }
  }
}
