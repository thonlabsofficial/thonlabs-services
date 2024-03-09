import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import decodeSession from '@/utils/services/decode-session';
import { UserService } from '../../users/services/user.service';

const DECORATOR_KEY = 'UserOwnsProject';

export const UserOwnsProject = (param: string = 'id') =>
  SetMetadata(DECORATOR_KEY, { param });

@Injectable()
export class UserOwnsProjectGuard implements CanActivate {
  private readonly logger = new Logger(UserOwnsProjectGuard.name);

  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const decoratorProps = this.reflector.get(
      DECORATOR_KEY,
      context.getHandler(),
    );

    if (!decoratorProps) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const session = decodeSession(req);

    const projectFromParam = req?.params?.[decoratorProps?.param];

    if (!projectFromParam) {
      this.logger.error(`Project parameter is missing`);
      res.status(StatusCodes.Forbidden).json({
        error: ErrorMessages.Forbidden,
      });
      return false;
    }

    const userOwnsProject = await this.userService.ownsProject(
      session.sub,
      projectFromParam,
    );

    if (!userOwnsProject) {
      this.logger.error(
        `User ${session.sub} not allowed for Project ${projectFromParam}`,
      );
    }

    return userOwnsProject;
  }
}
