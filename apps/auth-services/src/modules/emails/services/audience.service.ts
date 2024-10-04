import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { maskData, MaskDataTypes } from '@/utils/services/mask-data';
import { DataReturn } from '@/utils/interfaces/data-return';
import { StatusCodes } from '@/utils/enums/errors-metadata';
import { EmailInternalFromTypes, EmailService } from './email.service';
import { getFirstName } from '@/utils/services/names-helpers';
import { JoinWaitlistDone } from '@/emails/internals/join-waitlist-done';

export enum AudiencesIDs {
  Waitlist = '9171d01f-f98e-4dcf-ab4b-bf45918a2601',
}

@Injectable()
export class AudienceService {
  private readonly logger = new Logger(AudienceService.name);

  private resend: Resend;

  constructor(private readonly emailService: EmailService) {
    this.resend = new Resend(process.env.EMAIL_PROVIDER_API_KEY);
  }

  async addToAudience(
    audienceId: AudiencesIDs,
    { fullName, email }: { fullName: string; email: string },
  ): Promise<DataReturn> {
    const [firstName, lastName] = fullName.split(' ');

    try {
      const { data } = await this.resend.contacts.create({
        audienceId,
        email,
        firstName,
        lastName,
        unsubscribed: false,
      });

      if (data?.id) {
        await this.emailService.sendInternal({
          from: EmailInternalFromTypes.FOUNDER,
          to: `${fullName} <${email}>`,
          subject: 'You joined ThonLabs waitlist',
          content: JoinWaitlistDone({
            userFirstName: getFirstName(fullName),
          }),
        });
      }

      this.logger.log(
        `Added ${maskData(MaskDataTypes.Email, email)} to audience ${audienceId}`,
      );
    } catch (e) {
      this.logger.error(
        `Error on adding ${maskData(MaskDataTypes.Email, email)} to audience ${audienceId}`,
        e,
      );

      return {
        statusCode: StatusCodes.Internal,
        error: e.message,
      };
    }
  }
}
