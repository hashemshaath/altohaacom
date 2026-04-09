import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { jsonResponse, errorResponse, validateRequired } from "../_shared/response.ts";
import { callAI, parseAIJson } from "../_shared/ai.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ModerationRequest {
  post_id: string;
  content: string;
  image_urls?: string[];
  user_id: string;
  language?: string;
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    await authenticateRequest(req);

    const body = await req.json() as ModerationRequest;
    const validation = validateRequired(body as Record<string, unknown>, ["post_id", "user_id"]);
    if (validation) return validation;

    const { post_id, content, image_urls, user_id, language } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const prompt = `You are a content moderation AI for a professional culinary community platform (chefs, restaurants, food industry). 
Your job is to screen user-generated content BEFORE it is published.

IMPORTANT: You MUST analyze content in ALL languages including Arabic (العربية), transliterated Arabic (Franco-Arab/Arabizi like "ya 7mar", "kss omk"), English, and mixed-language posts. Pay special attention to:
- Arabic profanity and slang (e.g., كلمات بذيئة، شتائم، ألفاظ نابية)
- Transliterated Arabic swear words written in Latin characters
- Creative spelling to bypass filters (e.g., replacing letters, adding spaces within words)
- Context-dependent insults in Arabic dialects (Egyptian, Levantine, Gulf, Moroccan, etc.)

RULES - Content MUST be rejected if it contains ANY of the following:
1. **Political content**: Any political opinions, statements about governments, political parties, political figures, elections, or geopolitical issues.
2. **Indecent/Adult content**: Nudity, sexual content, vulgar language, obscene material.
3. **Off-topic content**: Content unrelated to the culinary/food/hospitality industry.
4. **Defamatory content**: Insults, personal attacks, slander, libel.
5. **Hate speech**: Racism, discrimination, xenophobia, religious intolerance, sexism.
6. **Violence/Threats**: Threats of violence, graphic violence, intimidation.
7. **Spam/Scams**: Obvious spam, phishing, scam content.
8. **Sensitive topics**: Religious debates, sectarian content, tribal/ethnic provocations.
9. **Profanity**: Swear words, vulgar expressions in ANY language.

ALLOWED CONTENT: Culinary recipes, techniques, tips, restaurant/food business discussions, competition experiences, professional achievements, food photography, industry news, chef networking, kitchen equipment, food safety, culinary education.

Analyze the following content and respond in JSON format:
{
  "decision": "approved" | "rejected" | "flagged",
  "confidence": 0.0-1.0,
  "categories": ["list of violated categories if any"],
  "explanation_en": "brief explanation in English",
  "explanation_ar": "brief explanation in Arabic"
}

USER CONTENT TO ANALYZE:
"""
${content || "(no text)"}
"""
${image_urls?.length ? `\nATTACHED IMAGES: ${image_urls.length} image(s) attached.` : ""}`;

    let analysis: {
      decision: string;
      confidence: number;
      categories: string[];
      explanation_en: string;
      explanation_ar: string;
    };

    try {
      const aiResponse = await callAI({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      });

      analysis = parseAIJson(aiResponse.content) || {
        decision: "flagged",
        confidence: 0,
        categories: ["parse_error"],
        explanation_en: "Could not parse AI response",
        explanation_ar: "تعذر تحليل استجابة الذكاء الاصطناعي",
      };
    } catch {
      // On AI failure, flag for human review
      await supabase.from("posts").update({ moderation_status: "pending" }).eq("id", post_id);
      await supabase.from("content_moderation_log").insert({
        entity_type: "post", entity_id: post_id, user_id,
        content_text: content, image_urls: image_urls || [],
        ai_decision: "flagged", ai_confidence: 0, ai_categories: ["ai_error"],
        ai_explanation: "AI service unavailable, flagged for human review",
        ai_explanation_ar: "خدمة الذكاء الاصطناعي غير متاحة، تم تحويلها للمراجعة البشرية",
      });

      return jsonResponse({ decision: "flagged", message: "Flagged for review" });
    }

    const moderationStatus = analysis.decision === "approved" ? "approved"
      : analysis.decision === "rejected" ? "rejected" : "pending";

    // Update post and log results in parallel
    await Promise.all([
      supabase.from("posts").update({
        moderation_status: moderationStatus,
        moderation_reason: analysis.decision !== "approved"
          ? (language === "ar" ? analysis.explanation_ar : analysis.explanation_en)
          : null,
      }).eq("id", post_id),

      // Log to audit if not approved
      analysis.decision !== "approved"
        ? supabase.from("content_audit_log").insert({
            action_type: analysis.decision === "rejected" ? "post_rejected" : "post_flagged",
            entity_type: "post", entity_id: post_id, user_id, author_id: user_id,
            content_snapshot: content, image_urls: image_urls || [],
            reason: analysis.explanation_en, reason_ar: analysis.explanation_ar,
            metadata: { categories: analysis.categories, confidence: analysis.confidence },
          })
        : Promise.resolve(),

      // Always log moderation result
      supabase.from("content_moderation_log").insert({
        entity_type: "post", entity_id: post_id, user_id,
        content_text: content, image_urls: image_urls || [],
        ai_decision: analysis.decision, ai_confidence: analysis.confidence,
        ai_categories: analysis.categories || [],
        ai_explanation: analysis.explanation_en,
        ai_explanation_ar: analysis.explanation_ar,
      }),
    ]);

    return jsonResponse({
      decision: analysis.decision,
      moderation_status: moderationStatus,
      categories: analysis.categories,
      explanation: language === "ar" ? analysis.explanation_ar : analysis.explanation_en,
    });
  } catch (error: unknown) {
    console.error("Moderation error:", error);
    return errorResponse(error);
  }
});
