import { handleCors } from "../_shared/cors.ts";
import { authenticateAdmin } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI } from "../_shared/ai.ts";
import { gatherPlatformData } from "../_shared/platform-data.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { adminClient } = await authenticateAdmin(req);

    const { messages = [], language = "en" } = await req.json();

    const platformData = await gatherPlatformData(adminClient, 30);

    const systemPrompt = `You are an AI analytics assistant for the Altoha culinary community platform. You have access to the following real-time platform data:

${platformData.summary}

Answer questions about the platform's performance, trends, and insights using this data. Be concise, use bullet points and numbers. ${language === "ar" ? "Respond in Arabic." : "Respond in English."} Use markdown formatting.`;

    const response = await callAI({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });

    return jsonResponse({ response: response.content });
  } catch (error: unknown) {
    console.error("AI Analytics Chat error:", error);
    return errorResponse(error);
  }
});
