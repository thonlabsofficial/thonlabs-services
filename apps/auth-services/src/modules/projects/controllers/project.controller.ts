import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import {
  createProjectValidator,
  deleteProjectValidator,
} from '@/auth/modules/projects/validators/project-validators';
import { ProjectService } from '../services/project.service';
import { exceptionsMapper } from '@/utils/enums/errors-metadata';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post('/')
  @SchemaValidator(createProjectValidator)
  async create(@Body() payload, @Request() req) {
    const userId = req.authUser.userId;

    const result = await this.projectService.create({
      ...payload,
      userId,
    });

    if (result.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }

    return result.data;
  }

  @Get('/')
  async fetch(@Request() req) {
    const userId = req.authUser.userId;

    const result = await this.projectService.fetchByOwnerId(userId);

    return { items: result?.data || [] };
  }

  @Get('/:id')
  async get(@Param('id') id: string, @Request() req) {
    const userId = req.authUser.userId;

    const result = await this.projectService.getByIdAndOwnerId(id, userId);

    return result?.data;
  }

  @Delete('/:id')
  @SchemaValidator(deleteProjectValidator, ['params'])
  async delete(@Param('id') id: string, @Request() req) {
    const userId = req.authUser.userId;

    const result = await this.projectService.delete(id, userId);

    if (result?.error) {
      throw new exceptionsMapper[result.statusCode](result.error);
    }
  }
}
