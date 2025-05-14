import Stripe from "npm:stripe@^17.0.0";
import { DatabaseService, ResponseManager, SCHEMA_NAME, SubscriptionStatus } from "../_shared/mod.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

Deno.serve(async (req) => {
  const responseManager = new ResponseManager();

  try {
    if (req.method === "OPTIONS") {
      return responseManager.optionsResponse();
    }

    if (req.method !== "POST") {
      return responseManager.methodNotAllowedResponse();
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return responseManager.authorizationHeaderMissingResponse();
    }

    const databaseService = new DatabaseService();
    const user = await databaseService.getSessionByToken(authHeader);

    if (!user) {
      return responseManager.unauthorizedUserResponse();
    }

    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      return responseManager.missingRequiredFieldResponse("Missing subscription ID");
    }

    // Fetch subscription from your DB to check status and ownership
    const dbSubscription = await databaseService.getByColumn(
      'id',
      subscriptionId,
      SCHEMA_NAME.SUBSCRIPTIONS,
      "id, user_id, status, plan_type, stripe_subscription_id",
    );

    if (!dbSubscription) {
      return responseManager.clientErrorResponse("Subscription not found in database.");
    }

    if (dbSubscription.user_id !== user.id) {
      return responseManager.unauthorizedUserResponse();
    }

    if (dbSubscription.status !== SubscriptionStatus.TRIALING) {
      return responseManager.clientErrorResponse("Only trialing subscriptions can be canceled.");
    }

    // Cancel the subscription on Stripe
    const stripeCancelResult = await stripe.subscriptions.cancel(dbSubscription.stripe_subscription_id);

    if (stripeCancelResult.status !== 'canceled') {
      return responseManager.serverErrorResponse("Failed to cancel subscription on Stripe.");
    }

    // Let webhook handle the DB update
    return responseManager.successResponse({
      message: "Subscription was in trial and has been canceled successfully.",
    });

  } catch (error) {
    console.error("❌ Cancel subscription error:", error);
    return responseManager.serverErrorResponse(error);
  }
});
