import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import {
  NewOrganizationFormData,
  UpdateOrganizationFormData,
} from '../validators/organization-validators';
import { DataReturn } from '@/utils/interfaces/data-return';
import { Organization } from '@prisma/client';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { CDNService } from '../../shared/services/cdn.service';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(
    private databaseService: DatabaseService,
    private cdnService: CDNService,
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
