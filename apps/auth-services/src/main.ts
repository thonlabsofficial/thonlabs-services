/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const httpsOptions =
    process.env.NODE_ENV === 'development' && process.env.CERT
      ? {
          key: fs.readFileSync(
            path.resolve(__dirname, '../../../certs/thonlabs.key'),
          ),
          cert: fs.readFileSync(
            path.resolve(__dirname, '../../../certs/thonlabs.crt'),
          ),
        }
      : null;

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
    rawBody: true,
    cors: {
      origin: true,
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
