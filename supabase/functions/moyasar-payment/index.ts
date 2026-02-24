import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MOYASAR_SECRET_KEY = Deno.env.get("MOYASAR_SECRET_KEY");
    if (!MOYASAR_SECRET_KEY) {
      throw new Error("MOYASAR_SECRET_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json();
    const { action } = body;

    if (action === "create-payment") {
      const { amount, currency, description, ticket_id, callback_url } = body;

      if (!amount || !callback_url) {
        throw new Error("Missing required fields: amount, callback_url");
      }

      // Create Moyasar payment
      const moyasarRes = await fetch("https://api.moyasar.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(MOYASAR_SECRET_KEY + ":"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Moyasar uses halalas (cents)
          currency: currency || "SAR",
          description: description || "Exhibition Ticket",
          callback_url,
          source: { type: "creditcard", ...body.source },
          metadata: {
            user_id: userId,
            ticket_id: ticket_id || null,
          },
        }),
      });

      const moyasarData = await moyasarRes.json();

      if (!moyasarRes.ok) {
        console.error("Moyasar error:", moyasarData);
        throw new Error(moyasarData.message || "Payment creation failed");
      }

      // Update ticket payment status if ticket_id provided
      if (ticket_id && moyasarData.id) {
        await supabase
          .from("exhibition_tickets")
          .update({
            payment_status: "processing",
            payment_reference: moyasarData.id,
          })
          .eq("id", ticket_id)
          .eq("user_id", userId);
      }

      return new Response(JSON.stringify({
        success: true,
        payment_id: moyasarData.id,
        payment_url: moyasarData.source?.transaction_url || null,
        status: moyasarData.status,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify-payment") {
      const { payment_id } = body;
      if (!payment_id) throw new Error("Missing payment_id");

      const moyasarRes = await fetch(`https://api.moyasar.com/v1/payments/${payment_id}`, {
        headers: {
          "Authorization": "Basic " + btoa(MOYASAR_SECRET_KEY + ":"),
        },
      });

      const moyasarData = await moyasarRes.json();

      if (moyasarData.status === "paid") {
        const ticketId = moyasarData.metadata?.ticket_id;
        if (ticketId) {
          await supabase
            .from("exhibition_tickets")
            .update({
              payment_status: "paid",
              status: "confirmed",
            })
            .eq("id", ticketId);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        status: moyasarData.status,
        amount: moyasarData.amount / 100,
        currency: moyasarData.currency,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (error: any) {
    console.error("Moyasar payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
