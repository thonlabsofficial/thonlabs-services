import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Request,
} from '@nestjs/common';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import {
  createProjectValidator,
  deleteProjectValidator,
} from '@/auth/modules/projects/validators/project-validators';
import { ProjectService } from '../services/project.service';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';
import { EnvironmentService } from '../../environments/services/environment.service';
import { ThonLabsOnly } from '../../shared/decorators/thon-labs-only.decorator';
import decodeSession from '@/utils/services/decode-session';
import { UserOwnsProject } from '../../shared/decorators/user-owns-project.decorator';

@Controller('projects')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private environmentService: EnvironmentService,
  ) {}

  @Post('/')
  @ThonLabsOnly()
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
  @ThonLabsOnly()
  async fetch(@Request() req) {
    const userId = req.session.id;

    const result = await this.projectService.fetchByOwnerId(userId);

    return { items: result?.data || [] };
  }

  @Get('/:id')
  @ThonLabsOnly()
  @UserOwnsProject()
  async get(@Param('id') id: string, @Request() req) {
    const userId = req.session.id;

    const result = await this.projectService.getByIdAndOwnerId(id, userId);

    return result?.data;
  }

  @Delete('/:id')
  @ThonLabsOnly()
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
  @ThonLabsOnly()
  @UserOwnsProject()
  async fetchEnvironments(@Param('id') id: string, @Req() req) {
    const { sub } = decodeSession(req);

    const { data: items } = await this.environmentService.fetchByProjectId(
      id,
      sub,
    );

    return { items };
  }
}
