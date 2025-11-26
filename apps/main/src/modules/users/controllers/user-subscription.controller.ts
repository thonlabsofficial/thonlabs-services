import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import stripe from 'stripe';
import { UserSubscriptionService } from '@/auth/modules/users/services/user-subscription.service';
import { UserSubscriptionType } from '@/auth/modules/users/constants/user-data';
import { EmailService } from '@/auth/modules/emails/services/email.service';
import { InternalEmailFrom } from '@/auth/modules/emails/constants/email';
import { SubscriptionCompleted } from '@/emails/internals/subscription-completed';

@Controller('users/subscriptions')
export class UserSubscriptionController {
  private readonly logger = new Logger(UserSubscriptionController.name);
  private readonly webhookSecret = process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET;

  constructor(
    private userSubscriptionService: UserSubscriptionService,
    private emailService: EmailService,
  ) {}

  @Post('/webhook')
  async webhook(@Req() req) {
    try {
      const event = await this._handleWebhook(req);

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as stripe.Checkout.Session;
          let paymentRefId = '';
          let type = null;

          if (session.mode === 'subscription') {
            paymentRefId = session.subscription as string;
            type = UserSubscriptionType.Pro;
          } else if (session.mode === 'payment') {
            paymentRefId = session.payment_intent as string;
            type = UserSubscriptionType.ProLifetime;
          }

          const { data } = await this.userSubscriptionService.upsert({
            userEmail: session.customer_details?.email,
            sessionRefId: session.id,
            paymentRefId,
            userRefId: session.customer as string,
            mode: session.mode as 'subscription' | 'payment',
            type,
          });

          await this.emailService.sendInternal({
            from: InternalEmailFrom.Founder,
            to: data.email,
            subject: 'Welcome to ThonLabs Pro',
            content: SubscriptionCompleted,
            metadata: {
              userId: data.userId,
            },
          });
          break;

        case 'customer.subscription.updated':
          const subscriptionUpdated = event.data.object as stripe.Subscription;

          if (subscriptionUpdated.status === 'past_due') {
            /* 
              TODO: @gus - Past due status
              Here the payment is overdue, Stripe is configured to attempt
              charging 4 times in a week. Update to past_due and send an email.
            */
            // console.log('⚠️ Subscription status changed to PAST DUE:', {
            //   subscriptionId: subscriptionUpdated.id,
            //   userRefId: subscriptionUpdated.customer,
            //   status: subscriptionUpdated.status,
            //   metadata: subscriptionUpdated.metadata,
            // });
          } else if (subscriptionUpdated.status === 'unpaid') {
            /* 
              TODO: @gus - Unpaid status
              Here the payment is unpaid, Stripe is configured to attempt
              charging 4 times in a week. Update to unpaid and send an email.
            */
            // console.log(
            //   `⚠️ Subscription status changed to ${subscriptionUpdated.status.toUpperCase()}:`,
            //   {
            //     subscriptionId: subscriptionUpdated.id,
            //     userRefId: subscriptionUpdated.customer,
            //     status: subscriptionUpdated.status,
            //     metadata: subscriptionUpdated.metadata,
            //   },
            // );
          }
          break;

        case 'payment_intent.payment_failed':
          /*
            TODO: @gus - Payment failed
            Here the payment failed, Stripe is configured to attempt
            charging 4 times in a week. Update to failed and send an email.
          */
          // const failedPaymentIntent = event.data.object as stripe.PaymentIntent;
          // console.log('❌ Payment intent failed:', {
          //   userRefId: failedPaymentIntent.customer,
          //   lastPaymentError: failedPaymentIntent.last_payment_error,
          //   metadata: failedPaymentIntent.metadata,
          // });
          break;

        case 'customer.subscription.deleted':
          /* 
            TODO: @gus - Subscription canceled
            Here the subscription was canceled manually.
          */
          // const deletedSubscription = event.data.object as stripe.Subscription;
          // console.log('🗑️ Subscription canceled:', {
          //   subscriptionId: deletedSubscription.id,
          //   userRefId: deletedSubscription.customer,
          //   canceledAt: new Date(deletedSubscription.canceled_at * 1000),
          //   cancellationReason:
          //     deletedSubscription.cancellation_details?.reason,
          //   metadata: deletedSubscription.metadata,
          // });
          break;

        default:
          if (process.env.NODE_ENV === 'development') {
            this.logger.log(
              '[DEV_MODE] Stripe unhandled event type:',
              event.type,
            );
          }
          break;
      }
    } catch (err) {
      this.logger.error(`User subscription webhook failed`, err);
      throw err;
    }
  }

  private async _handleWebhook(req: any): Promise<stripe.Event> {
    if (!this.webhookSecret) {
      this.logger.error('Payment provider webhook secret is not set');
      throw new UnauthorizedException();
    }

    try {
      const body = req.rawBody || req.body;
      const signature = req.headers['stripe-signature'];

      return stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `Payment provider webhook signature verification failed.`,
        err.message,
      );
      throw new BadRequestException(err.message);
    }
  }
}
