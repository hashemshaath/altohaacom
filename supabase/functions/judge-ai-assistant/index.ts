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
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { question, competition_id, language = "en", conversation_history = [] } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Role check: user must be a judge for the competition or an admin ---
    const { data: isAdmin } = await supabase.rpc("is_admin", { p_user_id: userId });
    if (!isAdmin && competition_id) {
      const { data: roles } = await supabase.rpc("get_user_competition_role", {
        p_user_id: userId,
        p_competition_id: competition_id,
      });
      const hasJudgeRole = Array.isArray(roles) && roles.some((r: string) =>
        ["judge", "head_judge", "lead_judge"].includes(r.toLowerCase())
      );
      if (!hasJudgeRole) {
        return new Response(
          JSON.stringify({ error: "Forbidden: judge role required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (!isAdmin && !competition_id) {
      // Without a competition_id, only admins can use the general assistant
      return new Response(
        JSON.stringify({ error: "Forbidden: competition_id required for non-admin users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // --- Fetch knowledge resources ---
    const resourceQuery = supabase
      .from("knowledge_resources")
      .select("title, title_ar, description, description_ar, resource_type, scraped_content, scraped_content_ar, tags")
      .eq("is_published", true)
      .eq("is_judge_resource", true)
      .limit(20);

    if (competition_id) {
      resourceQuery.or(`competition_id.eq.${competition_id},competition_id.is.null`);
    }

    const { data: resources } = await resourceQuery;

    // --- Fetch judging criteria and competition rules ---
    let criteriaContext = "";
    let rulesContext = "";
    if (competition_id) {
      const [criteriaResult, compResult] = await Promise.all([
        supabase
          .from("judging_criteria")
          .select("name, name_ar, description, description_ar, max_score, weight")
          .eq("competition_id", competition_id)
          .order("sort_order"),
        supabase
          .from("competitions")
          .select("rules_summary, rules_summary_ar, scoring_notes, scoring_notes_ar, title, title_ar")
          .eq("id", competition_id)
          .single(),
      ]);

      const criteria = criteriaResult.data;
      const comp = compResult.data;

      if (criteria && criteria.length > 0) {
        criteriaContext = criteria.map(c =>
          language === "ar"
            ? `• ${c.name_ar || c.name}: ${c.description_ar || c.description || ""} (الدرجة القصوى: ${c.max_score}, الوزن: ${c.weight})`
            : `• ${c.name}: ${c.description || ""} (Max: ${c.max_score}, Weight: ${c.weight})`
        ).join("\n");
      }

      if (comp) {
        const rules = language === "ar" ? (comp.rules_summary_ar || comp.rules_summary) : comp.rules_summary;
        const scoring = language === "ar" ? (comp.scoring_notes_ar || comp.scoring_notes) : comp.scoring_notes;
        if (rules) rulesContext += `\n\nCompetition Rules:\n${rules}`;
        if (scoring) rulesContext += `\n\nScoring Notes:\n${scoring}`;
      }
    }

    // --- Fetch rubric templates ---
    const { data: rubrics } = await supabase
      .from("judging_rubric_templates")
      .select("name, name_ar, description, description_ar, criteria, competition_type, category_type")
      .eq("is_active", true)
      .limit(5);

    // --- Fetch reference gallery ---
    const { data: references } = await supabase
      .from("reference_gallery")
      .select("title, title_ar, description, description_ar, rating, score_range_min, score_range_max, competition_category")
      .eq("is_active", true)
      .limit(10);

    // --- Fetch FAQs ---
    const { data: faqs } = await supabase
      .from("faqs")
      .select("question, question_ar, answer, answer_ar, category")
      .ilike("category", "%judg%")
      .limit(10);

    // --- Build context ---
    const knowledgeContext = [
      ...(resources || []).map(r =>
        language === "ar"
          ? `[${r.resource_type}] ${r.title_ar || r.title}: ${r.scraped_content_ar || r.scraped_content || r.description_ar || r.description || ""}`
          : `[${r.resource_type}] ${r.title}: ${r.scraped_content || r.description || ""}`
      ),
      ...(rubrics || []).map(r =>
        language === "ar"
          ? `[قالب تقييم] ${r.name_ar || r.name}: ${JSON.stringify(r.criteria)}`
          : `[Rubric] ${r.name}: ${JSON.stringify(r.criteria)}`
      ),
      ...(references || []).map(r =>
        language === "ar"
          ? `[مرجع - ${r.rating}] ${r.title_ar || r.title}: ${r.description_ar || r.description || ""} (${r.score_range_min}-${r.score_range_max})`
          : `[Reference - ${r.rating}] ${r.title}: ${r.description || ""} (Score range: ${r.score_range_min}-${r.score_range_max})`
      ),
      ...(faqs || []).map(f =>
        language === "ar"
          ? `سؤال: ${f.question_ar || f.question}\nجواب: ${f.answer_ar || f.answer}`
          : `Q: ${f.question}\nA: ${f.answer}`
      ),
    ].join("\n\n");

    const systemPrompt = language === "ar"
      ? `أنت مساعد ذكي متخصص في التحكيم لمنصة التُهاء للمسابقات الطهوية. أنت تساعد الحكام في تقييم المشاركين وفهم معايير التحكيم.

${criteriaContext ? `معايير التحكيم الحالية:\n${criteriaContext}\n` : ""}
${rulesContext ? `${rulesContext}\n` : ""}

قاعدة المعرفة:
${knowledgeContext}

مهامك:
- ساعد الحكام في فهم معايير التقييم وكيفية تطبيقها
- قدم نصائح حول تقييم الأطباق والتقديم والابتكار
- أجب عن أسئلة القوانين واللوائح المتعلقة بالمسابقات
- ساعد في مقارنة المشاركين بالمراجع المتوفرة
- كن موضوعيًا ومهنيًا في إجاباتك
أجب باللغة العربية.`
      : `You are an expert judging assistant for Altoha, a culinary competition platform. You help judges evaluate participants and understand judging criteria.

${criteriaContext ? `Current Competition Criteria:\n${criteriaContext}\n` : ""}
${rulesContext ? `${rulesContext}\n` : ""}

Knowledge Base:
${knowledgeContext}

Your responsibilities:
- Help judges understand evaluation criteria and how to apply them
- Provide guidance on evaluating dishes, presentation, creativity, and technique
- Answer questions about competition rules, regulations, and standards
- Help compare participants against reference standards
- Be objective, professional, and thorough in your responses
- When suggesting scores, always explain your reasoning based on the criteria`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversation_history.slice(-10),
      { role: "user", content: question },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Judge AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
