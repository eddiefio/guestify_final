import Stripe from "npm:stripe@^17.0.0";
import { DatabaseService, ResponseManager, SCHEMA_NAME, StripeCheckoutSessionStatus, StripeService, stripeStatusToAppStatus, SubscriptionStatus } from "../_shared/mod.ts";


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
    const stripeService = new StripeService();

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
        const { error, message } = await stripeService.handleInvoiceCreated(data);
        if (error) {
          return responseManager.clientErrorResponse(message);
        }
        return responseManager.successResponse({}, message);
      }

      case "invoice.payment_succeeded": {
        console.log('💰 invoice.payment_succeeded', data);
        const { error, message } = await stripeService.handleInvoicePaymentSucceeded(data);
        if (error) {
          return responseManager.clientErrorResponse(message);
        }
        return responseManager.successResponse({}, message);
      }

      case "invoice.payment_failed": {
        console.log('⚠️ invoice.payment_failed', data);
        await databaseService.updateByColumn('stripe_subscription_id', data.subscription, { status: SubscriptionStatus.UNPAID }, SCHEMA_NAME.SUBSCRIPTIONS, "id");
        return responseManager.successResponse({}, "Subscription status updated to unpaid");
      }

      case "customer.subscription.created": {
        console.log('📥 customer.subscription.created', data);
        const { error, message } = await stripeService.handleSubscriptionCreated(data as Stripe.Subscription);
        if (error) return responseManager.clientErrorResponse(message);
        return responseManager.successResponse({}, message);
      }

      case "customer.subscription.updated": {
        console.log('🔄 customer.subscription.updated', data);
        const { error, message } = await stripeService.handleSubscriptionUpdated(data);
        if (error) {
          return responseManager.clientErrorResponse(message);
        }
        return responseManager.successResponse({}, message);
      }

      case "customer.subscription.deleted": {
        console.log('❌ customer.subscription.deleted', data);
        const { error, message } = await stripeService.handleSubscriptionDeleted(data);
        if (error) {
          return responseManager.clientErrorResponse(message);
        }
        return responseManager.successResponse({}, message);
      }

      case "customer.subscription.paused": {
        console.log('⏸️ customer.subscription.paused', data);
        await stripeService.handleSubscriptionUpdated(data);
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


