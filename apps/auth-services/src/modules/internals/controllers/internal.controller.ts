import { Body, Controller, Param, Post } from '@nestjs/common';
import { NeedsInternalKey } from '@/auth/modules/shared/decorators/needs-internal-key.decorator';
import { PublicRoute } from '@/auth/modules/auth/decorators/auth.decorator';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import { SchemaValidator } from '@/auth/modules/shared/decorators/schema-validator.decorator';
import {
  JoinWaitlistForm,
  joinWaitlistFormSchema,
} from '@/auth/modules/internals/validators/internal-validators';
import { EnvironmentDataKeys } from '@/auth/modules/environments/constants/environment-data';
import {
  AudienceService,
  AudiencesIDs,
} from '@/auth/modules/emails/services/audience.service';
import {
  ErrorMessages,
  exceptionsMapper,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { AuthProviders } from '@prisma/client';
import { UserService } from '@/auth/modules/users/services/user.service';
import { ProjectService } from '@/auth/modules/projects/services/project.service';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';

@Controller('internals')
export class InternalController {
  constructor(
    private environmentDataService: EnvironmentDataService,
    private audienceService: AudienceService,
    private userService: UserService,
    private projectService: ProjectService,
    private environmentService: EnvironmentService,
  ) {}

  @Post('/init-owner')
  @PublicRoute()
  @NeedsInternalKey()
  public async signUpOwner(
    @Body() payload: { password: string; environmentId: string },
  ) {
    const { data: user } = await this.userService.createOwner({
      password: payload.password,
    });

    const {
      data: { project, environment },
    } = await this.projectService.create({
      appName: 'ThonLabs',
      userId: user.id,
      appURL: 'https://thonlabs.io',
      main: true,
    });

    const [, , publicKey] = await Promise.all([
      this.userService.setEnvironment(user.id, environment.id),
      this.environmentService.updateAuthSettings(environment.id, {
        ...environment,
        authProvider: AuthProviders.EmailAndPassword,
        enableSignUp: true,
        enableSignUpB2BOnly: false,
        styles: { primaryColor: '#e11d48' },
      }),
      await this.environmentService.getPublicKey(environment.id),
    ]);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      project: {
        id: project.id,
      },
      environment: {
        id: environment.id,
        publicKey,
      },
    };
  }

  /**
   * Adds a user to the waitlist for a specific environment.
   *
   * @param {JoinWaitlistForm} payload - The user's information including full name, email, and current provider.
   * @param {string} environmentId - The ID of the environment to add the user to.
   * @throws {Error} If there's an issue adding the user to the audience.
   * @returns {Promise<void>}
   */
  @Post('/waitlist/:environmentId')
  @PublicRoute()
  @NeedsInternalKey()
  @SchemaValidator(joinWaitlistFormSchema)
  public async addToWaitlist(
    @Body() payload: JoinWaitlistForm,
    @Param('environmentId') environmentId: string,
  ) {
    const { data: waitlist } = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.Waitlist,
    );

    const waitlistArray = Array.isArray(waitlist) ? waitlist : [];

    const userAlreadyInWaitlist = waitlistArray.find(
      (user: { email: string }) => user.email === payload.email,
    );

    if (userAlreadyInWaitlist) {
      throw new exceptionsMapper[StatusCodes.Conflict](
        ErrorMessages.UserAlreadyInWaitlist,
      );
    }

    const data = await this.audienceService.addToAudience(
      AudiencesIDs.Waitlist,
      {
        fullName: payload.fullName,
        email: payload.email,
      },
    );

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    await this.environmentDataService.upsert(environmentId, {
      key: EnvironmentDataKeys.Waitlist,
      value: [
        ...waitlistArray,
        {
          email: payload.email,
          fullName: payload.fullName,
          currentProvider: payload.currentProvider,
        },
      ],
    });
  }
}
