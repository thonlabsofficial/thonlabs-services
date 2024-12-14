import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { NewOrganizationFormData } from '../validators/organization-validators';
import { DataReturn } from '@/utils/interfaces/data-return';
import { Organization } from '@prisma/client';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  private readonly cdn: S3Client;

  constructor(private databaseService: DatabaseService) {
    this.cdn = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async create(
    environmentId: string,
    data: NewOrganizationFormData,
  ): Promise<DataReturn<Organization>> {
    if (data.domains?.length > 0) {
      const { data: registeredDomains } = await this._validateDomains(
        environmentId,
        data.domains
          .filter((domain) => !!domain.domain)
          .map((domain) => domain.domain),
      );

      if (registeredDomains.length > 0) {
        this.logger.error(
          `Domain already registered: ${JSON.stringify(
            registeredDomains.map((domain) => domain.domain),
          )}`,
        );
        return {
          statusCode: StatusCodes.BadRequest,
          error: ErrorMessages.DomainAlreadyRegistered,
        };
      }
    }

    const organization = await this.databaseService.organization.create({
      data: {
        name: data.name,
        domains: data.domains,
        environmentId,
      },
    });

    this.logger.log(`Organization created: ${organization.id}`);

    return { data: organization };
  }

  async updateLogo(
    organizationId: string,
    file: Express.Multer.File,
  ): Promise<DataReturn> {
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const fileName = `logo.${fileExtension}`;

    try {
      await this.cdn.send(
        new PutObjectCommand({
          Bucket: process.env.EXT_FILES_BUCKET_NAME,
          Key: `organizations/${organizationId}/images/${fileName}`,
          Body: Buffer.from(file.buffer),
          ContentType: file.mimetype,
        }),
      );

      this.logger.log(`Logo uploaded for organization: ${organizationId}`);
    } catch (error) {
      this.logger.error('Error uploading logo to S3', error);
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    await this.databaseService.organization.update({
      where: { id: organizationId },
      data: { logo: fileName },
    });

    return {};
  }

  async fetch(environmentId: string) {
    const organizations = await this.databaseService.organization.findMany({
      where: {
        environmentId,
      },
      select: {
        id: true,
        name: true,
        domains: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return { data: { items: organizations } };
  }

  async isValidUserOrganization(
    environmentId: string,
    email: string,
  ): Promise<DataReturn<boolean>> {
    const domains = (await this.databaseService.organization.findMany({
      where: {
        environmentId,
      },
      select: {
        domains: true,
      },
    })) as { domains: { domain: string }[] }[];

    const emailDomain = email.split('@')[1];

    const isValid = domains.some(({ domains }) =>
      domains.some((d) => d.domain === emailDomain),
    );

    return { data: isValid };
  }

  private async _validateDomains(
    environmentId: string,
    domains: string[],
  ): Promise<DataReturn<{ domain: string }[]>> {
    const organizations = await this.databaseService.organization.findMany({
      where: {
        environmentId,
      },
      select: {
        domains: true,
      },
    });

    if (organizations.length === 0) {
      return { data: [] };
    }

    const organizationDomains = organizations.flatMap(
      (organization) => organization.domains as { domain: string }[],
    );
    const existingDomains = organizationDomains.filter((domain) =>
      domains.includes(domain.domain),
    );

    return { data: existingDomains };
  }
}
