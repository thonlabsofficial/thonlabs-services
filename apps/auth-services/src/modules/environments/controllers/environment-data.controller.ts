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
import { ThonLabsOnly } from '@/auth/modules/shared/decorators/thon-labs-only.decorator';
import { HasEnvAccess } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { setEnvironmentDataValidator } from '@/auth/modules/environments/validators/environment-data-validators';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import { NeedsPublicKey } from '@/auth/modules/shared/decorators/needs-public-key.decorator';
import { PublicRoute } from '@/auth/modules/auth/decorators/auth.decorator';
import { NeedsInternalKey } from '@/auth/modules/shared/decorators/needs-internal-key.decorator';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { AuthService } from '@/auth/modules/auth/services/auth.service';
import { EnvironmentDataKeys } from '@/auth/modules/environments/constants/environment-data';

@Controller('environments/:envId/data')
export class EnvironmentDataController {
  constructor(
    private databaseService: DatabaseService,
    private environmentDataService: EnvironmentDataService,
    private environmentService: EnvironmentService,
    private authService: AuthService,
  ) { }

  /**
   * Get all environment data for a specific environment.
   * This is used by the SDKs to generate the auth pages correctly.
   *
   * Requires public key and environment id as headers.
   *
   * @param environmentId - The ID of the environment
   */
  @Get('/')
  @PublicRoute()
  @NeedsPublicKey()
  async fetch(@Param('envId') environmentId: string) {
    const [env, envData] = await Promise.all([
      this.databaseService.environment.findUnique({
        where: { id: environmentId },
        select: {
          id: true,
          authProvider: true,
          projectId: true,
          project: {
            select: {
              appName: true,
            },
          },
        },
      }),
      this.environmentDataService.fetch(environmentId, [
        EnvironmentDataKeys.EnableSignUp,
        EnvironmentDataKeys.EnableSignUpB2BOnly,
        EnvironmentDataKeys.SDKIntegrated,
        EnvironmentDataKeys.Styles,
        EnvironmentDataKeys.Credentials,
        EnvironmentDataKeys.ActiveSSOProviders,
        EnvironmentDataKeys.EnvironmentLogo,
      ]),
    ]);

    delete envData[EnvironmentDataKeys.Credentials];

    return {
      ...envData,
      environmentId: env.id,
      projectId: env.projectId,
      appName: env.project.appName,
      authProvider: env.authProvider,
    };
  }

  /**
   * Get all app data for a specific environment.
   * Can be only accessed by ThonLabs app.
   *
   * Requires internal key.
   *
   * @param environmentId - The ID of the environment
   * @param query - The query of the data
   */
  @Get('/app')
  @PublicRoute()
  @NeedsInternalKey()
  async fetchAppData(
    @Param('envId') environmentId: string,
    @Query() query: { ids: string[] },
  ) {
    const [env, envData, publicKey] = await Promise.all([
      this.databaseService.environment.findUnique({
        where: { id: environmentId },
        select: {
          id: true,
          name: true,
          customDomain: true,
          authProvider: true,
          projectId: true,
          project: {
            select: {
              appName: true,
            },
          },
        },
      }),
      this.environmentDataService.fetch(environmentId, query.ids),
      this.environmentService.getPublicKey(environmentId),
    ]);

    delete envData[EnvironmentDataKeys.Waitlist];
    delete envData[EnvironmentDataKeys.Credentials];

    return {
      ...envData,
      environmentId: env.id,
      projectId: env.projectId,
      appName: env.project.appName,
      environmentName: env.name,
      authProvider: env.authProvider,
      publicKey,
      authDomain:
        env.customDomain ||
        this.authService.getDefaultAuthDomain(environmentId),
    };
  }

  /**
   * Get a specific environment data by id.
   * Requires ThonLabs access and access token.
   *
   * @param environmentId - The ID of the environment
   * @param id - The id of the data
   */
  @Get('/:id')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  async getById(
    @Param('envId') environmentId: string,
    @Param('id') id: string,
  ) {
    const data = await this.environmentDataService.get(environmentId, id);

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    return data.data;
  }

  /**
   * Upsert a specific environment data.
   * Requires ThonLabs access and access token.
   *
   * @param environmentId - The ID of the environment
   * @param payload - The payload of the data
   */
  @Post('/')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  @SchemaValidator(setEnvironmentDataValidator)
  async upsert(
    @Param('envId') environmentId: string,
    @Body() payload,
    @Query() query: { encrypt: boolean },
    @Res() res,
  ) {
    const { data: exists } = await this.environmentDataService.get(
      environmentId,
      payload.key,
    );

    const data = await this.environmentDataService.upsert(
      environmentId,
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

  /**
   * Set the SDK as integrated for the environment.
   * Requires public key and environment id.
   *
   * @param environmentId - The ID of the environment
   */
  @Post('/integrated')
  @PublicRoute()
  @NeedsPublicKey()
  async sdkIntegration(@Param('envId') environmentId: string) {
    const data = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.SDKIntegrated,
    );

    if (data?.statusCode === StatusCodes.NotFound) {
      await this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.SDKIntegrated,
        value: true,
      });
    }
  }

  /**
   * Delete a specific environment data.
   * Requires ThonLabs access and access token.
   *
   * @param environmentId - The ID of the environment
   * @param key - The key of the data
   */
  @Delete('/:key')
  @ThonLabsOnly()
  @HasEnvAccess({ param: 'envId' })
  async delete(
    @Param('envId') environmentId: string,
    @Param('key') key: string,
  ) {
    const data = await this.environmentDataService.delete(environmentId, key);

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }
  }
}
