/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const port = process.env.PORT || 3000;

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development'
        ? ['*']
        : ['https://portal.thonlabs.io'],
  });

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
