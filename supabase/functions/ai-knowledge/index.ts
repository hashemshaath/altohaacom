import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse, streamResponse, validateRequired } from "../_shared/response.ts";
import { callAIStream } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    await authenticateRequest(req);

    const body = await req.json();
    const validation = validateRequired(body, ["question"]);
    if (validation) return validation;

    const { question, language = "en" } = body;
    const supabase = getServiceClient();

    const [{ data: articles }, { data: faqs }] = await Promise.all([
      supabase.from("knowledge_articles").select("title, title_ar, content, content_ar, category").eq("status", "published").limit(10),
      supabase.from("faqs").select("question, question_ar, answer, answer_ar, category").limit(20),
    ]);

    const knowledgeContext = [
      ...(articles || []).map((a: any) => language === "ar"
        ? `${a.title_ar || a.title}: ${a.content_ar || a.content}`
        : `${a.title}: ${a.content}`),
      ...(faqs || []).map((f: any) => language === "ar"
        ? `Q: ${f.question_ar || f.question}\nA: ${f.answer_ar || f.answer}`
        : `Q: ${f.question}\nA: ${f.answer}`),
    ].join("\n\n");

    const systemPrompt = language === "ar"
      ? `أنت مساعد مفيد لمنصة التُهاء للمسابقات الطهوية. استخدم المعلومات التالية:\n\n${knowledgeContext}\n\nإذا لم تجد الإجابة، قدم إجابة عامة مفيدة. أجب باللغة العربية.`
      : `You are a helpful assistant for Altoha culinary platform. Use this knowledge base:\n\n${knowledgeContext}\n\nIf not found, provide a helpful general response. Be concise.`;

    const aiRes = await callAIStream({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    });

    return streamResponse(aiRes.body);
  } catch (error) {
    console.error("AI Knowledge error:", error);
    return errorResponse(error);
  }
});
