import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { PublicKeyOrThonLabsOnly } from '@/auth/modules/shared/decorators/public-key-or-thon-labs-user.decorator';
import { SecretKeyOrThonLabsOnly } from '@/auth/modules/shared/decorators/secret-key-or-thon-labs-user.decorator';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { MetadataValueService } from '../services/metadata-value.service';
import {
  ManageMetadataPayload,
  manageMetadataValidator,
} from '../validators/metadata-value-validators';
import { exceptionsMapper } from '@/utils/index';

@Controller('metadata/values')
export class MetadataValueController {
  private readonly logger = new Logger(MetadataValueController.name);

  constructor(private metadataValueService: MetadataValueService) {}

  /**
   * Manage metadata for a specific relation and context.
   * This is the main endpoint - handles create/update/delete automatically.
   *
   * @param payload - Payload with relationId, context and metadata
   */
  @Post('/')
  @SecretKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  @SchemaValidator(manageMetadataValidator)
  async manageMetadata(@Body() payload: ManageMetadataPayload) {
    const result = await this.metadataValueService.manageMetadata(
      payload.relationId,
      payload.context,
      payload.metadata,
    );

    if (result?.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result?.data;
  }

  /**
   * Get metadata for a specific relation and context.
   *
   * @param relationId - The relation ID
   * @param context - The context
   */
  @Get('/:relationId')
  @PublicKeyOrThonLabsOnly()
  @HasEnvAccess({ param: 'tl-env-id', source: 'headers' })
  async getMetadata(@Param('relationId') relationId: string) {
    const result = await this.metadataValueService.findAll({
      relationId,
    });

    if (result.statusCode) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    const metadata = MetadataValueService.toMetadataStructure(
      result.data || [],
    );

    return metadata;
  }
}
