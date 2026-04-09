import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { jsonResponse, errorResponse, validateRequired } from "../_shared/response.ts";
import { callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    await authenticateRequest(req);

    const body = await req.json();
    const validation = validateRequired(body, ["text", "from", "to"]);
    if (validation) return validation;

    const { text, from, to } = body;
    const fromLabel = from === "ar" ? "Arabic" : "English";
    const toLabel = to === "ar" ? "Arabic" : "English";

    const prompt = `You are a professional bilingual translator.

Translate the following text from ${fromLabel} to ${toLabel}.

RULES:
- Provide a PURE, ACCURATE translation only — do NOT add, remove, or embellish any content
- Maintain the exact same tone, style, and meaning
- Keep proper nouns (brand names, place names) as-is unless they have well-known translations
- If the text contains technical terms, use the standard ${toLabel} equivalent
- Return ONLY the translated text, no explanations

TEXT TO TRANSLATE:
${text}`;

    const response = await callAI({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    return jsonResponse({ translated: response.content });
  } catch (error: unknown) {
    console.error("smart-translate error:", (error as Error).message);
    return errorResponse(error);
  }
});
