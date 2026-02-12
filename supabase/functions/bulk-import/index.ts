import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template definitions for each entity type
const TEMPLATES: Record<string, { columns: string[]; required: string[] }> = {
  exhibition: {
    columns: [
      "title", "title_ar", "description", "description_ar", "type", "status",
      "start_date", "end_date", "venue", "venue_ar", "city", "country",
      "organizer_name", "organizer_name_ar", "organizer_email", "organizer_phone",
      "is_virtual", "virtual_link", "website_url", "registration_url",
      "is_free", "ticket_price", "max_attendees", "tags", "cover_image_url",
    ],
    required: ["title", "start_date", "end_date"],
  },
  competition: {
    columns: [
      "title", "title_ar", "description", "description_ar", "status",
      "competition_start", "competition_end", "registration_start", "registration_end",
      "venue", "venue_ar", "city", "country", "country_code",
      "max_participants", "edition_year", "is_virtual",
      "rules_summary", "rules_summary_ar", "scoring_notes", "scoring_notes_ar",
      "exhibition_title", "cover_image_url",
    ],
    required: ["title", "competition_start"],
  },
  participant: {
    columns: [
      "competition_title", "participant_name", "participant_email", "participant_phone",
      "dish_name", "dish_name_ar", "dish_description", "dish_description_ar",
      "entry_type", "team_name", "team_name_ar", "category_name",
      "status", "notes",
    ],
    required: ["competition_title", "participant_name"],
  },
  judge: {
    columns: [
      "competition_title", "judge_name", "judge_email", "judge_phone",
      "specialization", "specialization_ar", "role_type",
      "country", "bio", "bio_ar",
    ],
    required: ["competition_title", "judge_name"],
  },
  winner: {
    columns: [
      "competition_title", "participant_name", "participant_email",
      "rank", "score", "category_name", "dish_name",
      "medal_type", "notes", "notes_ar",
    ],
    required: ["competition_title", "participant_name", "rank"],
  },
  company: {
    columns: [
      "name", "name_ar", "type", "email", "phone", "website",
      "address", "address_ar", "city", "country", "country_code",
      "registration_number", "tax_number", "description", "description_ar",
      "logo_url",
    ],
    required: ["name", "type"],
  },
  entity: {
    columns: [
      "name", "name_ar", "abbreviation", "abbreviation_ar",
      "type", "scope", "description", "description_ar",
      "country", "city", "address", "address_ar",
      "email", "phone", "fax", "website",
      "president_name", "president_name_ar",
      "secretary_name", "secretary_name_ar",
      "founded_year", "member_count", "mission", "mission_ar",
      "logo_url", "cover_image_url",
    ],
    required: ["name", "type"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // 'template' or 'parse'
    const entityType = url.searchParams.get("type") || "";

    // Generate downloadable template
    if (action === "template") {
      const template = TEMPLATES[entityType];
      if (!template) {
        return new Response(JSON.stringify({ error: `Unknown type: ${entityType}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create workbook with header row + example row
      const ws = XLSX.utils.aoa_to_sheet([
        template.columns,
        template.columns.map(col => template.required.includes(col) ? "(required)" : "(optional)"),
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entityType);
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new Response(buf, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${entityType}-template.xlsx"`,
        },
      });
    }

    // Parse uploaded Excel file
    if (action === "parse") {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return new Response(JSON.stringify({ error: "No file uploaded" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const template = TEMPLATES[entityType];
      if (!template) {
        return new Response(JSON.stringify({ error: `Unknown type: ${entityType}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Validate and structure data
      const rows: any[] = [];
      const errors: any[] = [];

      rawRows.forEach((row, idx) => {
        // Skip the "(required)/(optional)" hint row
        const firstVal = String(Object.values(row)[0] || "");
        if (firstVal === "(required)" || firstVal === "(optional)") return;

        const missingRequired = template.required.filter(col => !row[col] || String(row[col]).trim() === "");
        if (missingRequired.length > 0) {
          errors.push({ row: idx + 2, message: `Missing required fields: ${missingRequired.join(", ")}` });
        }

        // Clean the row to only include known columns
        const cleaned: Record<string, any> = {};
        template.columns.forEach(col => {
          cleaned[col] = row[col] !== undefined ? String(row[col]).trim() : "";
        });

        // Detect language
        const hasArabic = Object.values(cleaned).some(v => /[\u0600-\u06FF]/.test(String(v)));
        cleaned._detected_language = hasArabic ? "ar" : "en";
        cleaned._row_index = idx + 2;
        cleaned._has_errors = missingRequired.length > 0;

        rows.push(cleaned);
      });

      return new Response(JSON.stringify({
        total: rows.length,
        valid: rows.filter(r => !r._has_errors).length,
        errors,
        rows,
        fileName: file.name,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI optimize batch
    if (action === "ai-optimize") {
      const { rows, entityType: eType } = await req.json();
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const optimizedRows = [];
      for (const row of rows) {
        const optimized = { ...row };

        // For each row, detect which language fields are filled and generate the other
        const bilingualPairs: [string, string][] = [];
        const template = TEMPLATES[eType];
        if (template) {
          template.columns.forEach(col => {
            if (col.endsWith("_ar")) {
              const enCol = col.replace("_ar", "");
              if (template.columns.includes(enCol)) {
                bilingualPairs.push([enCol, col]);
              }
            }
          });
        }

        for (const [enCol, arCol] of bilingualPairs) {
          const enVal = String(optimized[enCol] || "").trim();
          const arVal = String(optimized[arCol] || "").trim();

          if (enVal && !arVal) {
            // Translate EN -> AR
            try {
              const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-3-flash-preview",
                  messages: [
                    { role: "system", content: "Translate the following English text to Arabic. Also optimize for SEO. Return ONLY the translated text. No markdown or special characters." },
                    { role: "user", content: enVal },
                  ],
                }),
              });
              if (resp.ok) {
                const data = await resp.json();
                optimized[arCol] = data.choices?.[0]?.message?.content?.trim() || "";
              }
            } catch { /* skip failed translations */ }
          } else if (arVal && !enVal) {
            // Translate AR -> EN
            try {
              const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-3-flash-preview",
                  messages: [
                    { role: "system", content: "Translate the following Arabic text to English. Also optimize for SEO. Return ONLY the translated text. No markdown or special characters." },
                    { role: "user", content: arVal },
                  ],
                }),
              });
              if (resp.ok) {
                const data = await resp.json();
                optimized[enCol] = data.choices?.[0]?.message?.content?.trim() || "";
              }
            } catch { /* skip failed translations */ }
          }
        }

        optimized._ai_processed = true;
        optimizedRows.push(optimized);
      }

      return new Response(JSON.stringify({ rows: optimizedRows }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bulk-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
