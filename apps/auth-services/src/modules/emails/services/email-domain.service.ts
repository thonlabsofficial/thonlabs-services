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
    const { data: currentDomain } = await this.getDomain(environmentId);

    if (currentDomain) {
      return {
        statusCode: StatusCodes.Conflict,
        error: ErrorMessages.DomainAlreadyRegisteredAccount,
      };
    }

    const registeredDomains = await this.listPartnerDomains();

    if (registeredDomains.some((d) => d.name === domain)) {
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

    const data = await this.environmentDataService.upsert(environmentId, {
      id: EnvironmentDataKeys.EmailTemplateDomain,
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

    await Promise.all([
      this.resend.domains.remove(data.refId),
      this.environmentDataService.delete(
        environmentId,
        EnvironmentDataKeys.EmailTemplateDomain,
      ),
    ]);
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

    let status: EmailDomainStatus = EmailDomainStatus.Verifying;

    if (resendData.status === 'verified') {
      status = EmailDomainStatus.Verified;
    } else if (resendData.status === 'failed') {
      status = EmailDomainStatus.Failed;
    }

    if (status !== EmailDomainStatus.Verifying) {
      await this.updateStatus(environmentId, status);
    }

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
      id: EnvironmentDataKeys.EmailTemplateDomain,
      value: {
        ...data,
        status,
      },
    });
  }

  async fetch(status: EmailDomainStatus): Promise<DataReturn<FetchReturn[]>> {
    const domains = await this.databaseService.environmentData.findMany({
      where: {
        id: EnvironmentDataKeys.EmailTemplateDomain,
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
