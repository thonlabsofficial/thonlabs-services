import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { DataReturn } from '@/utils/interfaces/data-return';
import { Environment, Project } from '@prisma/client';
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

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);

  constructor(
    private databaseService: DatabaseService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
  ) {}

  async getById(id: string): Promise<DataReturn<Environment>> {
    const environment = await this.databaseService.environment.findUnique({
      where: { id },
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
      },
    });

    return { data: environment as Environment };
  }

  async getBySecretKey(
    environmentId: string,
    secretKey: string,
  ): Promise<DataReturn<Environment>> {
    const encryptSecretKey = await Crypt.encrypt(
      secretKey,
      Crypt.generateIV(environmentId),
      process.env.ENCODE_SECRET_KEYS_SECRET,
    );
    const environment = await this.databaseService.environment.findUnique({
      where: { secretKey: encryptSecretKey },
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
    environmentId: string,
    publicKey: string,
    userId: string = null,
  ): Promise<DataReturn<Partial<Environment & { project: Partial<Project> }>>> {
    const encryptPublicKey = await Crypt.encrypt(
      publicKey,
      Crypt.generateIV(environmentId),
      process.env.ENCODE_SECRET,
    );

    const environment = await this.databaseService.environment.findUnique({
      where: {
        publicKey: encryptPublicKey,
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
        authKey: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
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
    return this.getByPublicKey(
      req.headers['tl-env-id'],
      req.headers['tl-public-key'],
    );
  }

  async getPublicKey(environmentId: string) {
    const environment = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
    });

    const iv = Crypt.generateIV(environmentId);
    const publicKey = await Crypt.decrypt(
      environment.publicKey,
      iv,
      process.env.ENCODE_SECRET,
    );

    return publicKey;
  }

  async getSecretKey(environmentId: string) {
    const environment = await this.databaseService.environment.findUnique({
      where: { id: environmentId },
    });

    const iv = Crypt.generateIV(environmentId);
    const secretKey = await Crypt.decrypt(
      environment.secretKey,
      iv,
      process.env.ENCODE_SECRET_KEYS_SECRET,
    );

    return secretKey;
  }

  async updatePublicKey(environmentId: string) {
    const iv = Crypt.generateIV(environmentId);
    let plainPublicKey = rand(3);
    let publicKey = await Crypt.encrypt(
      plainPublicKey,
      iv,
      process.env.ENCODE_SECRET,
    );

    const keysExists = await this.databaseService.environment.findFirst({
      where: {
        OR: [
          {
            publicKey: {
              equals: publicKey,
            },
          },
        ],
      },
    });
    if (keysExists) {
      this.logger.warn('Public key already exists, generating new...');
      plainPublicKey = rand(3);
      publicKey = await Crypt.encrypt(
        plainPublicKey,
        iv,
        process.env.ENCODE_SECRET,
      );
    }

    await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        publicKey,
      },
    });

    return { publicKey: plainPublicKey };
  }

  async updateSecretKey(environmentId: string) {
    const iv = Crypt.generateIV(environmentId);
    let plainSecretKey = `tl_${rand(5)}`;
    let secretKey = await Crypt.encrypt(
      plainSecretKey,
      iv,
      process.env.ENCODE_SECRET_KEYS_SECRET,
    );

    const keysExists = await this.databaseService.environment.findFirst({
      where: {
        OR: [
          {
            secretKey: {
              equals: secretKey,
            },
          },
        ],
      },
    });
    if (keysExists) {
      this.logger.warn('Secret key already exists, generating new...');
      plainSecretKey = `tl_${rand(5)}`;
      secretKey = await Crypt.encrypt(
        plainSecretKey,
        iv,
        process.env.ENCODE_SECRET_KEYS_SECRET,
      );
    }

    await this.databaseService.environment.update({
      where: {
        id: environmentId,
      },
      data: {
        secretKey,
      },
    });

    return { secretKey: plainSecretKey };
  }

  async create(payload: {
    name: string;
    projectId: string;
    appURL: string;
  }): Promise<DataReturn<Environment>> {
    const projectExists = await this.projectService.getById(payload.projectId);

    if (!projectExists) {
      this.logger.warn('Project not found', payload.projectId);

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

    const iv = Crypt.generateIV(id);

    let keys = await Promise.all([
      Crypt.encrypt(rand(3), iv, process.env.ENCODE_SECRET),
      Crypt.encrypt(`tl_${rand(5)}`, iv, process.env.ENCODE_SECRET_KEYS_SECRET),
      Crypt.encrypt(`${rand(8)}`, iv, process.env.ENCODE_AUTH_KEYS_SECRET),
    ]);

    // Again, just to guarantee :)
    const keysExists = await this.databaseService.environment.findFirst({
      where: {
        OR: [
          {
            publicKey: {
              equals: keys[0],
            },
          },
          {
            secretKey: {
              equals: keys[1],
            },
          },
          {
            authKey: {
              equals: keys[2],
            },
          },
        ],
      },
    });
    if (keysExists) {
      this.logger.warn('Some key already exists, generating new for all...');
      keys = await Promise.all([
        Crypt.encrypt(rand(3), iv, process.env.ENCODE_SECRET),
        Crypt.encrypt(
          `tl_${rand(5)}`,
          iv,
          process.env.ENCODE_SECRET_KEYS_SECRET,
        ),
        Crypt.encrypt(`${rand(8)}`, iv, process.env.ENCODE_AUTH_KEYS_SECRET),
      ]);
    }

    const environment = await this.databaseService.environment.create({
      data: {
        id,
        publicKey: keys[0],
        secretKey: keys[1],
        authKey: keys[2],
        name: prepareString(payload.name),
        projectId: payload.projectId,
        appURL: payload.appURL,
      },
    });

    this.logger.warn(
      `"${environment.name}" environment created`,
      environment.id,
    );

    return { data: environment };
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
          },
        },
      },
    });

    return count > 0;
  }
}
