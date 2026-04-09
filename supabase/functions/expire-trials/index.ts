import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { getServiceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("expire_membership_trials");

    if (error) {
      console.error("Error expiring trials:", error);
      return jsonResponse({ error: error.message }, 500);
    }

    console.log(`Expired ${data} trial(s)`);
    return jsonResponse({ expired: data });
  } catch (err: unknown) {
    console.error("Expire trials error:", err);
    return errorResponse(err);
  }
});
