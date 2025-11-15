import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PublicKeyOrThonLabsOnly } from '@/auth/modules/shared/decorators/public-key-or-thon-labs-user.decorator';
import { SecretKeyOrThonLabsOnly } from '@/auth/modules/shared/decorators/secret-key-or-thon-labs-user.decorator';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { MetadataModelService } from '../services/metadata-model.service';
import {
  CreateMetadataModelPayload,
  createMetadataModelValidator,
  UpdateMetadataModelPayload,
  updateMetadataModelValidator,
} from '../validators/metadata-model-validators';
import { MetadataModelContext } from '@prisma/client';
import { exceptionsMapper } from '@/utils/index';

@Controller('metadata/models')
export class MetadataModelController {
  constructor(private metadataModelService: MetadataModelService) {}

  /**
   * Create a new metadata model.
   *
   * @param payload - The metadata model data
   */
  @Post('/')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(createMetadataModelValidator)
  async create(@Body() payload: CreateMetadataModelPayload) {
    const result = await this.metadataModelService.create(payload);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  /**
   * Get all metadata models with optional filtering.
   *
   * @param query - Query parameters for filtering
   */
  @Get('/')
  @PublicKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async findAll(@Query() query: { context?: MetadataModelContext }) {
    const filters: any = {};

    if (query.context) {
      filters.context = query.context;
    }

    const result = await this.metadataModelService.findAll(filters);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return {
      items: result?.data,
    };
  }

  /**
   * Get a metadata model by ID.
   *
   * @param id - The metadata model ID
   */
  @Get('/:id')
  @PublicKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async findOne(@Param('id') id: string) {
    const result = await this.metadataModelService.findOne(id);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  /**
   * Update a metadata model.
   *
   * @param id - The metadata model ID
   * @param payload - The updated metadata model data
   */
  @Put('/:id')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(updateMetadataModelValidator)
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateMetadataModelPayload,
  ) {
    const result = await this.metadataModelService.update(id, payload);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  /**
   * Delete a metadata model.
   *
   * @param id - The metadata model ID
   */
  @Delete('/:id')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async delete(@Param('id') id: string) {
    const result = await this.metadataModelService.delete(id);

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }
}
