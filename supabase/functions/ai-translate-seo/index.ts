import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { jsonResponse, errorResponse, validateRequired } from "../_shared/response.ts";
import { callAI } from "../_shared/ai.ts";

const FIELD_TYPE_LIMITS: Record<string, { max: number; guideline: string }> = {
  title:            { max: 60,   guideline: "concise title, max 60 characters" },
  meta_title:       { max: 60,   guideline: "SEO meta title, max 60 characters" },
  meta_description: { max: 160,  guideline: "SEO meta description, max 160 characters" },
  excerpt:          { max: 200,  guideline: "brief excerpt/summary, max 200 characters" },
  description:      { max: 500,  guideline: "detailed description, max 500 characters" },
  bio:              { max: 300,  guideline: "professional bio, max 300 characters" },
  tag:              { max: 30,   guideline: "short tag/label, max 30 characters" },
  slug:             { max: 80,   guideline: "URL-friendly slug, max 80 characters, lowercase with hyphens" },
  body:             { max: 10000, guideline: "full body content, no strict limit" },
  text:             { max: 500,  guideline: "general text, max 500 characters" },
};

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    await authenticateRequest(req);

    const body = await req.json();
    const validation = validateRequired(body, ["text"]);
    if (validation) return validation;

    const { text, source_lang, target_lang, optimize_seo, optimize_only, field_type, max_length } = body;

    const ftConfig = FIELD_TYPE_LIMITS[field_type || "text"] || FIELD_TYPE_LIMITS.text;
    const effectiveMax = max_length || ftConfig.max;
    const lengthInstruction = `The output MUST be a ${ftConfig.guideline}. STRICTLY keep the result under ${effectiveMax} characters.`;

    const domain = body.domain || "culinary arts, food industry, exhibitions, and professional events";

    let systemPrompt: string;
    if (optimize_only) {
      systemPrompt = `You are an SEO optimization expert specializing in: ${domain}.

Optimize the following ${source_lang === "ar" ? "Arabic" : "English"} text for search engines while keeping the original meaning fully intact.
Focus on improving discoverability within the specific domain of ${domain}.
Use professional terminology appropriate for this field.

FIELD CONTEXT: ${lengthInstruction}

RULES:
- NEVER add new information or content that was not in the original text
- Use domain-specific keywords naturally for SEO
- NEVER use special characters like **, ##, __, --
- No markdown formatting
- Preserve spacing and punctuation
- Be concise
- Return ONLY the optimized text`;
    } else {
      const fromLang = source_lang === "ar" ? "Arabic" : "English";
      const toLang = target_lang === "en" ? "English" : "Arabic";
      systemPrompt = `You are a professional bilingual translator.

Translate the following text from ${fromLang} to ${toLang}.

FIELD CONTEXT: ${lengthInstruction}

RULES:
- Provide a PURE, ACCURATE translation only — do NOT add, remove, or embellish any content
- Do NOT optimize for SEO — this is a translation only
- Maintain the exact same tone, style, and meaning as the original
- Keep proper nouns (brand names, place names) as-is unless they have well-known translations
- Use professional ${toLang} terminology
- NEVER use special characters or markdown
- Preserve spacing
- Return ONLY the translated text`;
    }

    const response = await callAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    });

    return jsonResponse(optimize_only ? { optimized: response.content } : { translated: response.content });
  } catch (e) {
    console.error("ai-translate-seo error:", e);
    return errorResponse(e);
  }
});
