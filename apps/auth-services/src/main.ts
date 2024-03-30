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
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    cors: {
      origin:
        process.env.NODE_ENV === 'development'
          ? ['http://localhost:3000']
          : ['https://app.thonlabs.co', 'https://app-dev.thonlabs.co'],
    },
  });
  const port = process.env.PORT || 3000;

  app.use(helmet());
  app.use(cookieParser());

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port} (ENV: ${process.env.NODE_ENV})`,
  );
}

bootstrap();
