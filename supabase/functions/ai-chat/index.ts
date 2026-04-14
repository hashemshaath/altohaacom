import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI } from "../_shared/ai.ts";
import { authenticateRequest } from "../_shared/auth.ts";

const SYSTEM_PROMPT = `You are Altoha AI — the helpful assistant for Altoha, the world's premier culinary community platform.

Your role:
- Answer questions about chefs, competitions, recipes, exhibitions, and culinary events on the platform
- Help users navigate features: registration, profiles, certificates, rankings, mentorship
- Provide culinary tips and guidance
- Be professional, warm, and bilingual (English & Arabic — respond in the user's language)

Rules:
- Keep answers concise (2-4 sentences unless detail is requested)
- If you don't know specific data, suggest where to find it on the platform
- Never make up competition results or chef rankings
- Use markdown for formatting when helpful`;

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

    await authenticateRequest(req);

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "messages array is required" }, 400);
    }

    const response = await callAI({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-20),
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    return jsonResponse({ reply: response.content || "I'm sorry, I couldn't generate a response. Please try again." });
  } catch (error: unknown) {
    console.error("ai-chat error:", error);
    return errorResponse(error);
  }
});
