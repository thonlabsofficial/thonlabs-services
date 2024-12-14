import 'multer';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { SchemaValidatorGuard } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { AuthModule } from '@/auth/modules/auth/auth.module';
import { AuthGuard } from '@/auth/modules/auth/decorators/auth.decorator';
import { SecretKeyOrThonLabsOnlyGuard } from '@/auth/modules/shared/decorators/secret-key-or-thon-labs-user.decorator';
import { UserModule } from '@/auth/modules/users/user.module';
import { ProjectModule } from '@/auth/modules/projects/project.module';
import { EnvironmentModule } from '@/auth/modules/environments/environment.module';
import { EmailModule } from '@/auth/modules/emails/email.module';
import { TokenStorageModule } from '@/auth/modules/token-storage/token-storage.module';
import { NeedsPublicKeyGuard } from '@/auth/modules/shared/decorators/needs-public-key.decorator';
import { ThonLabsOnlyGuard } from '@/auth/modules/shared/decorators/thon-labs-only.decorator';
import { HasEnvAccessGuard } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { UserOwnsProjectGuard } from '@/auth/modules/shared/decorators/user-owns-project.decorator';
import { PublicKeyOrThonLabsOnlyGuard } from '@/auth/modules/shared/decorators/public-key-or-thon-labs-user.decorator';
import { VerifyDomainGuard } from '@/auth/modules/shared/decorators/verify-domain.decorator';
import { NeedsInternalKeyGuard } from '@/auth/modules/shared/decorators/needs-internal-key.decorator';
import { InternalsModule } from '@/auth/modules/internals/internals.module';
import { OrganizationModule } from '@/auth/modules/organizations/organization.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: seconds(120),
          limit: 100,
        },
      ],
    }),
    JwtModule.register({
      global: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    ProjectModule,
    EnvironmentModule,
    EmailModule,
    TokenStorageModule,
    InternalsModule,
    OrganizationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: VerifyDomainGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SecretKeyOrThonLabsOnlyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PublicKeyOrThonLabsOnlyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: NeedsPublicKeyGuard,
    },
    { provide: APP_GUARD, useClass: ThonLabsOnlyGuard },
    { provide: APP_GUARD, useClass: HasEnvAccessGuard },
    { provide: APP_GUARD, useClass: UserOwnsProjectGuard },
    {
      provide: APP_GUARD,
      useClass: NeedsInternalKeyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SchemaValidatorGuard,
    },
  ],
})
export class AppModule {}
