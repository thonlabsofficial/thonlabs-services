import { Controller, Get } from '@nestjs/common';
import { PublicRoute } from '@/auth/modules/auth/decorators/auth.decorator';

@Controller('app')
export class AppController {
  constructor() {}

  /**
   * Ping the app.
   */
  @Get('/ping')
  @PublicRoute()
  async ping() {
    return {
      message: 'pong',
    };
  }
}
