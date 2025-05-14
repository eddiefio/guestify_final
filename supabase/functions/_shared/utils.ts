import { corsHeaders, formCorsHeaders, SubscriptionStatus } from "./mod.ts";

export const formatResponse = ({ data = {}, message = "ok", error = false }) => {
  return JSON.stringify({
    data,
    error,
    message,
  });
};


export const formatResponseHeaders = ({ headers = {}, status = 200 }) => {
  return {
    status,
    headers: {
      ...corsHeaders,
      ...headers,
    },
  };
};
export const formatResponseHeadersForForm = ({ headers = {}, status = 200 }) => {
  return {
    status,
    headers: {
      ...formCorsHeaders,
      ...headers,
    },
  };
};

// Map Stripe status to your enum
export const stripeStatusToAppStatus: { [key: string]: SubscriptionStatus } = {
  trialing: SubscriptionStatus.TRIALING,
  active: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.UNPAID,
  unpaid: SubscriptionStatus.UNPAID,
  canceled: SubscriptionStatus.CANCELLED,
  incomplete: SubscriptionStatus.PENDING,
  incomplete_expired: SubscriptionStatus.CANCELLED,
  paused: SubscriptionStatus.PAUSED,
};
