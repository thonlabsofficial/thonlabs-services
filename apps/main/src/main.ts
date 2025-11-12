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
import dotenv from 'dotenv';

import { AppModule } from './app.module';

// Load environment variables in development
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  // Try to load .env.local file
  const envPath = path.resolve(__dirname, '../.env.local');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    Logger.log(`🔧 Loaded environment variables from: ${envPath}`);
  } else {
    Logger.warn(`⚠️  No .env.local file found at: ${envPath}`);
    Logger.warn(
      `💡 Create a .env.local file with your environment variables for development`,
    );
  }
}

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
  const port = process.env.PORT || 3100;

  app.use(helmet());
  app.use(cookieParser());

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port} (ENV: ${process.env.NODE_ENV})`,
  );
}

bootstrap();
