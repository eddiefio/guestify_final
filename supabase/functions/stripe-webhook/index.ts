import Stripe from "npm:stripe@^17.0.0";
import { DatabaseService, ResponseManager, SCHEMA_NAME, StripeCheckoutSessionStatus, stripeStatusToAppStatus, SubscriptionPlan, SubscriptionStatus } from "../_shared/mod.ts";


const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")! as string, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});
const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const responseManager = new ResponseManager();
  try {

    console.log('Hello from Stripe Webhook!', req.headers)
    const signature = req.headers.get('Stripe-Signature')

    // verification relies on the raw request body rather than the parsed JSON.
    const body = await req.text()
    let receivedEvent
    try {
      receivedEvent = await stripe.webhooks.constructEventAsync(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, cryptoProvider)
    } catch (err: any) {
      return responseManager.clientErrorResponse(`Webhook Error: ${err.message}`)
    }
    console.log('receivedEvent', receivedEvent, typeof receivedEvent);

    const databaseService = new DatabaseService();

    // Handle the event
    const event = receivedEvent as Stripe.Event;
    const data = event.data.object;
    switch (event.type) {
      case "checkout.session.completed": {
        console.log('✅ checkout.session.completed', data);
        await databaseService.updateByColumn('session_id', data.id, { status: StripeCheckoutSessionStatus.COMPLETED }, SCHEMA_NAME.CHECKOUT_SESSIONS, "id");
        return responseManager.successResponse({}, "Checkout session completed");
      }

      case "checkout.session.expired": {
        console.log('❌ checkout.session.expired', data);
        await databaseService.updateByColumn('session_id', data.id, { status: StripeCheckoutSessionStatus.EXPIRED }, SCHEMA_NAME.CHECKOUT_SESSIONS, "id");
        return responseManager.successResponse({}, "Checkout session expired");
      }

      case "invoice.created": {
        console.log('🧾 invoice.created', data);
        const existingSubscription = await databaseService.getByColumn('stripe_subscription_id', data.subscription, SCHEMA_NAME.SUBSCRIPTIONS, "id");

        if (existingSubscription && existingSubscription.id) {
          return responseManager.successResponse({}, "Invoice already processed");
        }
        const userDetails = await databaseService.getByColumn('email', data.customer_email, SCHEMA_NAME.PROFILES, "id");
        if (!userDetails || !userDetails.id) {
          return responseManager.clientErrorResponse("Customer not found");
        }

        const lineData = data.lines.data[0];

        const subscriptionPayload = {
          user_id: userDetails.id,
          plan_type: lineData.plan.interval === "month" ? SubscriptionPlan.MONTHLY : SubscriptionPlan.YEARLY,
          recurring: lineData.price.recurring.interval === "month",
          trial_start: new Date(lineData.period.start * 1000),
          trial_end: new Date(lineData.period.end * 1000),
          stripe_customer_id: data.customer,
          stripe_subscription_id: data.subscription,
          status: SubscriptionStatus.PENDING,
        };

        await databaseService.create(subscriptionPayload, SCHEMA_NAME.SUBSCRIPTIONS, "id");

        return responseManager.successResponse({}, "Invoice created and subscription record inserted");
      }

      case "invoice.payment_succeeded": {
        console.log('💰 invoice.payment_succeeded', data);
        const isTrialInvoice = data.amount_paid === 0;
        const newStatus = isTrialInvoice ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE;
        await databaseService.updateByColumn('stripe_subscription_id', data.subscription, { status: newStatus }, SCHEMA_NAME.SUBSCRIPTIONS, "id");
        return responseManager.successResponse({}, `Subscription status set to ${newStatus}`);
      }

      case "invoice.payment_failed": {
        console.log('⚠️ invoice.payment_failed', data);
        await databaseService.updateByColumn('stripe_subscription_id', data.subscription, { status: SubscriptionStatus.UNPAID }, SCHEMA_NAME.SUBSCRIPTIONS, "id");
        return responseManager.successResponse({}, "Subscription status updated to unpaid");
      }

      case "customer.subscription.created": {
        console.log('📥 customer.subscription.created', data);

        const payload = {
          current_period_start: new Date(data.current_period_start * 1000),
          current_period_end: new Date(data.current_period_end * 1000),
          trial_start: data.trial_start ? new Date(data.trial_start * 1000) : null,
          trial_end: data.trial_end ? new Date(data.trial_end * 1000) : null,
          status: stripeStatusToAppStatus[data.status] ?? SubscriptionStatus.PENDING,
        };
        await databaseService.updateByColumn('stripe_subscription_id', data.id, payload, SCHEMA_NAME.SUBSCRIPTIONS, "id");
        return responseManager.successResponse({}, "Subscription created with mapped status");
      }

      case "customer.subscription.updated": {
        console.log('🔄 customer.subscription.updated', data);
        const payload: any = {
          current_period_start: new Date(data.current_period_start * 1000),
          current_period_end: new Date(data.current_period_end * 1000),
          status: stripeStatusToAppStatus[data.status] ?? SubscriptionStatus.PENDING,
        };

        if (data.canceled_at) {
          payload.canceled_at = new Date(data.canceled_at * 1000);
        }
        await databaseService.updateByColumn('stripe_subscription_id', data.id, payload, SCHEMA_NAME.SUBSCRIPTIONS, "id");
        return responseManager.successResponse({}, "Subscription updated with mapped status");
      }

      case "customer.subscription.deleted": {
        console.log('❌ customer.subscription.deleted', data);
        await databaseService.updateByColumn('stripe_subscription_id', data.id, { status: SubscriptionStatus.CANCELLED }, SCHEMA_NAME.SUBSCRIPTIONS, "id");
        return responseManager.successResponse({}, "Subscription cancelled");
      }

      case "customer.subscription.paused": {
        console.log('⏸️ customer.subscription.paused', data);
        await databaseService.updateByColumn('stripe_subscription_id', data.id, { status: SubscriptionStatus.PAUSED }, SCHEMA_NAME.SUBSCRIPTIONS, "id");
        return responseManager.successResponse({}, "Subscription paused");
      }

      default: {
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        return responseManager.successResponse({}, `Unhandled event: ${event.type}`);
      }
    }

  } catch (error) {
    return responseManager.serverErrorResponse(error);
  }

});


