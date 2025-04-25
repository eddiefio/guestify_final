import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Usa la versione più recente disponibile
});

export const createStripeConnectAccountLink = async (accountId: string) => {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/stripe-connect?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/stripe-connect?success=true`,
    type: 'account_onboarding',
  });

  return accountLink.url;
};

export const createStripeAccount = async (userId: string, email: string) => {
  const account = await stripe.accounts.create({
    type: 'standard',
    email,
    metadata: {
      userId,
    },
  });

  return account;
};

export const retrieveStripeAccount = async (accountId: string) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    console.error('Error retrieving Stripe account:', error);
    return null;
  }
};

export const isStripeAccountEnabled = (account: Stripe.Account) => {
  return (
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted
  );
}; 