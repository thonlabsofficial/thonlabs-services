import 'multer';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { SchemaValidatorGuard } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import { AuthGuard } from '@/auth/modules/auth/decorators/auth.decorator';
import { SecretKeyOrThonLabsOnlyGuard } from '@/auth/modules/shared/decorators/secret-key-or-thon-labs-user.decorator';
import { NeedsPublicKeyGuard } from '@/auth/modules/shared/decorators/needs-public-key.decorator';
import { ThonLabsOnlyGuard } from '@/auth/modules/shared/decorators/thon-labs-only.decorator';
import { HasEnvAccessGuard } from '@/auth/modules/shared/decorators/has-env-access.decorator';
import { UserOwnsProjectGuard } from '@/auth/modules/shared/decorators/user-owns-project.decorator';
import { PublicKeyOrThonLabsOnlyGuard } from '@/auth/modules/shared/decorators/public-key-or-thon-labs-user.decorator';
import { VerifyDomainGuard } from '@/auth/modules/shared/decorators/verify-domain.decorator';
import { NeedsInternalKeyGuard } from '@/auth/modules/shared/decorators/needs-internal-key.decorator';
import { AuthService } from './modules/auth/services/auth.service';
import { AuthController } from './modules/auth/controllers/auth.controller';
import { DashboardController } from './modules/dashboard/controllers/dashboard.controller';
import { EmailTemplateController } from './modules/emails/controllers/email-template.controller';
import { AudienceService } from './modules/emails/services/audience.service';
import { EmailTemplateService } from './modules/emails/services/email-template.service';
import { EmailService } from './modules/emails/services/email.service';
import { EnvironmentDataController } from './modules/environments/controllers/environment-data.controller';
import { EnvironmentDomainController } from './modules/environments/controllers/environment-domain.controller';
import { EnvironmentController } from './modules/environments/controllers/environment.controller';
import { EnvironmentDataService } from './modules/environments/services/environment-data.service';
import { EnvironmentDomainService } from './modules/environments/services/environment-domain.service';
import { EnvironmentHelper } from './modules/environments/services/environment.helper';
import { EnvironmentScheduler } from './modules/environments/services/environment.scheduler';
import { EnvironmentService } from './modules/environments/services/environment.service';
import { InternalController } from './modules/internals/controllers/internal.controller';
import { OrganizationService } from './modules/organizations/services/organization.service';
import { OrganizationController } from './modules/organizations/controllers/organization.controller';
import { ProjectController } from './modules/projects/controllers/project.controller';
import { ProjectService } from './modules/projects/services/project.service';
import { CronService } from './modules/shared/cron.service';
import { DatabaseService } from './modules/shared/database/database.service';
import { CDNService } from './modules/shared/services/cdn.service';
import { HTTPService } from './modules/shared/services/http.service';
import { TokenStorageService } from './modules/token-storage/services/token-storage.service';
import { UserController } from './modules/users/controllers/user.controller';
import { UserService } from './modules/users/services/user.service';
import { EnvironmentCredentialController } from './modules/environments/controllers/environment-credential.controller';
import { EnvironmentCredentialService } from './modules/environments/services/environment-credential.service';
import { EmailProviderController } from './modules/emails/controllers/email-provider.controller';
import { EmailProviderService } from './modules/emails/services/email-provider.service';
import { UserDataController } from './modules/users/controllers/user-data.controller';
import { UserDataService } from './modules/users/services/user-data.service';
import { UserSubscriptionController } from './modules/users/controllers/user-subscription.controller';
import { AppDataController } from './modules/app/controllers/app-data.controller';
import { AppDataService } from './modules/app/services/app-data.service';
import { UserSubscriptionService } from './modules/users/services/user-subscription.service';

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

    DatabaseService,
    CronService,
    CDNService,
    HTTPService,

    AuthService,
    EmailTemplateService,
    EmailService,
    AudienceService,
    EnvironmentService,
    EnvironmentDomainService,
    EnvironmentScheduler,
    EnvironmentHelper,
    EnvironmentDataService,
    OrganizationService,
    ProjectService,
    TokenStorageService,
    UserService,
    EnvironmentCredentialService,
    EmailProviderService,
    UserDataService,
    AppDataService,
    UserSubscriptionService,
  ],
  controllers: [
    AuthController,
    DashboardController,
    EmailTemplateController,
    EmailProviderController,
    EnvironmentController,
    EnvironmentDomainController,
    EnvironmentDataController,
    EnvironmentCredentialController,
    InternalController,
    OrganizationController,
    ProjectController,
    UserController,
    UserDataController,
    UserSubscriptionController,
    AppDataController,
  ],
})
export class AppModule {}
