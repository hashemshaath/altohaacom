import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Altoha AI — the helpful assistant for Altoha, the world's premier culinary community platform.

Your role:
- Answer questions about chefs, competitions, recipes, exhibitions, and culinary events on the platform
- Help users navigate features: registration, profiles, certificates, rankings, mentorship
- Provide culinary tips and guidance
- Be professional, warm, and bilingual (English & Arabic — respond in the user's language)

Rules:
- Keep answers concise (2-4 sentences unless detail is requested)
- If you don't know specific data, suggest where to find it on the platform
- Never make up competition results or chef rankings
- Use markdown for formatting when helpful`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI proxy
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL");
    if (!AI_GATEWAY_URL) {
      throw new Error("AI_GATEWAY_URL not configured");
    }

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-20), // Last 20 messages for context window
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
