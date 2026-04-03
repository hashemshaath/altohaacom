import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse, streamResponse, validateRequired } from "../_shared/response.ts";
import { callAIStream } from "../_shared/ai.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { userId } = await authenticateRequest(req);
    const supabase = getServiceClient();

    const { question, competition_id, language = "en", conversation_history = [] } = await req.json();
    const validation = validateRequired({ question } as Record<string, unknown>, ["question"]);
    if (validation) return validation;

    // Role check: must be judge or admin
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
        return jsonResponse({ error: "Forbidden: judge role required" }, 403);
      }
    } else if (!isAdmin && !competition_id) {
      return jsonResponse({ error: "Forbidden: competition_id required for non-admin users" }, 403);
    }

    // Fetch knowledge resources, criteria, rubrics, references, FAQs in parallel
    const resourceQuery = supabase
      .from("knowledge_resources")
      .select("title, title_ar, description, description_ar, resource_type, scraped_content, scraped_content_ar, tags")
      .eq("is_published", true).eq("is_judge_resource", true).limit(20);

    if (competition_id) {
      resourceQuery.or(`competition_id.eq.${competition_id},competition_id.is.null`);
    }

    const [{ data: resources }, { data: rubrics }, { data: references }, { data: faqs },
      criteriaResult, compResult] = await Promise.all([
      resourceQuery,
      supabase.from("judging_rubric_templates").select("name, name_ar, description, description_ar, criteria, competition_type, category_type").eq("is_active", true).limit(5),
      supabase.from("reference_gallery").select("title, title_ar, description, description_ar, rating, score_range_min, score_range_max, competition_category").eq("is_active", true).limit(10),
      supabase.from("faqs").select("question, question_ar, answer, answer_ar, category").ilike("category", "%judg%").limit(10),
      competition_id ? supabase.from("judging_criteria").select("name, name_ar, description, description_ar, max_score, weight").eq("competition_id", competition_id).order("sort_order") : Promise.resolve({ data: null }),
      competition_id ? supabase.from("competitions").select("rules_summary, rules_summary_ar, scoring_notes, scoring_notes_ar, title, title_ar").eq("id", competition_id).single() : Promise.resolve({ data: null }),
    ]);

    let criteriaContext = "";
    let rulesContext = "";
    if (criteriaResult?.data?.length) {
      criteriaContext = criteriaResult.data.map((c: any) =>
        language === "ar"
          ? `• ${c.name_ar || c.name}: ${c.description_ar || c.description || ""} (الدرجة القصوى: ${c.max_score}, الوزن: ${c.weight})`
          : `• ${c.name}: ${c.description || ""} (Max: ${c.max_score}, Weight: ${c.weight})`
      ).join("\n");
    }
    if (compResult?.data) {
      const rules = language === "ar" ? (compResult.data.rules_summary_ar || compResult.data.rules_summary) : compResult.data.rules_summary;
      const scoring = language === "ar" ? (compResult.data.scoring_notes_ar || compResult.data.scoring_notes) : compResult.data.scoring_notes;
      if (rules) rulesContext += `\n\nCompetition Rules:\n${rules}`;
      if (scoring) rulesContext += `\n\nScoring Notes:\n${scoring}`;
    }

    const knowledgeContext = [
      ...(resources || []).map((r: any) => language === "ar"
        ? `[${r.resource_type}] ${r.title_ar || r.title}: ${r.scraped_content_ar || r.scraped_content || r.description_ar || r.description || ""}`
        : `[${r.resource_type}] ${r.title}: ${r.scraped_content || r.description || ""}`),
      ...(rubrics || []).map((r: any) => language === "ar"
        ? `[قالب تقييم] ${r.name_ar || r.name}: ${JSON.stringify(r.criteria)}`
        : `[Rubric] ${r.name}: ${JSON.stringify(r.criteria)}`),
      ...(references || []).map((r: any) => language === "ar"
        ? `[مرجع - ${r.rating}] ${r.title_ar || r.title}: ${r.description_ar || r.description || ""} (${r.score_range_min}-${r.score_range_max})`
        : `[Reference - ${r.rating}] ${r.title}: ${r.description || ""} (${r.score_range_min}-${r.score_range_max})`),
      ...(faqs || []).map((f: any) => language === "ar"
        ? `سؤال: ${f.question_ar || f.question}\nجواب: ${f.answer_ar || f.answer}`
        : `Q: ${f.question}\nA: ${f.answer}`),
    ].join("\n\n");

    const systemPrompt = language === "ar"
      ? `أنت مساعد ذكي متخصص في التحكيم لمنصة التُهاء للمسابقات الطهوية.
${criteriaContext ? `معايير التحكيم الحالية:\n${criteriaContext}\n` : ""}${rulesContext}
قاعدة المعرفة:\n${knowledgeContext}
أجب باللغة العربية. كن موضوعيًا ومهنيًا.`
      : `You are an expert judging assistant for Altoha culinary competition platform.
${criteriaContext ? `Current Criteria:\n${criteriaContext}\n` : ""}${rulesContext}
Knowledge Base:\n${knowledgeContext}
Be objective, professional, and thorough.`;

    const aiRes = await callAIStream({
      messages: [
        { role: "system", content: systemPrompt },
        ...conversation_history.slice(-10),
        { role: "user", content: question },
      ],
    });

    return streamResponse(aiRes.body);
  } catch (error) {
    console.error("Judge AI Assistant error:", error);
    return errorResponse(error);
  }
});
