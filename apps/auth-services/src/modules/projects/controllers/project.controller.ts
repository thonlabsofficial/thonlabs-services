import { Body, Controller, Delete, Param, Post, Request } from '@nestjs/common';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import {
  createProjectValidator,
  deleteProjectValidator,
} from '@/auth/modules/projects/validators/project-validators';
import { ProjectService } from '../services/project.service';

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

    if (result.code) {
      return result;
    }

    return result.data;
  }

  @Delete('/:id')
  @SchemaValidator(deleteProjectValidator, ['params'])
  async delete(@Param('id') id: string, @Request() req) {
    const userId = req.authUser.userId;

    const result = await this.projectService.delete(id, userId);

    if (result?.code) {
      return result;
    }
  }
}
