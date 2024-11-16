import { Injectable, Logger } from '@nestjs/common';
import { EnvironmentDataService } from '../../environments/services/environment-data.service';
import { Resend } from 'resend';
import { DataReturn } from '@/utils/interfaces/data-return';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { EmailDomain, EmailDomainStatus } from '../interfaces/email-domain';
import { EnvironmentDataKeys } from '../../environments/constants/environment-data';
import { DatabaseService } from '../../shared/database/database.service';

type FetchReturn = {
  id: string;
  value: EmailDomain;
  environmentId: string;
};

@Injectable()
export class EmailDomainService {
  private readonly logger = new Logger(EmailDomainService.name);
  private resend: Resend;

  constructor(
    private environmentDataService: EnvironmentDataService,
    private databaseService: DatabaseService,
  ) {
    this.resend = new Resend(process.env.EMAIL_PROVIDER_API_KEY);
  }

  async setDomain(
    environmentId: string,
    domain: string,
  ): Promise<DataReturn<Pick<EmailDomain, 'status' | 'records'>>> {
    const tlDomainsCount = await this.databaseService.environmentData.count({
      where: {
        key: EnvironmentDataKeys.EmailTemplateDomain,
        value: {
          path: ['domain'],
          equals: domain,
        },
      },
    });

    if (tlDomainsCount > 0) {
      this.logger.error(`Domain ${domain} already registered at thonlabs`);
      return {
        statusCode: StatusCodes.Conflict,
        error: ErrorMessages.DomainAlreadyRegisteredAccount,
      };
    }

    const registeredDomains = await this.listPartnerDomains();
    if (registeredDomains.some((d) => d.name === domain)) {
      this.logger.error(`Domain ${domain} already registered at partner`);
      return {
        statusCode: StatusCodes.Conflict,
        error: ErrorMessages.DomainAlreadyRegistered,
      };
    }

    const { data: resendData, error: resendError } =
      await this.resend.domains.create({
        name: domain,
        region: 'us-east-1',
      });

    if (resendError) {
      this.logger.error(`Resend Error: ${JSON.stringify(resendError)}`);
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    if (!resendData) {
      this.logger.error('Resend Error: No data returned');
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    // Delete the old domain
    await this.deleteDomain(environmentId);

    const data = await this.environmentDataService.upsert(environmentId, {
      key: EnvironmentDataKeys.EmailTemplateDomain,
      value: {
        refId: resendData.id,
        domain,
        status: EmailDomainStatus.Verifying,
        records: resendData.records,
        region: resendData.region,
      },
    });

    const value = data?.data?.value as unknown as EmailDomain;

    // Start verification process on Resend and activate cron job to validate the DNS records
    await this.verifyDomain(environmentId);

    return {
      data: {
        status: value.status,
        records: value.records,
      },
    };
  }

  async getDomain(
    environmentId: string,
  ): Promise<
    DataReturn<Pick<EmailDomain, 'status' | 'records' | 'region' | 'domain'>>
  > {
    const { data } = await this.environmentDataService.get<EmailDomain>(
      environmentId,
      EnvironmentDataKeys.EmailTemplateDomain,
    );

    if (!data) {
      return {
        statusCode: StatusCodes.NotFound,
        error: ErrorMessages.NoDomainRegistered,
      };
    }

    return {
      data: {
        status: data.status,
        records: data.records,
        region: data.region,
        domain: data.domain,
      },
    };
  }

  async deleteDomain(environmentId: string) {
    const { data } = await this.environmentDataService.get<EmailDomain>(
      environmentId,
      EnvironmentDataKeys.EmailTemplateDomain,
    );

    if (!data) {
      return;
    }

    await Promise.all([
      this.resend.domains.remove(data.refId),
      this.environmentDataService.delete(
        environmentId,
        EnvironmentDataKeys.EmailTemplateDomain,
      ),
    ]);

    this.logger.log(`Domain ${data.domain} deleted from ThonLabs and partner`);
  }

  async verifyDomain(
    environmentId: string,
  ): Promise<DataReturn<Pick<EmailDomain, 'status'>>> {
    const { data, ...rest } =
      await this.environmentDataService.get<EmailDomain>(
        environmentId,
        EnvironmentDataKeys.EmailTemplateDomain,
      );

    if (rest.error) {
      return rest;
    }

    if (data?.status === EmailDomainStatus.Verified) {
      return {
        statusCode: StatusCodes.Forbidden,
        error: ErrorMessages.DomainAlreadyVerified,
      };
    }

    await this.resend.domains.verify(data.refId);

    const { data: resendData } = await this.resend.domains.get(data.refId);

    this.logger.log(
      `Domain ${data.domain} verification started in partner (ENV: ${environmentId})`,
    );

    let status: EmailDomainStatus = EmailDomainStatus.Verifying;

    if (resendData.status === 'verified') {
      status = EmailDomainStatus.Verified;
    } else if (resendData.status === 'failed') {
      status = EmailDomainStatus.Failed;
    }

    await this.updateStatus(environmentId, status);

    this.logger.log(
      `Domain ${data.domain} status updated to ${status} (ENV: ${environmentId})`,
    );

    return {
      data: {
        status,
      },
    };
  }

  async updateStatus(
    environmentId: string,
    status: EmailDomainStatus,
  ): Promise<DataReturn> {
    const { data } = await this.environmentDataService.get<EmailDomain>(
      environmentId,
      EnvironmentDataKeys.EmailTemplateDomain,
    );

    const partnerDomain = await this.getPartnerDomain(data.refId);

    if (!partnerDomain) {
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    await this.environmentDataService.upsert(environmentId, {
      key: EnvironmentDataKeys.EmailTemplateDomain,
      value: {
        ...data,
        records: partnerDomain.records,
        status,
      },
    });
  }

  async updateRecordsFromPartner(environmentId: string) {
    const { data } = await this.environmentDataService.get<EmailDomain>(
      environmentId,
      EnvironmentDataKeys.EmailTemplateDomain,
    );
    const partnerDomain = await this.getPartnerDomain(data.refId);

    if (!partnerDomain) {
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    await this.environmentDataService.upsert(environmentId, {
      key: EnvironmentDataKeys.EmailTemplateDomain,
      value: {
        ...data,
        records: partnerDomain.records,
      },
    });
  }

  async fetchByStatus(
    status: EmailDomainStatus,
  ): Promise<DataReturn<FetchReturn[]>> {
    const domains = await this.databaseService.environmentData.findMany({
      where: {
        key: EnvironmentDataKeys.EmailTemplateDomain,
        value: {
          path: ['status'],
          equals: status,
        },
      },
      select: {
        id: true,
        value: true,
        environmentId: true,
      },
    });

    return {
      data: domains as unknown as FetchReturn[],
    };
  }

  async getPartnerDomain(id: string) {
    const { data } = await this.resend.domains.get(id);
    return data;
  }

  async listPartnerDomains() {
    const { data } = await this.resend.domains.list();
    return data?.data || [];
  }
}
