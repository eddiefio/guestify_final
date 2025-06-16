import { SCHEMA_NAME, StripeCheckoutSessionStatus, SubscriptionStatus, supabasePrivate } from "./mod.ts";

export class DatabaseService {
  attributes: string;

  constructor() {
    this.attributes = "*";
  }

  async create(payload: object, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).insert([payload]).select(attr);
    if (error) {
      console.log('error>>>', error);
      throw new Error(error.message);
    }
    return data[0] || null;
  }

  async getById(id: string, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).select(`${attr}`).eq("id", id).maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data || null;
  }
  async getByColumn(column: string, value: string, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).select(`${attr}`).eq(column, value).maybeSingle();
    console.log('data>>>>', data, error);
    if (error) {
      throw new Error(error.message);
    }
    return data || null;
  }

  async update(id: string, updates: object, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).update(updates).eq("id", id).select(attr);
    if (error) {
      throw new Error(error.message);
    }
    return data[0] || null;
  }

  async updateByColumn(column: string, value: string, updates: object, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).update(updates).eq(column, value).select(attr);
    if (error) {
      throw new Error(error.message);
    }
    return data[0] || null;
  }

  async deleteById(id: string, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).delete().eq("id", id).select(`${attr}`);
    if (error) {
      throw new Error(error.message);
    }
    return data[0];
  }

  async getActiveSubscriptionForUser(userId: string) {
    const now = new Date().toISOString();

    const { data, error } = await supabasePrivate
      .from(SCHEMA_NAME.SUBSCRIPTIONS)
      .select("id, status, current_period_end, trial_end")
      .eq("user_id", userId)
      // status in (TRIALING, ACTIVE, PAUSED)
      .in("status", [
        SubscriptionStatus.TRIALING,
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.PAUSED,
      ])
      .order("current_period_end", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching active subscription:", error);
      throw error;
    }
    // ensure one of:
    //   trialing & trial_end > now
    //   active  & current_period_end > now
    //   paused  & current_period_end > now
    if (data && data.length > 0) {
      const subscription = data[0];
      const isValid =
        (subscription.status === SubscriptionStatus.TRIALING &&
          subscription.trial_end > now) ||
        (subscription.status === SubscriptionStatus.ACTIVE &&
          subscription.current_period_end > now) ||
        (subscription.status === SubscriptionStatus.PAUSED &&
          subscription.current_period_end > now);
      if (!isValid) {
        console.warn("Invalid subscription found:", subscription);
        return null;
      }
    }
    return data[0];
  }

  // Inserts a new Stripe checkout session record.
  async createStripeCheckoutSession(sessionData: {
    recipient: string | undefined;
    owner: string | undefined;
    url: string;
    expiry: string;
    status: StripeCheckoutSessionStatus;
  }) {
    const { data, error } = await supabasePrivate
      .from(SCHEMA_NAME.CHECKOUT_SESSIONS)
      .insert([
        {
          recipient: sessionData.recipient ?? null,
          owner: sessionData.owner || null,
          url: sessionData.url,
          expiry: sessionData.expiry,
          status: sessionData.status,
        },
      ])
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async getSessionByToken(token: string) {
    // Get the session or user object from the token
    token = token.replace("Bearer ", "");
    const { data } = await supabasePrivate.auth.getUser(token);
    const user = data.user;
    if (user) {
      return user;
    }
    return null;
  }

  async getExistingCheckoutSession(user_id: string, plan: string) {
    // Check for existing, unexpired session

    const { data: existing, error: fetchError } = await supabasePrivate
      .from(SCHEMA_NAME.CHECKOUT_SESSIONS)
      .select("id, checkout_url")
      .eq("user_id", user_id)
      .eq("plan", plan)
      .eq("status", StripeCheckoutSessionStatus.ACTIVE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }
    if (existing && new Date(existing.expires_at) > new Date()) {
      return existing;
    }
    return null;
  }
  async getLastCanceledSubscription(userId: string) {
    const { data, error } = await supabasePrivate
      .from(SCHEMA_NAME.SUBSCRIPTIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('status', SubscriptionStatus.CANCELLED)
      .order('canceled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }
    return data;
  }

  async getLatestUserSubscription(userId: string) {
    const { data, error } = await supabasePrivate
      .from(SCHEMA_NAME.SUBSCRIPTIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }
    return data;
  }

}
