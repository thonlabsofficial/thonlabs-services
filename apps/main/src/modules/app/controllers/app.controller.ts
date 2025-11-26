import { Controller, Get } from '@nestjs/common';

@Controller('app')
export class AppController {
  constructor() {}

  /**
   * Ping the app.
   */
  @Get('/ping')
  async ping() {
    return {
      message: 'pong',
    };
  }
}
