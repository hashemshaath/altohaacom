import { handleCors } from "../_shared/cors.ts";
import { authenticateAdmin } from "../_shared/auth.ts";
import { jsonResponse, errorResponse, streamResponse } from "../_shared/response.ts";
import { callAI, callAIStream } from "../_shared/ai.ts";
import { gatherPlatformData } from "../_shared/platform-data.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { adminClient } = await authenticateAdmin(req);

    const body = await req.json();
    const { language = "en", saveReport = false, reportType = "weekly" } = body;

    const periodDays = reportType === "quarterly" ? 90 : reportType === "monthly" ? 30 : 7;
    const { summary, snapshot } = await gatherPlatformData(adminClient, periodDays);

    const rtLabel = {
      weekly: { en: "Weekly", ar: "أسبوعي" },
      monthly: { en: "Monthly", ar: "شهري" },
      quarterly: { en: "Quarterly", ar: "ربع سنوي" },
    }[reportType] || { en: "Weekly", ar: "أسبوعي" };

    const systemPrompt = language === "ar"
      ? `أنت محلل بيانات خبير لمنصة التُهاء للمسابقات الطهوية. هذا تقرير ${rtLabel.ar}. قم بتحليل البيانات التالية وقدم تقريراً شاملاً:

1. **📊 ملخص تنفيذي** (4-5 جمل)
2. **📈 اتجاهات النمو** (4-6 نقاط مع أرقام دقيقة)
3. **🔮 تنبؤات وتوقعات** (4-5 توقعات مبنية على البيانات)
4. **💡 توصيات عملية** (5-7 خطوات محددة)
5. **⚠️ تحذيرات ومخاطر** (2-4 نقاط)
6. **🏆 فرص النمو** (3-4 فرص استراتيجية)

استخدم Markdown مع emoji. أجب باللغة العربية. كن محدداً وقدم أرقاماً.

${summary}`
      : `You are an expert data analyst for Altoha, a culinary competition & community platform. This is a ${rtLabel.en} report. Analyze the following data:

1. **📊 Executive Summary** (4-5 sentences)
2. **📈 Growth Trends** (4-6 bullet points with numbers)
3. **🔮 Predictions & Forecasts** (4-5 data-driven predictions)
4. **💡 Actionable Recommendations** (5-7 prioritized steps)
5. **⚠️ Risk Alerts** (2-4 items)
6. **🏆 Growth Opportunities** (3-4 strategic opportunities)

Use Markdown with emoji. Be specific and data-driven.

${summary}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: "Analyze this platform data and provide comprehensive insights." },
    ];

    if (saveReport) {
      const response = await callAI({ messages });

      await adminClient.from("ai_analytics_reports").insert({
        report_type: reportType,
        language,
        content: response.content,
        data_snapshot: snapshot,
      });

      return jsonResponse({ success: true, content: response.content });
    }

    // Streaming mode
    const aiRes = await callAIStream({ messages });
    return streamResponse(aiRes.body);
  } catch (error) {
    console.error("AI Analytics error:", error);
    return errorResponse(error);
  }
});
