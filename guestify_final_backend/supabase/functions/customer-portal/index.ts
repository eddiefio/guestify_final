import {
  DatabaseService,
  ResponseManager,
  StripeService
} from "../_shared/mod.ts";

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

    const stripeService = new StripeService();

    // Fetch latest subscription for the user
    const dbSubscription = await databaseService.getLatestUserSubscription(user.id);

    if (!dbSubscription || !dbSubscription.stripe_customer_id) {
      return responseManager.clientErrorResponse("No active subscription or Stripe customer ID found.");
    }

    // Create customer portal session
    const portalSession = await stripeService.createCustomerPortalSession(dbSubscription.stripe_customer_id)

    return responseManager.successResponse({
      url: portalSession.url,
    });

  } catch (error) {
    console.error("❌ Stripe customer portal error:", error);
    return responseManager.serverErrorResponse("Internal server error.");
  }
});
