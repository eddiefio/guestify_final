import { DatabaseService, ResponseManager, SCHEMA_NAME, StripeService, SubscriptionPlan } from "../_shared/mod.ts";


Deno.serve(async (req) => {
  const responseManager = new ResponseManager();
  try {
    if (req.method === "OPTIONS") {
      return responseManager.optionsResponse();
    }
    if (req.method !== "POST") {
      return responseManager.methodNotAllowedResponse();
    }
    const header = req.headers.get("Authorization");
    if (!header) {
      return responseManager.authorizationHeaderMissingResponse();
    }

    const databaseService = new DatabaseService();
    const user = await databaseService.getSessionByToken(header);

    if (!user) {
      return responseManager.unauthorizedUserResponse();
    }

    const { plan } = await req.json();

    if (!plan || ![SubscriptionPlan.MONTHLY, SubscriptionPlan.YEARLY].includes(plan)) {
      return responseManager.missingRequiredFieldResponse("Invalid payload");
    }

    const monthlyPriceId = Deno.env.get("STRIPE_PRICE_MONTHLY");
    const yearlyPriceId = Deno.env.get("STRIPE_PRICE_YEARLY");

    if (!monthlyPriceId || !yearlyPriceId) {
      return responseManager.missingRequiredFieldResponse("Missing Stripe price IDs");
    }

    const priceId = plan === SubscriptionPlan.MONTHLY ? monthlyPriceId : yearlyPriceId;

    // Check for existing, unexpired session
    const existingSession = await databaseService.getExistingCheckoutSession(user.id, plan);

    if (existingSession && existingSession.checkout_url) {
      return responseManager.successResponse({ url: existingSession.checkout_url, });
    }

    const stripeService = new StripeService();

    const lastCanceledSub = await databaseService.getLastCanceledSubscription(user.id);
    // Default to full 14 days
    let trialDays = 14;

    // If they have any past sub…
    if (lastCanceledSub) {
      // If they already consumed their trial, zero it out
      if (lastCanceledSub.trial_consumed) {
        trialDays = 0;
      } else {
        // Otherwise use whatever days are left (could be less than 14)
        trialDays = Math.max(0, lastCanceledSub.trial_remaining_days);
      }
    }

    // Optional: if they already have an active/paused subscription, block entirely
    const activeSub = await databaseService.getActiveSubscriptionForUser(user.id);
    if (activeSub) {
      return responseManager.clientErrorResponse("You already have an active subscription.");
    }

    // Build your session payload
    const sessionParams: Stripe.Checkout.SessionCreateParams & { customer_email: string } = {
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user: user.id, plan },
      success_url: Deno.env.get("STRIPE_SUCCESS_URL")!,
      cancel_url: Deno.env.get("STRIPE_CANCEL_URL")!,
      payment_method_types: ["card"],
      // Only include trial if >0
      ...(trialDays > 0 && {
        subscription_data: {
          trial_period_days: trialDays,
          trial_settings: {
            end_behavior: { missing_payment_method: "cancel" },
          },
        },
      }),
    };

    const session = await stripeService.createCheckoutSession(sessionParams);


    if (!session || !session.url) {
      return responseManager.clientErrorResponse("Failed to create checkout session");
    }

    // Save session in Supabase
    const sessionPayload = {
      user_id: user.id,
      session_id: session.id,
      plan,
      checkout_url: session.url,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours expiry
    };

    await databaseService.create(sessionPayload, SCHEMA_NAME.CHECKOUT_SESSIONS);

    return responseManager.successResponse({ url: session.url, });

  } catch (error) {
    return responseManager.serverErrorResponse(error);
  }

});


