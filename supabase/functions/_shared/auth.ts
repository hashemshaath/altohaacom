import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface AuthResult {
  userId: string;
  token: string;
  userClient: ReturnType<typeof createClient>;
}

/**
 * Authenticate a request using the Authorization header.
 * Returns the user ID and an authenticated Supabase client.
 * Throws an Error with message "Unauthorized" if auth fails.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    throw new Error("Unauthorized");
  }

  return {
    userId: claimsData.claims.sub as string,
    token,
    userClient,
  };
}

/**
 * Authenticate and verify admin role.
 * Returns the user ID and a service-role Supabase client.
 * Throws "Unauthorized" or "Forbidden" errors.
 */
export async function authenticateAdmin(req: Request) {
  const { userId, userClient } = await authenticateRequest(req);
  const adminClient = getServiceClient();

  const { data: isAdmin } = await adminClient.rpc("is_admin", { p_user_id: userId });
  if (!isAdmin) {
    throw new Error("Forbidden");
  }

  return { userId, userClient, adminClient };
}

/**
 * Get a Supabase client with service role key (bypasses RLS).
 */
export function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Get a user-scoped Supabase client using an auth header.
 */
export function getUserClient(authHeader: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}
