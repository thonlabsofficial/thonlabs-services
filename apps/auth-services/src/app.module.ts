import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SchemaValidatorGuard } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { AuthModule } from '@/auth/modules/auth/auth.module';
import { AuthValidationGuard } from '@/auth/modules/auth/decorators/auth-validation.decorator';
import { ClientsModule } from './modules/clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    JwtModule.register({
      global: true,
      secret: process.env.AUTHENTICATION_SECRET,
    }),
    AuthModule,
    ClientsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SchemaValidatorGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthValidationGuard,
    },
  ],
})
export class AppModule {}
