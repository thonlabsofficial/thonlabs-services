import { Injectable, Logger } from '@nestjs/common';
import { UserDataService } from '@/auth/modules/users/services/user-data.service';
import {
  ErrorMessages,
  exceptionsMapper,
  StatusCodes,
} from '@/utils/enums/errors-metadata';
import { UserService } from '@/auth/modules/users/services/user.service';
import { UserDataKeys } from '@/auth/modules/users/constants/user-data';
import {
  UpsertUserSubscriptionPayload,
  upsertUserSubscriptionValidator,
} from '@/auth/modules/users/validators/user-subscription-validators';
import { DataReturn } from '@/utils/interfaces/data-return';

@Injectable()
export class UserSubscriptionService {
  private readonly logger = new Logger(UserSubscriptionService.name);

  constructor(
    private userDataService: UserDataService,
    private userService: UserService,
  ) {}

  /**
   * Upserts user subscription.
   *
   * @param {Object} payload - The parameters for "upserting" user subscription.
   * @param {string} payload.userEmail - The thonlabs user email.
   * @param {string} payload.sessionRefId - The stripe session reference ID.
   * @param {string} payload.paymentRefId - The stripe payment reference ID (subscription or payment).
   * @param {string} payload.userRefId - The stripe user reference ID.
   * @param {string} payload.mode - The stripe mode (subscription or payment).
   * @param {UserSubscriptionType} payload.type - The type of the subscription.
   */
  async upsert(
    payload: UpsertUserSubscriptionPayload,
  ): Promise<DataReturn<{ userId: string; email: string }>> {
    const { userEmail, sessionRefId, paymentRefId, userRefId, mode, type } =
      upsertUserSubscriptionValidator.parse(payload);

    const user = await this.userService.getOurByEmail(userEmail);

    if (!user) {
      this.logger.error(`User ${userEmail} not found`);
      throw new exceptionsMapper[StatusCodes.NotFound](
        ErrorMessages.UserNotFound,
      );
    }

    const data = await this.userDataService.upsert(user.id, {
      key: UserDataKeys.SubscriptionType,
      value: {
        sessionRefId,
        paymentRefId,
        userRefId,
        mode,
        type,
      },
    });

    if (data?.statusCode) {
      throw new exceptionsMapper[data.statusCode](data.error);
    }

    this.logger.log(`User ${user.id} subscribed to ${type}`);

    return {
      data: {
        userId: user.id,
        email: user.email,
      },
    };
  }
}
