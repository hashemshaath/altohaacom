import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { cv_text, target_user_id } = await req.json();
    if (!cv_text || cv_text.trim().length < 50) {
      throw new Error("CV text is too short. Please provide more content.");
    }

    const isAdmin = await checkAdmin(supabase, user.id);
    const effectiveUserId = target_user_id && isAdmin ? target_user_id : user.id;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert CV/Resume parser for the culinary and hospitality industry. Extract structured data from the provided CV text.

Return data using the extract_cv_data tool. Be thorough and extract ALL information available.

CRITICAL BILINGUAL RULES - STRICT SEPARATION:
- You MUST provide BOTH English AND Arabic versions for ALL text fields that have bilingual variants (_ar suffix).
- STRICT RULE: English fields (without _ar) must contain ONLY English text. Arabic fields (with _ar) must contain ONLY Arabic text.
- If the CV is in Arabic only: extract the Arabic text into _ar fields AND translate it to professional English for the English fields.
- If the CV is in English only: extract the English text into English fields AND translate it to professional Arabic for the Arabic fields.
- If the CV has both languages: separate each language into its corresponding field.
- NEVER leave Arabic fields empty if you have the English version, and vice versa.
- NEVER mix languages within a single field. Each field must be purely one language.
- NEVER concatenate Arabic and English in the same field.
- Translations must be professional, culinary-industry appropriate, and natural-sounding.
- For tasks[] and achievements[] arrays: write them ONLY in English. Keep each item concise and professionally rephrased.
- For names of companies/institutions: transliterate proper nouns if no official translation exists (e.g., "Hilton" stays "هيلتون" in Arabic).

FORMATTING RULES:
- Each task/responsibility should be a single clear sentence without bullet points or special characters.
- Each achievement should be a single clear sentence.
- Do NOT include section headers like "Key Responsibilities:" inside task/achievement strings.
- Summarize and rephrase tasks/achievements professionally, removing redundancy.

OTHER GUIDELINES:
- For dates, use ISO format (YYYY-MM-DD). If only year is known, use YYYY-01-01
- For country codes, use 2-letter ISO codes (SA, AE, US, etc.)
- For employment_type use: full_time, part_time, contract, internship, freelance, volunteer
- For education_level use: high_school, diploma, bachelors, masters, doctorate, culinary_certificate, professional_diploma, other
- For competition_role use: participant, organizer, judge, head_judge
- Extract tasks/responsibilities and achievements separately for each work experience
- Include TV/radio appearances under media_appearances
- Include national address details if mentioned
- For competitions, always extract the year and edition separately
- Extract ALL skills mentioned (cooking techniques, cuisines, management skills, software, etc.)
- Extract ALL certifications including food safety, HACCP, hygiene, culinary awards
- For languages, include proficiency level (native, fluent, intermediate, basic)
- Infer years_of_experience from work history dates if not explicitly stated
- Infer experience_level: <3 years=beginner, 3-7=intermediate, 7-15=advanced, 15+=expert
- Extract LinkedIn, Instagram, Twitter, and website URLs if present`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this CV thoroughly. Extract every detail and provide BOTH English AND Arabic versions for all text fields:\n\n${cv_text.substring(0, 25000)}` },
        ],
        tools: [
          {
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
                      full_name: { type: "string", description: "Full name in English" },
                      full_name_ar: { type: "string", description: "Full name in Arabic" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      nationality: { type: "string", description: "2-letter country code" },
                      second_nationality: { type: "string", description: "2-letter country code" },
                      country_code: { type: "string", description: "Current country, 2-letter code" },
                      city: { type: "string" },
                      location: { type: "string", description: "Full address or area" },
                      national_address: { type: "string" },
                      date_of_birth: { type: "string", description: "ISO date" },
                      gender: { type: "string", enum: ["male", "female"] },
                      job_title: { type: "string", description: "Job title in English" },
                      job_title_ar: { type: "string", description: "Job title in Arabic" },
                      specialization: { type: "string", description: "Specialization in English" },
                      specialization_ar: { type: "string", description: "Specialization in Arabic" },
                      bio: { type: "string", description: "Professional summary in English" },
                      bio_ar: { type: "string", description: "Professional summary in Arabic" },
                      years_of_experience: { type: "number" },
                      experience_level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] },
                      website: { type: "string" },
                      linkedin: { type: "string" },
                      instagram: { type: "string" },
                      twitter: { type: "string" },
                    },
                  },
                  education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        institution: { type: "string", description: "Institution name in English" },
                        institution_ar: { type: "string", description: "Institution name in Arabic" },
                        degree: { type: "string", description: "Degree name in English" },
                        degree_ar: { type: "string", description: "Degree name in Arabic" },
                        education_level: { type: "string" },
                        field_of_study: { type: "string", description: "Field in English" },
                        field_of_study_ar: { type: "string", description: "Field in Arabic" },
                        grade: { type: "string" },
                        start_date: { type: "string" },
                        end_date: { type: "string" },
                        is_current: { type: "boolean" },
                        location: { type: "string" },
                        country_code: { type: "string" },
                      },
                      required: ["institution", "degree"],
                    },
                  },
                  work_experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        company: { type: "string", description: "Company name in English" },
                        company_ar: { type: "string", description: "Company name in Arabic" },
                        title: { type: "string", description: "Job title in English" },
                        title_ar: { type: "string", description: "Job title in Arabic" },
                        employment_type: { type: "string" },
                        department: { type: "string", description: "Department in English" },
                        department_ar: { type: "string", description: "Department in Arabic" },
                        start_date: { type: "string" },
                        end_date: { type: "string" },
                        is_current: { type: "boolean" },
                        location: { type: "string" },
                        country_code: { type: "string" },
                        tasks: { type: "array", items: { type: "string" }, description: "Key responsibilities in English, professionally summarized" },
                        achievements: { type: "array", items: { type: "string" }, description: "Achievements in English, professionally summarized" },
                      },
                      required: ["company", "title"],
                    },
                  },
                  competitions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Competition name in English" },
                        name_ar: { type: "string", description: "Competition name in Arabic" },
                        role: { type: "string", enum: ["participant", "organizer", "judge", "head_judge"] },
                        edition: { type: "string" },
                        year: { type: "number" },
                        country_code: { type: "string" },
                        city: { type: "string" },
                        achievement: { type: "string", description: "Achievement in English" },
                        achievement_ar: { type: "string", description: "Achievement in Arabic" },
                      },
                      required: ["name"],
                    },
                  },
                  certifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Certification name in English" },
                        name_ar: { type: "string", description: "Certification name in Arabic" },
                        issuer: { type: "string" },
                        date: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name"],
                    },
                  },
                  media_appearances: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["tv", "radio", "podcast", "newspaper", "magazine", "online"] },
                        channel_name: { type: "string" },
                        program_name: { type: "string" },
                        date: { type: "string" },
                        description: { type: "string" },
                        country_code: { type: "string" },
                      },
                      required: ["channel_name"],
                    },
                  },
                  skills: { type: "array", items: { type: "string" } },
                  languages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        language: { type: "string" },
                        level: { type: "string" },
                      },
                    },
                  },
                },
                required: ["personal_info"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_cv_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI processing failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured data returned from AI");

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      success: true,
      data: extractedData,
      target_user_id: effectiveUserId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-cv error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function checkAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["supervisor", "organizer"])
    .limit(1);
  return (data?.length || 0) > 0;
}
