import { handleCors } from "../_shared/cors.ts";
import { authenticateRequest, getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { userId } = await authenticateRequest(req);
    const supabase = getServiceClient();

    const { cv_text, target_user_id } = await req.json();
    if (!cv_text || cv_text.trim().length < 50) {
      return jsonResponse({ error: "CV text is too short. Please provide more content." }, 400);
    }

    const isAdmin = await checkAdmin(supabase, userId);
    const effectiveUserId = target_user_id && isAdmin ? target_user_id : userId;

    const systemPrompt = `You are an expert CV/Resume parser for the culinary and hospitality industry. Extract structured data from the provided CV text.

Return data using the extract_cv_data tool. Be thorough and extract ALL information available.

CRITICAL BILINGUAL RULES - STRICT SEPARATION:
- You MUST provide BOTH English AND Arabic versions for ALL text fields that have bilingual variants (_ar suffix).
- STRICT RULE: English fields (without _ar) must contain ONLY English text. Arabic fields (with _ar) must contain ONLY Arabic text.
- If the CV is in Arabic only: extract the Arabic text into _ar fields AND translate it to professional English for the English fields.
- If the CV is in English only: extract the English text into English fields AND translate it to professional Arabic for the Arabic fields.
- If the CV has both languages: separate each language into its corresponding field.
- NEVER leave Arabic fields empty if you have the English version, and vice versa.
- NEVER mix languages within a single field.
- Translations must be professional, culinary-industry appropriate, and natural-sounding.

OTHER GUIDELINES:
- CRITICAL: For competitions/events in past years, NEVER set is_current to true.
- For dates, use ISO format (YYYY-MM-DD). If only year is known, use YYYY-01-01
- For country codes, use 2-letter ISO codes
- For employment_type use: full_time, part_time, contract, internship, freelance, volunteer
- For education_level use: high_school, diploma, bachelors, masters, doctorate, culinary_certificate, professional_diploma, other
- For competition_role use: participant, organizer, judge, head_judge
- Infer experience_level using ONLY: <3 years=beginner, 3-9 years=amateur, 10+ years=professional`;

    const toolSchema = {
      type: "function",
      function: {
        name: "extract_cv_data",
        description: "Extract structured CV data with full bilingual (EN+AR) support",
        parameters: {
          type: "object",
          properties: {
            personal_info: {
              type: "object",
              properties: {
                full_name: { type: "string" }, full_name_ar: { type: "string" },
                email: { type: "string" }, phone: { type: "string" },
                nationality: { type: "string" }, country_code: { type: "string" },
                city: { type: "string" }, date_of_birth: { type: "string" },
                gender: { type: "string", enum: ["male", "female"] },
                job_title: { type: "string" }, job_title_ar: { type: "string" },
                specialization: { type: "string" }, specialization_ar: { type: "string" },
                bio: { type: "string" }, bio_ar: { type: "string" },
                years_of_experience: { type: "number" },
                experience_level: { type: "string", enum: ["beginner", "amateur", "professional"] },
                website: { type: "string" }, linkedin: { type: "string" }, instagram: { type: "string" },
              },
            },
            education: { type: "array", items: { type: "object", properties: { institution: { type: "string" }, institution_ar: { type: "string" }, degree: { type: "string" }, degree_ar: { type: "string" }, education_level: { type: "string" }, start_date: { type: "string" }, end_date: { type: "string" }, is_current: { type: "boolean" }, country_code: { type: "string" } }, required: ["institution", "degree"] } },
            work_experience: { type: "array", items: { type: "object", properties: { company: { type: "string" }, company_ar: { type: "string" }, title: { type: "string" }, title_ar: { type: "string" }, employment_type: { type: "string" }, start_date: { type: "string" }, end_date: { type: "string" }, is_current: { type: "boolean" }, country_code: { type: "string" }, tasks: { type: "array", items: { type: "string" } }, achievements: { type: "array", items: { type: "string" } }, tasks_ar: { type: "array", items: { type: "string" } }, achievements_ar: { type: "array", items: { type: "string" } } }, required: ["company", "title"] } },
            competitions: { type: "array", items: { type: "object", properties: { name: { type: "string" }, name_ar: { type: "string" }, role: { type: "string", enum: ["participant", "organizer", "judge", "head_judge"] }, year: { type: "number" }, country_code: { type: "string" }, achievement: { type: "string" }, achievement_ar: { type: "string" } }, required: ["name"] } },
            certifications: { type: "array", items: { type: "object", properties: { name: { type: "string" }, name_ar: { type: "string" }, issuer: { type: "string" }, date: { type: "string" } }, required: ["name"] } },
            skills: { type: "array", items: { type: "object", properties: { name: { type: "string" }, name_ar: { type: "string" } }, required: ["name"] } },
            languages: { type: "array", items: { type: "object", properties: { language: { type: "string" }, language_ar: { type: "string" }, level: { type: "string" }, level_ar: { type: "string" } } } },
          },
          required: ["personal_info"],
        },
      },
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this CV thoroughly:\n\n${cv_text.substring(0, 25000)}` },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "extract_cv_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Rate limit exceeded, please try again later." }, 429);
      if (response.status === 402) return jsonResponse({ error: "Payment required, please add credits." }, 402);
      throw new Error("AI processing failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured data returned from AI");

    return jsonResponse({ success: true, data: JSON.parse(toolCall.function.arguments), target_user_id: effectiveUserId });
  } catch (e) {
    console.error("parse-cv error:", e);
    return errorResponse(e);
  }
});

async function checkAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["supervisor", "organizer"]).limit(1);
  return (data?.length || 0) > 0;
}
