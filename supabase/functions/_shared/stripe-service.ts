import Stripe from "npm:stripe@^17.0.0";
import { DatabaseService, SCHEMA_NAME, stripePlanToAppPlan, stripeStatusToAppStatus, SubscriptionStatus } from "./mod.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});


export class StripeService {
  databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  async createCheckoutSession(sessionData: Stripe.Checkout.SessionCreateParams) {
    const session = await stripe.checkout.sessions.create(sessionData);
    return session;
  }

  async getCheckoutSession(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  }

  async updateCheckoutSession(sessionId: string, updates: Stripe.Checkout.SessionUpdateParams) {
    const session = await stripe.checkout.sessions.update(sessionId, updates);
    return session;
  }

  async getSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  }
  async cancelSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.del(subscriptionId);
    return subscription;
  }
  async updateSubscription(subscriptionId: string, updates: Stripe.SubscriptionUpdateParams) {
    const subscription = await stripe.subscriptions.update(subscriptionId, updates);
    return subscription;
  }
  async getCustomer(customerId: string) {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  }

  async handleInvoiceCreated(data: any) {
    try {
      const subId = data.subscription;
      const customerId = data.customer;
      const stripeSub = await stripe.subscriptions.retrieve(subId);
      const user = await this.databaseService.getByColumn('email', data.customer_email, SCHEMA_NAME.PROFILES, 'id');
      if (!user) return { error: true, message: "User not found" };

      const isTrial = data.amount_paid === 0 && stripeSub.trial_start && stripeSub.trial_end;
      const payload: any = {
        user_id: user.id,
        plan_type: stripePlanToAppPlan[stripeSub.items.data[0].price.recurring.interval.toLowerCase()],
        recurring: stripeSub.cancel_at_period_end === false,
        current_period_start: new Date(stripeSub.current_period_start * 1000),
        current_period_end: new Date(stripeSub.current_period_end * 1000),
        stripe_customer_id: customerId,
        stripe_subscription_id: subId,
        status: stripeStatusToAppStatus[stripeSub.status] ?? SubscriptionStatus.PENDING,
      };
      if (isTrial) {
        payload.trial_start = new Date(stripeSub.trial_start * 1000);
        payload.trial_end = new Date(stripeSub.trial_end * 1000);
        const now = Math.floor(Date.now() / 1000);
        payload.trial_remaining_days = Math.max(0, Math.ceil((stripeSub.trial_end - now) / (60 * 60 * 24)));
      } else {
        payload.trial_start = null;
        payload.trial_end = null;
        payload.trial_remaining_days = 0;
      }

      const existing = await this.databaseService.getByColumn('stripe_subscription_id', subId, SCHEMA_NAME.SUBSCRIPTIONS, 'id');
      if (existing) {
        await this.databaseService.updateByColumn('stripe_subscription_id', subId, payload, SCHEMA_NAME.SUBSCRIPTIONS, 'id');
      } else {
        await this.databaseService.create(payload, SCHEMA_NAME.SUBSCRIPTIONS, 'id');
      }

      return { error: false, message: "Invoice created processed." };
    } catch (error) {
      console.error(error);
      return { error: true, message: "Failed to handle invoice.created." };
    }
  }

  async handleInvoicePaymentSucceeded(data: any) {
    try {
      const subId = data.subscription;
      const existing = await this.databaseService.getByColumn('stripe_subscription_id', subId, SCHEMA_NAME.SUBSCRIPTIONS, 'id');
      if (!existing) return { error: true, message: "Subscription not found" };

      const isTrialInvoice = data.amount_paid === 0;
      const newStatus = isTrialInvoice ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE;
      const updates: any = { status: newStatus };
      if (isTrialInvoice) {
        updates.trial_consumed = true;
      }
      await this.databaseService.updateByColumn('stripe_subscription_id', subId, updates, SCHEMA_NAME.SUBSCRIPTIONS, 'id');

      return { error: false, message: "Invoice payment succeeded handled." };
    } catch (error) {
      console.error(error);
      return { error: true, message: "Failed to handle invoice.payment_succeeded." };
    }
  }

  async handleSubscriptionCreated(data: Stripe.Subscription) {
    const subId = data.id;
    const stripeSub = data; // already passed the full subscription object
    const user = await this.databaseService.getByColumn(
      'stripe_customer_id',
      stripeSub.customer as string,
      SCHEMA_NAME.PROFILES,
      'id'
    );
    if (!user) return { error: true, message: "User not found" };

    const isTrial = !!(stripeSub.trial_start && stripeSub.trial_end);
    const now = Math.floor(Date.now() / 1000);
    const trialRemaining = isTrial && stripeSub.trial_end! > now
      ? Math.ceil((stripeSub.trial_end! - now) / (60 * 60 * 24))
      : 0;

    const payload: any = {
      user_id: user.id,
      plan_type: stripePlanToAppPlan[stripeSub.items.data[0].price.recurring!.interval!],
      recurring: stripeSub.cancel_at_period_end === false,
      current_period_start: new Date(stripeSub.current_period_start! * 1000),
      current_period_end: new Date(stripeSub.current_period_end! * 1000),
      trial_start: isTrial ? new Date(stripeSub.trial_start! * 1000) : null,
      trial_end: isTrial ? new Date(stripeSub.trial_end! * 1000) : null,
      trial_remaining_days: trialRemaining,
      stripe_customer_id: stripeSub.customer,
      stripe_subscription_id: subId,
      status: stripeStatusToAppStatus[stripeSub.status] ?? SubscriptionStatus.PENDING,
    };

    // create or upsert
    const existing = await this.databaseService.getByColumn(
      'stripe_subscription_id',
      subId,
      SCHEMA_NAME.SUBSCRIPTIONS,
      'id, status'
    );
    if (existing) {
      payload.status = existing.status === SubscriptionStatus.PENDING ? stripeStatusToAppStatus[stripeSub.status] : existing.status;
      await this.databaseService.updateByColumn(
        'stripe_subscription_id',
        subId,
        payload,
        SCHEMA_NAME.SUBSCRIPTIONS,
        'id'
      );
    } else {
      await this.databaseService.create(payload, SCHEMA_NAME.SUBSCRIPTIONS, 'id');
    }

    return { error: false, message: "Subscription created processed." };
  }

  async handleSubscriptionUpdated(data: any) {
    try {
      const subId = data.id;
      const stripeSub = await stripe.subscriptions.retrieve(subId);
      const user = await this.databaseService.getByColumn('stripe_customer_id', data.customer, SCHEMA_NAME.SUBSCRIPTIONS, 'id, user_id');
      if (!user) return { error: true, message: "User not found" };

      const isTrial = stripeSub.trial_start && stripeSub.trial_end;
      const now = Math.floor(Date.now() / 1000);
      const trialRemaining = isTrial && stripeSub.trial_end > now
        ? Math.ceil((stripeSub.trial_end - now) / (60 * 60 * 24))
        : 0;

      const payload: any = {
        user_id: user.user_id,
        plan_type: stripePlanToAppPlan[stripeSub.items.data[0].price.recurring.interval.toLowerCase()],
        recurring: stripeSub.cancel_at_period_end === false,
        current_period_start: new Date(stripeSub.current_period_start * 1000),
        current_period_end: new Date(stripeSub.current_period_end * 1000),
        status: stripeStatusToAppStatus[stripeSub.status] ?? SubscriptionStatus.PENDING,
        canceled_at: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
        trial_start: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000) : null,
        trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        trial_remaining_days: trialRemaining,
      };
      // if trial end passed or user cancelled during trial, ensure consumed flag
      if (trialRemaining === 0 || stripeSub.status === 'canceled') {
        payload.trial_consumed = true;
      }

      await this.databaseService.updateByColumn('stripe_subscription_id', subId, payload, SCHEMA_NAME.SUBSCRIPTIONS, 'id');
      return { error: false, message: "Subscription.updated handled." };
    } catch (error) {
      console.error(error);
      return { error: true, message: "Failed to handle customer.subscription.updated." };
    }
  }

  async handleSubscriptionPaused(data: any) {
    await this.databaseService.updateByColumn('stripe_subscription_id', data.id, {
      status: SubscriptionStatus.PAUSED
    }, SCHEMA_NAME.SUBSCRIPTIONS, 'id');
  }

  async handleSubscriptionDeleted(data: any) {
    try {
      const subId = data.id;
      const now = Math.floor(Date.now() / 1000);
      let trialRemaining = 0;
      if (data.trial_end && data.trial_end > now) {
        trialRemaining = Math.ceil((data.trial_end - now) / (60 * 60 * 24));
      }
      const updates: any = {
        status: stripeStatusToAppStatus[data.status] ?? SubscriptionStatus.CANCELLED,
        canceled_at: new Date(),
        trial_remaining_days: trialRemaining,
        trial_consumed: true, // user cancelled, so consume trial
      };
      await this.databaseService.updateByColumn('stripe_subscription_id', subId, updates, SCHEMA_NAME.SUBSCRIPTIONS, 'id');
      return { error: false, message: "Subscription.deleted handled." };
    } catch (error) {
      console.error(error);
      return { error: true, message: "Failed to handle customer.subscription.deleted." };
    }
  }

  async createCustomerPortalSession(customerId: string) {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: Deno.env.get("STRIPE_PORTAL_RETURN_URL")
    })
  }
}
