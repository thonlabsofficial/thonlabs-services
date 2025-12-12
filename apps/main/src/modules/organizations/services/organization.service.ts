import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import {
  NewOrganizationFormData,
  UpdateOrganizationFormData,
} from '../validators/organization-validators';
import { DataReturn } from '@/utils/interfaces/data-return';
import { Organization } from '@prisma/client';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { CDNService } from '@/auth/modules/shared/services/cdn.service';
import { UserDetails } from '@/auth/modules/users/models/user';
import { MetadataValueService } from '@/auth/modules/metadata/services/metadata-value.service';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(
    private databaseService: DatabaseService,
    private cdnService: CDNService,
    private metadataValueService: MetadataValueService,
  ) {}

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

    if (data.metadata) {
      await this.metadataValueService.manageMetadata(
        organization.id,
        'Organization',
        data.metadata,
      );
    }

    return { data: organization };
  }

  async update(
    id: string,
    environmentId: string,
    data: UpdateOrganizationFormData,
  ): Promise<DataReturn<Organization>> {
    if (data.domains?.length > 0) {
      const currentDomains =
        (
          (await this.databaseService.organization.findFirst({
            where: { id },
            select: {
              domains: true,
            },
          })) as { domains: { domain: string }[] }
        )?.domains || [];

      const { data: registeredDomains } = await this._validateDomains(
        environmentId,
        data.domains
          .filter((domain) => !!domain.domain)
          .filter(
            (domain) => !currentDomains.some((d) => d.domain === domain.domain),
          )
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

    const organization = await this.databaseService.organization.update({
      where: { id },
      data: {
        name: data.name,
        domains: data.domains,
      },
    });

    if (data.metadata) {
      await this.metadataValueService.manageMetadata(
        organization.id,
        'Organization',
        data.metadata,
      );
    }

    return { data: organization };
  }

  async updateLogo(
    organizationId: string,
    file: Express.Multer.File,
  ): Promise<DataReturn> {
    const { data: organization } = await this.getById(organizationId);

    if (organization.logo) {
      await this.cdnService.deleteFile(
        `organizations/${organizationId}/images/${organization.logo}`,
      );
    }

    const { data, statusCode, error } = await this.cdnService.uploadFile(
      `organizations/${organizationId}/images`,
      file,
    );

    if (error) {
      return {
        statusCode,
        error,
      };
    }

    await this.databaseService.organization.update({
      where: { id: organizationId },
      data: { logo: data.fileName },
    });

    return {};
  }

  async isValidUserOrganization(
    environmentId: string,
    email: string,
  ): Promise<DataReturn<string | null>> {
    const domains = (await this.databaseService.organization.findMany({
      where: {
        environmentId,
      },
      select: {
        id: true,
        domains: true,
      },
    })) as { id: string; domains: { domain: string }[] }[];

    const emailDomain = email.split('@')[1];

    const organization = domains.find(({ domains }) =>
      domains.some((d) => d.domain === emailDomain),
    );

    return { data: organization?.id ? organization.id : null };
  }

  async getById(id: string): Promise<DataReturn<Organization>> {
    const organization = await this.databaseService.organization.findFirst({
      where: { id },
    });

    return { data: organization };
  }

  async delete(organizationId: string): Promise<DataReturn> {
    const organization = await this.databaseService.organization.findFirst({
      where: { id: organizationId },
      select: {
        logo: true,
      },
    });

    if (!organization) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.OrganizationNotFound,
      };
    }

    if (organization?.logo) {
      await this.cdnService.deleteFile(
        `organizations/${organizationId}/images/${organization.logo}`,
      );
    }

    await this.databaseService.organization.delete({
      where: { id: organizationId },
    });

    return {};
  }

  async deleteLogo(organizationId: string): Promise<DataReturn> {
    const organization = await this.databaseService.organization.findFirst({
      where: { id: organizationId },
      select: {
        logo: true,
      },
    });

    if (!organization?.logo) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.OrganizationNotFound,
      };
    }

    await this.cdnService.deleteFile(
      `organizations/${organizationId}/images/${organization.logo}`,
    );

    await this.databaseService.organization.update({
      where: { id: organizationId },
      data: { logo: null },
    });

    return {};
  }

  getLogoUrl(organization: Organization): string {
    return `https://${process.env.EXT_FILES_BUCKET_NAME}/organizations/${organization.id}/images/${organization.logo}`;
  }

  async updateStatus(
    organizationId: string,
    active: boolean,
  ): Promise<DataReturn<Organization>> {
    const organization = await this.databaseService.organization.update({
      where: { id: organizationId },
      data: { active },
    });

    this.logger.log(
      `Organization ${organizationId} has been ${active ? 'activated' : 'deactivated'}`,
    );

    return { data: organization };
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

  async getUsers(
    organizationId: string,
    filters: { active?: boolean },
  ): Promise<DataReturn<UserDetails[]>> {
    let users: UserDetails[] = (await this.databaseService.user.findMany({
      where: {
        organizationId,
        ...(filters.active && { active: filters.active }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        profilePicture: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        emailConfirmed: true,
        invitedAt: true,
        lastSignIn: true,
      },
    })) as UserDetails[];

    users = await Promise.all(
      users.map(async (user) => {
        const metadata = await this.metadataValueService.getMetadataByContext(
          [user.id],
          'User',
        );
        return { ...user, metadata: metadata?.[user.id] || {} };
      }),
    );

    return { data: users };
  }

  async validateEnvOrganizationById(
    environmentId: string,
    organizationId: string,
  ) {
    const organization = await this.databaseService.organization.findFirst({
      select: {
        id: true,
        active: true,
      },
      where: { id: organizationId, environmentId },
    });

    if (!organization) {
      this.logger.error(
        `Organization not found in environment (ENV: ${environmentId}, OID: ${organizationId})`,
      );
      return {
        statusCode: StatusCodes.Forbidden,
      };
    }

    if (!organization.active) {
      this.logger.error(
        `Organization is not active in environment (ENV: ${environmentId}, OID: ${organizationId})`,
      );
      return {
        statusCode: StatusCodes.Forbidden,
      };
    }

    return { data: organization };
  }
}
