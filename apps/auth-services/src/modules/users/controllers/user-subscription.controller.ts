import { Controller, Get, Req } from '@nestjs/common';

@Controller('users/subscriptions')
export class UserSubscriptionController {
  constructor() {}

  @Get('/webhook')
  async webhook(@Req() req) {
    const { body } = req;
    console.log(body);
  }
}
