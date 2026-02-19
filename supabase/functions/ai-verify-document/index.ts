import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_url, document_type, applicant_name, entity_type, verification_level } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert identity verification and fraud detection AI assistant for a professional culinary platform called Altoha. Your job is to analyze verification requests and documents to assess authenticity and risk.

You must evaluate:
1. Document consistency - Does the document type match what was submitted?
2. Information consistency - Does the applicant name match document details?
3. Risk assessment - Flag any suspicious patterns (mismatched data, low quality submissions, repeated attempts)
4. Professional verification - For culinary professionals, check if credentials align with claimed experience level
5. Organization verification - For companies/entities, verify business registration details are consistent

IMPORTANT: You are analyzing metadata and text descriptions, NOT actual images. Base your analysis on the information provided.

Return your analysis using the provided tool.`;

    const userPrompt = `Analyze this verification request:
- Entity Type: ${entity_type}
- Verification Level: ${verification_level}
- Applicant Name: ${applicant_name}
- Document Type: ${document_type}
- Document URL: ${document_url || "Not yet uploaded"}

Provide your risk assessment and recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verification_analysis",
              description: "Return structured verification analysis results",
              parameters: {
                type: "object",
                properties: {
                  risk_score: {
                    type: "number",
                    description: "Risk score from 0.0 (no risk) to 1.0 (high risk)",
                  },
                  document_valid: {
                    type: "boolean",
                    description: "Whether the document appears valid based on available information",
                  },
                  document_type_match: {
                    type: "boolean",
                    description: "Whether the submitted document type matches what was expected",
                  },
                  flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of flags or concerns identified",
                  },
                  recommendation: {
                    type: "string",
                    enum: ["approve", "manual_review", "reject"],
                    description: "Recommended action",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence in the analysis from 0.0 to 1.0",
                  },
                  summary: {
                    type: "string",
                    description: "Brief summary of the analysis findings",
                  },
                  summary_ar: {
                    type: "string",
                    description: "Arabic translation of the summary",
                  },
                },
                required: ["risk_score", "document_valid", "document_type_match", "flags", "recommendation", "confidence", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "verification_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No analysis results returned");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Verification AI error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
