import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Request,
} from '@nestjs/common';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import {
  createProjectValidator,
  deleteProjectValidator,
  updateGeneralInfoValidator,
} from '@/auth/modules/projects/validators/project-validators';
import { ProjectService } from '../services/project.service';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';
import { EnvironmentService } from '../../environments/services/environment.service';
import { NeedsAuth } from '@/auth/modules/auth/decorators/auth.decorator';
import decodeSession from '@/utils/services/decode-session';
import { UserOwnsProject } from '@/auth/modules/shared/decorators/user-owns-project.decorator';

@Controller('projects')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private environmentService: EnvironmentService,
  ) {}

  @Post('/')
  @NeedsAuth()
  @SchemaValidator(createProjectValidator)
  async create(@Body() payload, @Request() req) {
    const userId = req.session.id;

    const result = await this.projectService.create({
      ...payload,
      userId,
    });

    if (result.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return {
      id: result.data.project.id,
      appName: result.data.project.appName,
      environment: {
        id: result.data.environment.id,
        name: result.data.environment.name,
        appURL: result.data.environment.appURL,
      },
    };
  }

  @Get('/')
  @NeedsAuth()
  async fetch(@Request() req) {
    const userId = req.session.id;

    const result = await this.projectService.fetchByOwnerId(userId);

    return { items: result?.data || [] };
  }

  @Get('/:id')
  @NeedsAuth()
  @UserOwnsProject()
  async get(@Param('id') id: string) {
    const result = await this.projectService.getById(id);

    return result?.data;
  }

  @Delete('/:id')
  @NeedsAuth()
  @UserOwnsProject()
  @SchemaValidator(deleteProjectValidator, ['params'])
  async delete(@Param('id') id: string, @Request() req) {
    const userId = req.session.id;

    const result = await this.projectService.delete(id, userId);

    if (result?.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }

  @Get('/:id/environments')
  @NeedsAuth()
  @UserOwnsProject()
  async fetchEnvironments(@Param('id') id: string, @Req() req) {
    const { sub } = decodeSession(req);

    const { data: items } = await this.environmentService.fetchByProjectId(
      id,
      sub,
    );

    return { items };
  }

  @Patch('/:id')
  @NeedsAuth()
  @UserOwnsProject()
  @SchemaValidator(updateGeneralInfoValidator)
  async updateGeneralInfo(
    @Param('id') id: string,
    @Body() payload,
    @Req() req,
  ) {
    const { sub } = decodeSession(req);

    const result = await this.projectService.updateGeneralInfo(id, {
      ...payload,
      userOwnerId: sub,
    });

    if (result.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result.data;
  }

  @Get('/:id/integration-status')
  @NeedsAuth()
  @UserOwnsProject()
  async getIntegrationStatus(@Param('id') id: string) {
    const result = await this.projectService.getIntegrationStatus(id);

    return result.data;
  }
}
