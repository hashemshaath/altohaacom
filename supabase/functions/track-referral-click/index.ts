import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const { code, source } = await req.json();

    if (!code) return jsonResponse({ error: "code is required" }, 400);

    const { data: refData, error: refError } = await supabase
      .from("referral_codes").select("id, total_clicks")
      .eq("code", code.toUpperCase()).eq("is_active", true).maybeSingle();

    if (refError || !refData) return jsonResponse({ error: "Invalid referral code" }, 404);

    await Promise.all([
      supabase.from("referral_codes").update({ total_clicks: (refData.total_clicks || 0) + 1 }).eq("id", refData.id),
      supabase.from("referral_clicks").insert({ referral_code_id: refData.id, source: source || "direct", clicked_at: new Date().toISOString() }),
    ]);

    return jsonResponse({ tracked: true });
  } catch (error: unknown) {
    console.error("Track referral click error:", error);
    return errorResponse(error);
  }
});
