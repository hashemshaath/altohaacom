import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI, parseToolCallArgs } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    await authenticateRequest(req);

    const { competitionType, category, language = "en", existingItems = [] } = await req.json();

    const existingItemsList = existingItems.length > 0
      ? `\n\nAlready added items (do NOT suggest these): ${existingItems.join(", ")}`
      : "";

    const systemPrompt = language === "ar"
      ? `أنت خبير في تنظيم المسابقات الطهوية. اقترح 5-8 عناصر مناسبة لقائمة متطلبات.${existingItemsList}`
      : `You are an expert culinary competition organizer. Suggest 5-8 practical requirement items.${existingItemsList}`;

    const userPrompt = language === "ar"
      ? `اقترح عناصر لقائمة متطلبات من نوع "${category}" لمسابقة طهوية من نوع "${competitionType}".`
      : `Suggest requirement items for a "${category}" list for a "${competitionType}" culinary competition.`;

    const response = await callAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "suggest_requirements",
          description: "Return 5-8 suggested requirement items",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    name_ar: { type: "string" },
                    quantity: { type: "number" },
                    unit: { type: "string", enum: ["piece", "kg", "liter", "meter", "set", "box", "roll", "pack"] },
                    estimated_cost: { type: "number" },
                    priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    category: { type: "string", enum: ["venue_setup", "equipment", "safety_hygiene", "food_ingredients", "spices", "decoration", "serving_utensils", "utilities", "other"] },
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
      }],
      tool_choice: { type: "function", function: { name: "suggest_requirements" } },
    });

    const parsed = parseToolCallArgs(response);
    if (!parsed) return jsonResponse({ error: "No suggestions returned" }, 500);

    return jsonResponse(parsed);
  } catch (error) {
    console.error("AI Requirements error:", error);
    return errorResponse(error);
  }
});
