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

    let systemPrompt: string;
    if (optimize_only) {
      systemPrompt = `You are an SEO optimization expert. Optimize the following ${source_lang === "ar" ? "Arabic" : "English"} text for search engines while keeping the meaning intact.

FIELD CONTEXT: ${lengthInstruction}

RULES: NEVER use special characters like **, ##, __, --. No markdown formatting. Preserve spacing and punctuation. Be concise. Return ONLY the optimized text.`;
    } else {
      const fromLang = source_lang === "ar" ? "Arabic" : "English";
      const toLang = target_lang === "en" ? "English" : "Arabic";
      systemPrompt = `You are a professional translator and SEO expert. Translate from ${fromLang} to ${toLang}. ${optimize_seo ? "Also optimize for search engines." : ""}

FIELD CONTEXT: ${lengthInstruction}

RULES: NEVER use special characters or markdown. Preserve spacing. Be concise. Return ONLY the translated text.`;
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
