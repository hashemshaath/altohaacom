import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { cv_text, target_user_id } = await req.json();
    if (!cv_text || cv_text.trim().length < 50) {
      throw new Error("CV text is too short. Please provide more content.");
    }

    // Check if admin or self
    const isAdmin = await checkAdmin(supabase, user.id);
    const effectiveUserId = target_user_id && isAdmin ? target_user_id : user.id;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert CV/Resume parser for the culinary and hospitality industry. Extract structured data from the provided CV text.

Return data using the extract_cv_data tool. Be thorough and extract ALL information available.

Guidelines:
- Detect language (Arabic or English) and provide bilingual data when possible
- For dates, use ISO format (YYYY-MM-DD). If only year is known, use YYYY-01-01
- For country codes, use 2-letter ISO codes (SA, AE, US, etc.)
- For employment_type use: full_time, part_time, contract, internship, freelance, volunteer
- For education_level use: high_school, diploma, bachelors, masters, doctorate, culinary_certificate, professional_diploma, other
- For competition_role use: participant, organizer, judge, head_judge
- Extract tasks/responsibilities and achievements separately for each work experience
- Include TV/radio appearances under media_appearances
- Include national address details if mentioned`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this CV:\n\n${cv_text.substring(0, 15000)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_cv_data",
              description: "Extract structured CV data from text",
              parameters: {
                type: "object",
                properties: {
                  personal_info: {
                    type: "object",
                    properties: {
                      full_name: { type: "string" },
                      full_name_ar: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      nationality: { type: "string", description: "2-letter country code" },
                      second_nationality: { type: "string", description: "2-letter country code" },
                      country_code: { type: "string", description: "Current country, 2-letter code" },
                      city: { type: "string" },
                      location: { type: "string", description: "Full address or area/neighborhood" },
                      national_address: { type: "string", description: "Saudi national address if mentioned" },
                      date_of_birth: { type: "string", description: "ISO date" },
                      gender: { type: "string", enum: ["male", "female"] },
                      job_title: { type: "string" },
                      job_title_ar: { type: "string" },
                      specialization: { type: "string" },
                      specialization_ar: { type: "string" },
                      bio: { type: "string", description: "Professional summary/objective" },
                      bio_ar: { type: "string" },
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
                        institution: { type: "string" },
                        institution_ar: { type: "string" },
                        degree: { type: "string" },
                        degree_ar: { type: "string" },
                        education_level: { type: "string" },
                        field_of_study: { type: "string" },
                        field_of_study_ar: { type: "string" },
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
                        company: { type: "string" },
                        company_ar: { type: "string" },
                        title: { type: "string" },
                        title_ar: { type: "string" },
                        employment_type: { type: "string" },
                        department: { type: "string" },
                        department_ar: { type: "string" },
                        start_date: { type: "string" },
                        end_date: { type: "string" },
                        is_current: { type: "boolean" },
                        location: { type: "string" },
                        country_code: { type: "string" },
                        tasks: {
                          type: "array",
                          items: { type: "string" },
                          description: "Key responsibilities and tasks",
                        },
                        achievements: {
                          type: "array",
                          items: { type: "string" },
                          description: "Achievements and accomplishments in this role",
                        },
                      },
                      required: ["company", "title"],
                    },
                  },
                  competitions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        name_ar: { type: "string" },
                        role: { type: "string", enum: ["participant", "organizer", "judge", "head_judge"] },
                        edition: { type: "string" },
                        year: { type: "number" },
                        country_code: { type: "string" },
                        city: { type: "string" },
                        achievement: { type: "string" },
                        achievement_ar: { type: "string" },
                      },
                      required: ["name"],
                    },
                  },
                  certifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        name_ar: { type: "string" },
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
                  skills: {
                    type: "array",
                    items: { type: "string" },
                  },
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
