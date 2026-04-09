import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const MOYASAR_SECRET_KEY = Deno.env.get("MOYASAR_SECRET_KEY");
    if (!MOYASAR_SECRET_KEY) throw new Error("MOYASAR_SECRET_KEY is not configured");

    const { userId, userClient } = await authenticateRequest(req);
    const body = await req.json();
    const { action } = body;

    if (action === "create-payment") {
      const { amount, currency, description, ticket_id, callback_url, source } = body;
      if (!amount || !callback_url) {
        return jsonResponse({ error: "Missing required fields: amount, callback_url" }, 400);
      }

      const moyasarRes = await fetch("https://api.moyasar.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(MOYASAR_SECRET_KEY + ":"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: currency || "SAR",
          description: description || "Exhibition Ticket",
          callback_url,
          source: { type: "creditcard", ...source },
          metadata: { user_id: userId, ticket_id: ticket_id || null },
        }),
      });

      const moyasarData = await moyasarRes.json();
      if (!moyasarRes.ok) {
        console.error("Moyasar error:", moyasarData);
        throw new Error(moyasarData.message || "Payment creation failed");
      }

      if (ticket_id && moyasarData.id) {
        await userClient.from("exhibition_tickets").update({
          payment_status: "processing", payment_reference: moyasarData.id,
        }).eq("id", ticket_id).eq("user_id", userId);
      }

      return jsonResponse({
        success: true, payment_id: moyasarData.id,
        payment_url: moyasarData.source?.transaction_url || null, status: moyasarData.status,
      });
    }

    if (action === "verify-payment") {
      const { payment_id } = body;
      if (!payment_id) throw new Error("Missing payment_id");

      const moyasarRes = await fetch(`https://api.moyasar.com/v1/payments/${payment_id}`, {
        headers: { "Authorization": "Basic " + btoa(MOYASAR_SECRET_KEY + ":") },
      });
      const moyasarData = await moyasarRes.json();

      if (moyasarData.status === "paid") {
        const ticketId = moyasarData.metadata?.ticket_id;
        if (ticketId) {
          await userClient.from("exhibition_tickets").update({
            payment_status: "paid", status: "confirmed",
          }).eq("id", ticketId);
        }
      }

      return jsonResponse({
        success: true, status: moyasarData.status,
        amount: moyasarData.amount / 100, currency: moyasarData.currency,
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (error: unknown) {
    console.error("Moyasar payment error:", error);
    return errorResponse(error);
  }
});
