import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { AuthProviders, Environment, Project } from '@prisma/client';
import { ProjectService } from '@/auth/modules/projects/services/project.service';
import {
  StatusCodes,
  ErrorCodes,
  ErrorMessages,
} from '@/utils/enums/errors-metadata';
import normalizeString from '@/utils/services/normalize-string';
import rand from '@/utils/services/rand';
import prepareString from '@/utils/services/prepare-string';
import Crypt from '@/utils/services/crypt';
import ms from 'ms';
import { EmailTemplateService } from '@/auth/modules/emails/services/email-template.service';
import { EnvironmentDataService } from '@/auth/modules/environments/services/environment-data.service';
import {
  EnvironmentDataKeys,
  EnvironmentStyles,
} from '@/auth/modules/environments/constants/environment-data';
import { SSOSocialProvider } from '../../auth/interfaces/sso-creds';
import { EnvironmentCredentialService } from './environment-credential.service';
import { CDNService } from '../../shared/services/cdn.service';

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);

  constructor(
    private databaseService: DatabaseService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    private emailTemplateService: EmailTemplateService,
    private environmentDataService: EnvironmentDataService,
    private environmentCredentialService: EnvironmentCredentialService,
    private cdnService: CDNService,
  ) {}

  async getById(id: string): Promise<DataReturn<Environment>> {
    const environment = await this.databaseService.environment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        tokenExpiration: true,
        refreshTokenExpiration: true,
        authProvider: true,
        appURL: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainStartValidationAt: true,
        customDomainLastValidationAt: true,
        customDomainTXT: true,
        customDomainTXTStatus: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
      },
    });

    if (environment?.customDomainTXT) {
      environment.customDomainTXT = await Crypt.decrypt(
        environment.customDomainTXT,
        process.env.ENCODE_SECRET,
      );
    }

    return { data: environment as Environment };
  }

  async getDetailedById(id: string) {
    const environment = await this.databaseService.environment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        active: true,
        tokenExpiration: true,
        refreshTokenExpiration: true,
        appURL: true,
        customDomain: true,
        customDomainStatus: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
        project: true,
      },
    });

    return environment;
  }

  async belongsToUser(
    id: string,
    userId: string,
  ): Promise<DataReturn<boolean>> {
    const environment = await this.databaseService.environment.count({
      where: { id, project: { userOwnerId: userId } },
    });

    const belongsToUser = environment > 0;

    if (!belongsToUser) {
      return {
        statusCode: StatusCodes.NotFound,
      };
    }

    return { data: belongsToUser };
  }

  async getBySecretKey(
    environmentId: string,
    secretKey: string,
  ): Promise<DataReturn<Environment>> {
    const secretKeyHash = await Crypt.hash256(
      secretKey,
      process.env.ENCODE_SECRET,
    );

    const environment = await this.databaseService.environment.findUnique({
      where: { id: environmentId, secretKeyHash },
    });

    if (!environment) {
      this.logger.warn('Environment not found from secret key');
      return {
        error: ErrorMessages.Unauthorized,
        statusCode: StatusCodes.Unauthorized,
      };
    }

    return { data: environment };
  }

  async getByPublicKey(
    publicKey: string,
    userId: string = null,
  ): Promise<DataReturn<Partial<Environment & { project: Partial<Project> }>>> {
    const publicKeyHash = await Crypt.hash256(
      publicKey,
      process.env.ENCODE_SECRET,
    );

    const environment = await this.databaseService.environment.findUnique({
      where: {
        publicKeyHash,
        // If exists user id, then validates also by it
        ...(userId
          ? {
              users: {
                some: {
                  id: userId,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        active: true,
        tokenExpiration: true,
        refreshTokenExpiration: true,
        appURL: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
        authProvider: true,
        project: {
          select: {
            id: true,
            appName: true,
          },
        },
      },
    });

    if (!environment) {
      this.logger.warn('Environment not found from public key');
      return {
        error: ErrorMessages.Unauthorized,
        statusCode: StatusCodes.Unauthorized,
      };
    }

    return { data: environment };
  }

  async getByPublicKeyFromRequest(req) {
    return this.getByPublicKey(req.headers['tl-public-key']);
  }

  async getPublicKey(environmentId: string) {
    const environment = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
    });

    const publicKey = await Crypt.decrypt(
      environment.publicKey,
      process.env.ENCODE_SECRET,
    );

    return publicKey;
  }

  async getSecretKey(environmentId: string) {
    const environment = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
    });

    const secretKey = await Crypt.decrypt(
      environment.secretKey,
      process.env.ENCODE_SECRET,
    );

    return secretKey;
  }

  async updatePublicKey(environmentId: string) {
    let plainPublicKey = rand(3);
    let keys = await Promise.all([
      Crypt.hash256(plainPublicKey, process.env.ENCODE_SECRET),
      Crypt.encrypt(plainPublicKey, process.env.ENCODE_SECRET),
    ]);

    const keysExists = await this.databaseService.environment.findFirst({
      where: {
        OR: [
          {
            publicKeyHash: {
              equals: keys[0],
            },
          },
        ],
      },
    });
    if (keysExists) {
      this.logger.warn('Public key already exists, generating new...');
      plainPublicKey = rand(3);
      keys = await Promise.all([
        Crypt.hash256(plainPublicKey, process.env.ENCODE_SECRET),
        Crypt.encrypt(plainPublicKey, process.env.ENCODE_SECRET),
      ]);
    }

    await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        publicKeyHash: keys[0],
        publicKey: keys[1],
      },
    });

    return { publicKey: plainPublicKey };
  }

  async updateSecretKey(environmentId: string) {
    let plainSecretKey = `tl_${rand(5)}`;
    let keys = await Promise.all([
      Crypt.hash256(plainSecretKey, process.env.ENCODE_SECRET),
      Crypt.encrypt(plainSecretKey, process.env.ENCODE_SECRET),
    ]);

    const keysExists = await this.databaseService.environment.findFirst({
      where: {
        OR: [
          {
            secretKeyHash: {
              equals: keys[0],
            },
          },
        ],
      },
    });
    if (keysExists) {
      this.logger.warn('Secret key already exists, generating new...');
      plainSecretKey = `tl_${rand(5)}`;
      keys = await Promise.all([
        Crypt.hash256(plainSecretKey, process.env.ENCODE_SECRET),
        Crypt.encrypt(plainSecretKey, process.env.ENCODE_SECRET),
      ]);
    }

    await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        secretKeyHash: keys[0],
        secretKey: keys[1],
      },
    });

    return { secretKey: plainSecretKey };
  }

  async create(payload: {
    name: string;
    projectId: string;
    appURL: string;
    copyFromEnvironmentId?: string;
    copyOptions?: {
      authBuilderOptions?: boolean;
      credentials?: boolean;
      emailTemplates?: boolean;
      metadataModels?: boolean;
    };
  }): Promise<DataReturn<Environment>> {
    const { data: projectExists } = await this.projectService.getById(
      payload.projectId,
    );

    if (!projectExists) {
      this.logger.error(`Project ${payload.projectId} not found`);

      return {
        statusCode: StatusCodes.NotFound,
        code: ErrorCodes.ResourceNotFound,
        error: ErrorMessages.ProjectNotFound,
      };
    }

    const normalizedName = normalizeString(payload.name);
    let id = normalizeString(`env-${normalizedName}-${rand(1)}`);

    // Just to guarantee :)
    const { data: envExists } = await this.getById(id);
    if (envExists) {
      this.logger.warn('ID already exists, generating new...');
      id = normalizeString(`env-${normalizedName}-${rand(1)}`);
    }

    const publicKey = rand(3);
    const secretKey = `tl_${rand(5)}`;

    let keys = await Promise.all([
      Crypt.encrypt(publicKey, process.env.ENCODE_SECRET), // Public key
      Crypt.hash256(publicKey, process.env.ENCODE_SECRET), // Public key hash
      Crypt.encrypt(secretKey, process.env.ENCODE_SECRET), // Secret key
      Crypt.hash256(secretKey, process.env.ENCODE_SECRET), // Secret key hash
    ]);

    // Again, just to guarantee :)
    const keysExists = await this.databaseService.environment.findFirst({
      where: {
        OR: [
          {
            publicKeyHash: {
              equals: keys[1],
            },
          },
          {
            secretKeyHash: {
              equals: keys[3],
            },
          },
        ],
      },
    });
    if (keysExists) {
      this.logger.warn('Some key already exists, generating new for all...');
      keys = await Promise.all([
        Crypt.encrypt(publicKey, process.env.ENCODE_SECRET), // Public key
        Crypt.hash256(publicKey, process.env.ENCODE_SECRET), // Public key hash
        Crypt.encrypt(secretKey, process.env.ENCODE_SECRET), // Secret key
        Crypt.hash256(secretKey, process.env.ENCODE_SECRET), // Secret key hash
      ]);
    }

    const environment = await this.databaseService.environment.create({
      data: {
        id,
        publicKey: keys[0],
        publicKeyHash: keys[1],
        secretKey: keys[2],
        secretKeyHash: keys[3],
        name: prepareString(payload.name),
        projectId: payload.projectId,
        appURL: payload.appURL,
      },
    });

    const copyResult = await this._defineEnvironmentResources({
      sourceEnvironmentId: payload.copyFromEnvironmentId,
      targetEnvironmentId: environment.id,
      copyOptions: payload.copyOptions,
    });

    if (copyResult?.error) {
      return copyResult;
    }

    this.logger.warn(
      `"${environment.name}" environment copied from ${payload.copyFromEnvironmentId} (ENV: ${environment.id})`,
    );

    return { data: environment };
  }

  private async _defineEnvironmentResources({
    sourceEnvironmentId,
    targetEnvironmentId,
    copyOptions,
  }: {
    sourceEnvironmentId: string;
    targetEnvironmentId: string;
    copyOptions?: {
      authBuilderOptions?: boolean;
      credentials?: boolean;
      emailTemplates?: boolean;
      metadataModels?: boolean;
    };
  }): Promise<DataReturn> {
    try {
      const promises: Promise<any>[] = [];

      // Copy auth builder options (styles, signup settings, etc.)
      if (copyOptions?.authBuilderOptions) {
        const authBuilderKeys = [
          EnvironmentDataKeys.EnableSignUp,
          EnvironmentDataKeys.EnableSignUpB2BOnly,
          EnvironmentDataKeys.Styles,
          EnvironmentDataKeys.ActiveSSOProviders,
          EnvironmentDataKeys.EnvironmentLogo,
        ];

        const environmentQuery =
          await this.databaseService.environment.findUnique({
            where: { id: sourceEnvironmentId },
            select: {
              authProvider: true,
              tokenExpiration: true,
              refreshTokenExpiration: true,
            },
          });
        const authBuilderEnvDataQuery =
          this.databaseService.environmentData.findMany({
            where: {
              environmentId: sourceEnvironmentId,
              key: { in: authBuilderKeys },
            },
            select: {
              key: true,
              value: true,
            },
          });

        const [environment, authBuilderData] = await Promise.all([
          environmentQuery,
          authBuilderEnvDataQuery,
        ]);

        promises.push(
          this.databaseService.environment.update({
            where: {
              id: targetEnvironmentId,
            },
            data: {
              authProvider: environment.authProvider,
              tokenExpiration: environment.tokenExpiration,
              refreshTokenExpiration: environment.refreshTokenExpiration,
            },
          }),
        );

        authBuilderData.forEach((data) => {
          promises.push(
            this.environmentDataService.upsert(targetEnvironmentId, {
              key: data.key,
              value: data.value,
            }),
          );
        });

        this.logger.log(
          `Auth builder options copied from ${sourceEnvironmentId} (ENV: ${targetEnvironmentId})`,
        );
      } else {
        promises.push(
          this.updateAuthSettings(targetEnvironmentId, {
            authProvider: AuthProviders.MagicLogin,
            tokenExpiration: '60m',
            refreshTokenExpiration: '10d',
            enableSignUp: true,
            enableSignUpB2BOnly: false,
            styles: { primaryColor: '#e11d48' },
            activeSSOProviders: [],
          }),
        );

        this.logger.log(
          `Auth builder options created (ENV: ${targetEnvironmentId})`,
        );
      }

      // Copy credentials
      if (copyOptions?.credentials) {
        const credentialsData =
          await this.databaseService.environmentData.findFirst({
            where: {
              environmentId: sourceEnvironmentId,
              key: EnvironmentDataKeys.Credentials,
            },
            select: {
              key: true,
              value: true,
            },
          });

        if (credentialsData) {
          promises.push(
            this.environmentDataService.upsert(targetEnvironmentId, {
              key: credentialsData.key,
              value: credentialsData.value,
            }),
          );

          this.logger.log(
            `Credentials copied from ${sourceEnvironmentId} (ENV: ${targetEnvironmentId})`,
          );
        }
      } else {
        promises.push(
          this.environmentDataService.upsert(targetEnvironmentId, {
            key: EnvironmentDataKeys.Credentials,
            value: {},
          }),
        );

        this.logger.log(`Credentials created (ENV: ${targetEnvironmentId})`);
      }

      // Copy metadata models
      if (copyOptions?.metadataModels) {
        const metadataModels =
          await this.databaseService.metadataModel.findMany({
            where: { environmentId: sourceEnvironmentId },
            select: {
              name: true,
              key: true,
              description: true,
              type: true,
              options: true,
              context: true,
            },
          });

        if (metadataModels.length > 0) {
          // Delete existing metadata models in target environment
          promises.push(
            this.databaseService.metadataModel.deleteMany({
              where: { environmentId: targetEnvironmentId },
            }),
          );

          // Create new metadata models
          promises.push(
            this.databaseService.metadataModel.createMany({
              data: metadataModels.map((model) => ({
                ...model,
                environmentId: targetEnvironmentId,
              })),
            }),
          );

          this.logger.log(
            `Metadata models copied from ${sourceEnvironmentId} (ENV: ${targetEnvironmentId})`,
          );
        }
      }

      // Copy email templates
      if (copyOptions?.emailTemplates) {
        const emailTemplates =
          await this.databaseService.emailTemplate.findMany({
            where: { environmentId: sourceEnvironmentId },
            select: {
              type: true,
              name: true,
              subject: true,
              fromName: true,
              fromEmail: true,
              preview: true,
              replyTo: true,
              enabled: true,
              content: true,
              contentJSON: true,
              bodyStyles: true,
            },
          });

        if (emailTemplates.length > 0) {
          // Delete existing email templates in target environment
          promises.push(
            this.databaseService.emailTemplate.deleteMany({
              where: { environmentId: targetEnvironmentId },
            }),
          );

          // Create new email templates
          promises.push(
            this.databaseService.emailTemplate.createMany({
              data: emailTemplates.map((template) => ({
                ...template,
                environmentId: targetEnvironmentId,
              })),
            }),
          );
        }

        this.logger.log(
          `Email templates copied from ${sourceEnvironmentId} (ENV: ${targetEnvironmentId})`,
        );
      } else {
        promises.push(
          this.emailTemplateService.createDefaultTemplates(targetEnvironmentId),
        );

        this.logger.log(
          `Email templates created (ENV: ${targetEnvironmentId})`,
        );
      }

      await Promise.all(promises);

      this.logger.log(`All promises resolved (ENV: ${targetEnvironmentId})`);
    } catch (error) {
      this.logger.error(
        `Error copying resources from ${sourceEnvironmentId} (ENV: ${targetEnvironmentId})`,
        error,
      );

      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }
  }

  async fetch(): Promise<
    DataReturn<{ id: string; name: string; active: boolean; appURL: string }[]>
  > {
    const environments = await this.databaseService.environment.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        appURL: true,
      },
    });

    return {
      data: environments,
    };
  }

  async fetchByProjectId(
    projectId: string,
    userOwnerId: string,
  ): Promise<
    DataReturn<{ id: string; name: string; active: boolean; appURL: string }[]>
  > {
    const environments = await this.databaseService.environment.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        appURL: true,
      },
      where: {
        projectId,
        project: {
          userOwnerId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      data: environments,
    };
  }

  async userBelongsTo(userId: string, environmentId: string) {
    const count = await this.databaseService.environment.count({
      where: {
        id: environmentId,
        users: {
          some: {
            id: userId,
            environmentId,
          },
        },
      },
    });

    return count > 0;
  }

  async updateAuthSettings(
    environmentId: string,
    payload: {
      authProvider: AuthProviders;
      tokenExpiration: string;
      refreshTokenExpiration?: string;
      enableSignUp: boolean;
      enableSignUpB2BOnly: boolean;
      styles: EnvironmentStyles;
      activeSSOProviders: SSOSocialProvider[];
    },
  ): Promise<DataReturn> {
    /*
      Validates tokens expiration
    */
    if (ms(payload.tokenExpiration) < 300000) {
      return {
        statusCode: StatusCodes.BadRequest,
        error: 'Token expiration should have at least 5 minutes',
      };
    }

    if (
      payload.refreshTokenExpiration &&
      ms(payload.refreshTokenExpiration) < 1800000
    ) {
      return {
        statusCode: StatusCodes.BadRequest,
        error: 'Refresh token expiration should have at least 30 minutes',
      };
    }

    /*
      Update SSO status
    */
    const { data: activeSSOProviders } = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.ActiveSSOProviders,
    );
    const currentProviders: Set<SSOSocialProvider> = new Set(
      activeSSOProviders || [],
    );
    const newProviders = new Set(payload.activeSSOProviders);

    const removedProviders = [...currentProviders].filter(
      (x) => !newProviders.has(x),
    );
    const addedProviders = [...newProviders].filter(
      (x) => !currentProviders.has(x),
    );

    let removeProvidersPromises;
    let addProvidersPromises;

    if (removedProviders.length > 0) {
      removeProvidersPromises = removedProviders.map((provider) =>
        this.environmentCredentialService.updateCredentialStatus(
          environmentId,
          provider,
          { active: false },
        ),
      );
    }

    if (addedProviders.length > 0) {
      addProvidersPromises = addedProviders.map((provider) =>
        this.environmentCredentialService.updateCredentialStatus(
          environmentId,
          provider,
          { active: true },
        ),
      );
    }

    /*
      Call all services in parallel
    */
    await Promise.all([
      this.databaseService.environment.update({
        where: {
          id: environmentId,
        },
        data: {
          authProvider: payload.authProvider,
          tokenExpiration: payload.tokenExpiration,
          refreshTokenExpiration: payload.refreshTokenExpiration,
        },
      }),
      ...(removeProvidersPromises || []),
      ...(addProvidersPromises || []),
      this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.EnableSignUp,
        value: payload.enableSignUp,
      }),
      this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.EnableSignUpB2BOnly,
        value: payload.enableSignUpB2BOnly,
      }),
      this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.Styles,
        value: payload.styles,
      }),
      this.environmentDataService.upsert(environmentId, {
        key: EnvironmentDataKeys.ActiveSSOProviders,
        value: payload.activeSSOProviders,
      }),
    ]);

    this.logger.log(`Updated auth settings for ${environmentId}`);
  }

  async updateGeneralSettings(
    environmentId: string,
    payload: { name: string; appURL: string },
  ) {
    await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        name: payload.name,
        appURL: payload.appURL,
      },
    });

    this.logger.log(`Updated general settings for ${environmentId}`);
  }

  async delete(environmentId: string) {
    await Promise.all([
      this.databaseService.environment.delete({
        where: {
          id: environmentId,
        },
      }),
    ]);

    this.logger.log(`Environment ${environmentId} deleted`);
  }

  async validateURL(appURL: string, userOwnerId: string) {
    const urlExists = await this.databaseService.environment.findFirst({
      where: {
        appURL,
        active: true,
        project: { active: true, userOwnerId },
      },
      include: {
        project: true,
      },
    });

    if (urlExists) {
      this.logger.warn(
        `URL already exists: ${urlExists.appURL} (ENV: ${urlExists.name} ${urlExists.id})`,
      );

      return {
        statusCode: StatusCodes.Conflict,
        error: `URL already exists in "${urlExists.project.appName}" project for "${urlExists.name}" environment`,
      };
    }
  }

  async updateGeneralSettingsLogo(
    environmentId: string,
    file: Express.Multer.File,
  ): Promise<DataReturn<{ fileId: string; fileName: string }>> {
    const { data: logo } = await this.environmentDataService.get(
      environmentId,
      EnvironmentDataKeys.EnvironmentLogo,
    );

    if (logo) {
      await this.cdnService.deleteFile(
        `environments/${environmentId}/images/${logo}`,
      );
    }

    const { data, statusCode, error } = await this.cdnService.uploadFile(
      `environments/${environmentId}/images`,
      file,
    );

    if (error) {
      return {
        statusCode,
        error,
      };
    }

    await this.environmentDataService.upsert(environmentId, {
      key: EnvironmentDataKeys.EnvironmentLogo,
      value: data?.fileName,
    });

    return { data };
  }
}
