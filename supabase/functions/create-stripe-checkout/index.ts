import Stripe from "npm:stripe@^17.0.0";
import { DatabaseService, ResponseManager, SCHEMA_NAME, SubscriptionPlan } from "../_shared/mod.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")! as string, {
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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,

      line_items: [{ price: priceId, quantity: 1 }],

      /* ---------- 14-day trial ---------- */
      subscription_data: {
        trial_period_days: 14,          // <-- key line
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } }
      },

      /* ---------- success / cancel ---------- */
      success_url: `${Deno.env.get("STRIPE_SUCCESS_URL")}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("STRIPE_CANCEL_URL")}`,

      /* ---------- payment methods ---------- */
      payment_method_types: ["card"],
      // 1 line enables Card + Apple Pay + Google Pay + Link, etc.
      // automatic_payment_methods: { enabled: true },

      /* ---------- metadata ---------- */
      metadata: {
        user: user.id,
        plan,
      },
    });

    // Save session in Supabase

    if (!session || !session.url) {
      return responseManager.clientErrorResponse("Failed to create checkout session");
    }

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


