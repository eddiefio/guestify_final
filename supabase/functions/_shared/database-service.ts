import { SCHEMA_NAME, StripeCheckoutSessionStatus, supabasePrivate } from "./mod.ts";

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
    return data[0] || {};
  }

  async getById(id: string, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).select(`${attr}`).eq("id", id).maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data || {};
  }
  async getByColumn(column: string, value: string, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).select(`${attr}`).eq(column, value).maybeSingle();
    console.log('data>>>>', data, error);
    if (error) {
      throw new Error(error.message);
    }
    return data || {};
  }

  async update(id: string, updates: object, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).update(updates).eq("id", id).select(attr);
    if (error) {
      throw new Error(error.message);
    }
    return data[0] || {};
  }

  async updateByColumn(column: string, value: string, updates: object, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).update(updates).eq(column, value).select(attr);
    if (error) {
      throw new Error(error.message);
    }
    return data[0] || {};
  }

  async deleteById(id: string, schemaName: string, attr: string = this.attributes) {
    const { data, error } = await supabasePrivate.from(schemaName).delete().eq("id", id).select(`${attr}`);
    if (error) {
      throw new Error(error.message);
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
      .from("checkout_sessions")
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
}
