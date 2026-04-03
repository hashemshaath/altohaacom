import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI, parseToolCallArgs } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    await authenticateRequest(req);

    const { document_url, document_type, applicant_name, entity_type, verification_level } = await req.json();

    const response = await callAI({
      messages: [
        { role: "system", content: `You are an expert identity verification and fraud detection AI for Altoha culinary platform. Analyze verification requests to assess authenticity and risk. Evaluate document consistency, information consistency, risk assessment, professional verification, and organization verification. You analyze metadata and text descriptions, NOT actual images.` },
        { role: "user", content: `Analyze this verification request:
- Entity Type: ${entity_type}
- Verification Level: ${verification_level}
- Applicant Name: ${applicant_name}
- Document Type: ${document_type}
- Document URL: ${document_url || "Not yet uploaded"}

Provide your risk assessment and recommendations.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "verification_analysis",
          description: "Return structured verification analysis results",
          parameters: {
            type: "object",
            properties: {
              risk_score: { type: "number", description: "0.0 (no risk) to 1.0 (high risk)" },
              document_valid: { type: "boolean" },
              document_type_match: { type: "boolean" },
              flags: { type: "array", items: { type: "string" } },
              recommendation: { type: "string", enum: ["approve", "manual_review", "reject"] },
              confidence: { type: "number", description: "0.0 to 1.0" },
              summary: { type: "string" },
              summary_ar: { type: "string" },
            },
            required: ["risk_score", "document_valid", "document_type_match", "flags", "recommendation", "confidence", "summary"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "verification_analysis" } },
    });

    const analysis = parseToolCallArgs(response);
    if (!analysis) throw new Error("No analysis results returned");

    return jsonResponse({ success: true, analysis });
  } catch (e) {
    console.error("Verification AI error:", e);
    return errorResponse(e);
  }
});
