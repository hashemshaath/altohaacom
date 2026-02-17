import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface ModerationRequest {
  post_id: string;
  content: string;
  image_urls?: string[];
  user_id: string;
  language?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { post_id, content, image_urls, user_id, language } = await req.json() as ModerationRequest;

    if (!post_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build the moderation prompt
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
3. **Off-topic content**: Content unrelated to the culinary/food/hospitality industry. The platform is STRICTLY for culinary professionals.
4. **Defamatory content**: Insults, personal attacks, slander, libel, character assassination against individuals or organizations.
5. **Hate speech**: Racism, discrimination, xenophobia, religious intolerance, sexism.
6. **Violence/Threats**: Threats of violence, graphic violence, intimidation.
7. **Spam/Scams**: Obvious spam, phishing, scam content, misleading promotions.
8. **Sensitive topics**: Religious debates, sectarian content, tribal/ethnic provocations.
9. **Profanity**: Swear words, vulgar expressions in ANY language (Arabic, English, transliterated Arabic/Franco-Arab). This includes ALL Arabic dialects and slang.

ALLOWED CONTENT:
- Culinary recipes, techniques, and tips
- Restaurant/food business discussions
- Competition experiences and results
- Professional achievements and certifications
- Food photography discussions
- Industry news and events
- Chef networking and collaboration
- Kitchen equipment and ingredient discussions
- Food safety and hygiene topics
- Culinary education and training

Analyze the following content and respond in JSON format:
{
  "decision": "approved" | "rejected" | "flagged",
  "confidence": 0.0-1.0,
  "categories": ["list of violated categories if any"],
  "explanation_en": "brief explanation in English",
  "explanation_ar": "brief explanation in Arabic"
}

- "approved": Content is safe and on-topic
- "rejected": Content clearly violates rules (auto-reject)
- "flagged": Content is borderline, needs human review

USER CONTENT TO ANALYZE:
"""
${content || "(no text)"}
"""
${image_urls?.length ? `\nATTACHED IMAGES: ${image_urls.length} image(s) attached. Note: You cannot analyze images directly, but flag if the text suggests inappropriate image content.` : ""}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      // On AI failure, flag for human review rather than blocking
      await supabase.from("posts").update({ moderation_status: "pending" }).eq("id", post_id);
      await supabase.from("content_moderation_log").insert({
        entity_type: "post",
        entity_id: post_id,
        user_id,
        content_text: content,
        image_urls: image_urls || [],
        ai_decision: "flagged",
        ai_confidence: 0,
        ai_categories: ["ai_error"],
        ai_explanation: "AI service unavailable, flagged for human review",
        ai_explanation_ar: "خدمة الذكاء الاصطناعي غير متاحة، تم تحويلها للمراجعة البشرية",
      });

      return new Response(JSON.stringify({ decision: "flagged", message: "Flagged for review" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const responseText = aiResult.choices?.[0]?.message?.content || "";

    // Parse AI response
    let analysis: {
      decision: string;
      confidence: number;
      categories: string[];
      explanation_en: string;
      explanation_ar: string;
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch?.[0] || "{}");
    } catch {
      analysis = {
        decision: "flagged",
        confidence: 0,
        categories: ["parse_error"],
        explanation_en: "Could not parse AI response",
        explanation_ar: "تعذر تحليل استجابة الذكاء الاصطناعي",
      };
    }

    // Determine moderation_status
    let moderationStatus: string;
    if (analysis.decision === "approved") {
      moderationStatus = "approved";
    } else if (analysis.decision === "rejected") {
      moderationStatus = "rejected";
    } else {
      moderationStatus = "pending"; // flagged = needs human review
    }

    // Update post status
    await supabase.from("posts").update({
      moderation_status: moderationStatus,
      moderation_reason: analysis.decision !== "approved"
        ? (language === "ar" ? analysis.explanation_ar : analysis.explanation_en)
        : null,
    }).eq("id", post_id);

    // Log rejected/flagged posts to content_audit_log for admin monitoring
    if (analysis.decision !== "approved") {
      await supabase.from("content_audit_log").insert({
        action_type: analysis.decision === "rejected" ? "post_rejected" : "post_flagged",
        entity_type: "post",
        entity_id: post_id,
        user_id,
        author_id: user_id,
        content_snapshot: content,
        image_urls: image_urls || [],
        reason: analysis.explanation_en,
        reason_ar: analysis.explanation_ar,
        metadata: { categories: analysis.categories, confidence: analysis.confidence },
      });
    }

    // Log moderation result
    await supabase.from("content_moderation_log").insert({
      entity_type: "post",
      entity_id: post_id,
      user_id,
      content_text: content,
      image_urls: image_urls || [],
      ai_decision: analysis.decision,
      ai_confidence: analysis.confidence,
      ai_categories: analysis.categories || [],
      ai_explanation: analysis.explanation_en,
      ai_explanation_ar: analysis.explanation_ar,
    });

    return new Response(JSON.stringify({
      decision: analysis.decision,
      moderation_status: moderationStatus,
      categories: analysis.categories,
      explanation: language === "ar" ? analysis.explanation_ar : analysis.explanation_en,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(JSON.stringify({ error: "Moderation service error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
