import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { competitionType, category, language = "en", existingItems = [] } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const existingItemsList = existingItems.length > 0
      ? `\n\nAlready added items (do NOT suggest these again): ${existingItems.join(", ")}`
      : "";

    const systemPrompt = language === "ar"
      ? `أنت خبير في تنظيم المسابقات الطهوية. عند طلب اقتراحات لقائمة متطلبات، اقترح 5-8 عناصر مناسبة.
اقترح عناصر عملية وواقعية تتضمن الاسم بالإنجليزية والعربية والكمية والوحدة والتكلفة التقديرية والأولوية والفئة.${existingItemsList}`
      : `You are an expert culinary competition organizer. When asked for requirement list suggestions, suggest 5-8 practical items.
Suggest realistic items with name (English and Arabic), quantity, unit, estimated cost in USD, priority (low/medium/high/critical), and category.${existingItemsList}`;

    const userPrompt = language === "ar"
      ? `اقترح عناصر لقائمة متطلبات من نوع "${category}" لمسابقة طهوية من نوع "${competitionType}".`
      : `Suggest requirement items for a "${category}" list for a "${competitionType}" culinary competition.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_requirements",
              description: "Return 5-8 suggested requirement items for a culinary competition.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Item name in English" },
                        name_ar: { type: "string", description: "Item name in Arabic" },
                        quantity: { type: "number", description: "Suggested quantity" },
                        unit: { type: "string", enum: ["piece", "kg", "liter", "meter", "set", "box", "roll", "pack"] },
                        estimated_cost: { type: "number", description: "Estimated cost per unit in USD" },
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        category: {
                          type: "string",
                          enum: ["venue_setup", "equipment", "safety_hygiene", "food_ingredients", "spices", "decoration", "serving_utensils", "utilities", "other"],
                        },
                      },
                      required: ["name", "name_ar", "quantity", "unit", "estimated_cost", "priority", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_requirements" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI suggestions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No suggestions returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Requirements error:", error);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
