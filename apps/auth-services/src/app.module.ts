import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SchemaValidatorGuard } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { AuthModule } from '@/auth/modules/auth/auth.module';
import { AuthValidationGuard } from '@/auth/modules/auth/decorators/auth-validation.decorator';
import { NeedsSecretKeyGuard } from '@/auth/modules/shared/decorators/needs-secret-key.decorator';
import { UserModule } from '@/auth/modules/users/user.module';
import { ProjectModule } from '@/auth/modules/projects/project.module';
import { EnvironmentModule } from '@/auth/modules/environments/environment.module';
import { EmailModule } from '@/auth/modules/emails/email.module';
import { TokenStorageModule } from '@/auth/modules/token-storage/token-storage.module';
import { NeedsPublicKeyGuard } from '@/auth/modules/shared/decorators/needs-public-key.decorator';
import { ThonLabsOnlyGuard } from './modules/shared/decorators/thon-labs-only.decorator';
import { UserOwnsEnvGuard } from './modules/shared/decorators/user-owns-env.decorator';
import { UserOwnsProjectGuard } from './modules/shared/decorators/user-owns-project.decorator';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    JwtModule.register({
      global: true,
    }),
    AuthModule,
    UserModule,
    ProjectModule,
    EnvironmentModule,
    EmailModule,
    TokenStorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthValidationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: NeedsPublicKeyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: NeedsSecretKeyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SchemaValidatorGuard,
    },
    { provide: APP_GUARD, useClass: ThonLabsOnlyGuard },
    { provide: APP_GUARD, useClass: UserOwnsEnvGuard },
    { provide: APP_GUARD, useClass: UserOwnsProjectGuard },
  ],
})
export class AppModule {}
