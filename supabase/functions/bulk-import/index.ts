import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template definitions for each entity type with validation options
const TEMPLATES: Record<string, {
  columns: string[];
  required: string[];
  options?: Record<string, string[]>;
  instructions?: Record<string, string>;
}> = {
  exhibition: {
    columns: [
      "title", "title_ar", "description", "description_ar", "type", "status",
      "start_date", "end_date", "venue", "venue_ar", "city", "country",
      "organizer_name", "organizer_name_ar", "organizer_email", "organizer_phone",
      "is_virtual", "virtual_link", "website_url", "registration_url",
      "is_free", "ticket_price", "max_attendees", "tags", "cover_image_url",
    ],
    required: ["title", "start_date", "end_date"],
    options: {
      type: ["exhibition", "expo", "forum", "conference", "trade_show"],
      status: ["draft", "upcoming", "active", "completed", "cancelled"],
      is_virtual: ["true", "false"],
      is_free: ["true", "false"],
    },
    instructions: {
      title: "Exhibition name in English (required)",
      title_ar: "Exhibition name in Arabic (auto-translated if empty)",
      description: "Brief description in English",
      description_ar: "Brief description in Arabic (auto-translated if empty)",
      type: "Options: exhibition, expo, forum, conference, trade_show",
      status: "Options: draft, upcoming, active, completed, cancelled",
      start_date: "Format: YYYY-MM-DD (required)",
      end_date: "Format: YYYY-MM-DD (required)",
      venue: "Venue name in English",
      venue_ar: "Venue name in Arabic",
      city: "City name",
      country: "Country name",
      organizer_name: "Organizer full name in English",
      organizer_name_ar: "Organizer full name in Arabic",
      organizer_email: "Valid email address",
      organizer_phone: "Phone with country code e.g. +966...",
      is_virtual: "true or false",
      virtual_link: "URL for virtual event (if is_virtual=true)",
      website_url: "Official website URL",
      registration_url: "Registration page URL",
      is_free: "true or false",
      ticket_price: "Numeric value (if is_free=false)",
      max_attendees: "Maximum number of attendees (integer)",
      tags: "Comma-separated tags e.g. food,culinary,pastry",
      cover_image_url: "URL to cover image",
    },
  },
  competition: {
    columns: [
      "title", "title_ar", "description", "description_ar", "status",
      "competition_start", "competition_end", "registration_start", "registration_end",
      "venue", "venue_ar", "city", "country", "country_code",
      "max_participants", "edition_year", "is_virtual",
      "rules_summary", "rules_summary_ar", "scoring_notes", "scoring_notes_ar",
      "organizer_number", "exhibition_title", "cover_image_url",
    ],
    required: ["title", "competition_start", "country_code"],
    options: {
      status: ["draft", "upcoming", "registration_open", "registration_closed", "in_progress", "judging", "completed", "cancelled"],
      is_virtual: ["true", "false"],
    },
    instructions: {
      title: "Competition name in English (required)",
      title_ar: "Competition name in Arabic (auto-translated if empty)",
      description: "Brief description in English",
      description_ar: "Brief description in Arabic",
      status: "Options: draft, upcoming, registration_open, registration_closed, in_progress, judging, completed, cancelled",
      competition_start: "Format: YYYY-MM-DD (required)",
      competition_end: "Format: YYYY-MM-DD",
      registration_start: "Format: YYYY-MM-DD",
      registration_end: "Format: YYYY-MM-DD",
      venue: "Venue name in English",
      venue_ar: "Venue name in Arabic",
      city: "City name",
      country: "Country name",
      country_code: "2-letter ISO code e.g. SA, AE, KW (required)",
      max_participants: "Maximum participants (integer)",
      edition_year: "Year e.g. 2026",
      is_virtual: "true or false",
      rules_summary: "Competition rules in English",
      rules_summary_ar: "Competition rules in Arabic",
      scoring_notes: "Scoring methodology in English",
      scoring_notes_ar: "Scoring methodology in Arabic",
      organizer_number: "Organizer account number e.g. U00000001",
      exhibition_title: "Link to exhibition by title (optional)",
      cover_image_url: "URL to cover image",
    },
  },
  participant: {
    columns: [
      "competition_number", "participant_name", "participant_name_ar",
      "participant_email", "participant_phone",
      "dish_name", "dish_name_ar", "dish_description", "dish_description_ar",
      "entry_type", "team_name", "team_name_ar", "category_name",
      "status", "notes",
    ],
    required: ["competition_number", "participant_name"],
    options: {
      entry_type: ["individual", "team", "organization"],
      status: ["pending", "approved", "rejected", "waitlisted"],
    },
    instructions: {
      competition_number: "Competition number from the system e.g. SA20260201001 (required, auto-filled when importing from competition page)",
      participant_name: "Full name in English (required)",
      participant_name_ar: "Full name in Arabic",
      participant_email: "Valid email address",
      participant_phone: "Phone with country code",
      dish_name: "Name of the dish in English",
      dish_name_ar: "Name of the dish in Arabic",
      dish_description: "Description of the dish in English",
      dish_description_ar: "Description of the dish in Arabic",
      entry_type: "Options: individual, team, organization",
      team_name: "Team name (if entry_type=team)",
      team_name_ar: "Team name in Arabic",
      category_name: "Competition category name",
      status: "Options: pending, approved, rejected, waitlisted",
      notes: "Any additional notes",
    },
  },
  judge: {
    columns: [
      "competition_number", "judge_name", "judge_name_ar",
      "judge_email", "judge_phone",
      "specialization", "specialization_ar", "role_type",
      "country", "bio", "bio_ar",
    ],
    required: ["competition_number", "judge_name"],
    options: {
      role_type: ["chairman", "head_judge", "judge", "assistant_judge", "observer"],
    },
    instructions: {
      competition_number: "Competition number from the system (required, auto-filled when importing from competition page)",
      judge_name: "Full name in English (required)",
      judge_name_ar: "Full name in Arabic",
      judge_email: "Valid email address",
      judge_phone: "Phone with country code",
      specialization: "Area of expertise in English",
      specialization_ar: "Area of expertise in Arabic",
      role_type: "Options: chairman, head_judge, judge, assistant_judge, observer",
      country: "Country of origin",
      bio: "Judge biography in English",
      bio_ar: "Judge biography in Arabic",
    },
  },
  winner: {
    columns: [
      "competition_number", "participant_name", "participant_email",
      "rank", "score", "category_name", "dish_name",
      "medal_type", "notes", "notes_ar",
    ],
    required: ["competition_number", "participant_name", "rank"],
    options: {
      medal_type: ["gold", "silver", "bronze", "merit", "distinction"],
    },
    instructions: {
      competition_number: "Competition number from the system (required, auto-filled when importing from competition page)",
      participant_name: "Winner full name (required)",
      participant_email: "Winner email",
      rank: "Ranking position: 1, 2, 3... (required)",
      score: "Numeric score achieved",
      category_name: "Competition category",
      dish_name: "Name of the winning dish",
      medal_type: "Options: gold, silver, bronze, merit, distinction",
      notes: "Notes in English",
      notes_ar: "Notes in Arabic",
    },
  },
  volunteer: {
    columns: [
      "competition_number", "volunteer_name", "volunteer_name_ar",
      "volunteer_email", "volunteer_phone",
      "role", "department", "department_ar",
      "country", "notes",
    ],
    required: ["competition_number", "volunteer_name"],
    options: {
      role: ["coordinator", "kitchen_marshal", "timekeeper", "floor_manager", "logistics", "assistant", "volunteer", "runner", "registration_desk", "photographer", "videographer", "mc_host", "social_media", "medical", "security"],
    },
    instructions: {
      competition_number: "Competition number from the system (required, auto-filled when importing from competition page)",
      volunteer_name: "Full name in English (required)",
      volunteer_name_ar: "Full name in Arabic",
      volunteer_email: "Valid email address",
      volunteer_phone: "Phone with country code",
      role: "Options: coordinator, kitchen_marshal, timekeeper, floor_manager, logistics, assistant, volunteer, runner, registration_desk, photographer, videographer, mc_host, social_media, medical, security",
      department: "Department in English",
      department_ar: "Department in Arabic",
      country: "Country of origin",
      notes: "Additional notes",
    },
  },
  sponsor: {
    columns: [
      "competition_number", "company_name", "company_name_ar",
      "contact_name", "contact_email", "contact_phone",
      "sponsorship_tier", "amount", "currency",
      "logo_url", "website", "notes",
    ],
    required: ["competition_number", "company_name"],
    options: {
      sponsorship_tier: ["platinum", "gold", "silver", "bronze", "media", "supporting"],
      currency: ["USD", "SAR", "AED", "KWD", "BHD", "QAR", "OMR", "EUR", "GBP"],
    },
    instructions: {
      competition_number: "Competition number from the system (required, auto-filled when importing from competition page)",
      company_name: "Company/sponsor name in English (required)",
      company_name_ar: "Company/sponsor name in Arabic",
      contact_name: "Contact person name",
      contact_email: "Contact email address",
      contact_phone: "Contact phone with country code",
      sponsorship_tier: "Options: platinum, gold, silver, bronze, media, supporting",
      amount: "Sponsorship amount (numeric)",
      currency: "Options: USD, SAR, AED, KWD, BHD, QAR, OMR, EUR, GBP",
      logo_url: "URL to company logo",
      website: "Company website URL",
      notes: "Additional notes",
    },
  },
  company: {
    columns: [
      "name", "name_ar", "type", "email", "phone", "website",
      "address", "address_ar", "city", "country", "country_code",
      "registration_number", "tax_number", "description", "description_ar",
      "logo_url",
    ],
    required: ["name", "type"],
    options: {
      type: ["supplier", "sponsor", "media", "restaurant", "hotel", "catering", "equipment", "distributor", "other"],
    },
    instructions: {
      name: "Company name in English (required)",
      name_ar: "Company name in Arabic",
      type: "Options: supplier, sponsor, media, restaurant, hotel, catering, equipment, distributor, other (required)",
      email: "Company email address",
      phone: "Phone with country code",
      website: "Company website URL",
      address: "Full address in English",
      address_ar: "Full address in Arabic",
      city: "City name",
      country: "Country name",
      country_code: "2-letter ISO code e.g. SA",
      registration_number: "Commercial registration number",
      tax_number: "Tax identification number",
      description: "Company description in English",
      description_ar: "Company description in Arabic",
      logo_url: "URL to company logo",
    },
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
    options: {
      type: ["culinary_association", "chefs_guild", "educational_institution", "certification_body", "regulatory_authority", "hospitality_union", "culinary_academy", "federation"],
      scope: ["local", "national", "regional", "international"],
    },
    instructions: {
      name: "Entity name in English (required)",
      name_ar: "Entity name in Arabic",
      abbreviation: "Short abbreviation e.g. WACS",
      abbreviation_ar: "Arabic abbreviation",
      type: "Options: culinary_association, chefs_guild, educational_institution, certification_body, regulatory_authority, hospitality_union, culinary_academy, federation (required)",
      scope: "Options: local, national, regional, international",
      description: "Description in English",
      description_ar: "Description in Arabic",
      country: "Country name",
      city: "City name",
      address: "Full address in English",
      address_ar: "Full address in Arabic",
      email: "Official email",
      phone: "Phone with country code",
      fax: "Fax number",
      website: "Official website URL",
      president_name: "President/Chairman name in English",
      president_name_ar: "President/Chairman name in Arabic",
      secretary_name: "Secretary General name in English",
      secretary_name_ar: "Secretary General name in Arabic",
      founded_year: "Year founded (integer)",
      member_count: "Number of members (integer)",
      mission: "Mission statement in English",
      mission_ar: "Mission statement in Arabic",
      logo_url: "URL to logo",
      cover_image_url: "URL to cover image",
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const entityType = url.searchParams.get("type") || "";

    // Generate downloadable template with instructions and options
    if (action === "template") {
      const template = TEMPLATES[entityType];
      if (!template) {
        return new Response(JSON.stringify({ error: `Unknown type: ${entityType}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Pre-fill competition_number if provided
      const competitionNumber = url.searchParams.get("competition_number") || "";

      const wb = XLSX.utils.book_new();

      // Sheet 1: Data entry
      const headerRow = template.columns;
      const hintRow = template.columns.map(col => template.required.includes(col) ? "⚠ REQUIRED" : "(optional)");
      const exampleRow = template.columns.map(col => {
        if (col === "competition_number" && competitionNumber) return competitionNumber;
        if (template.options?.[col]) return template.options[col][0];
        return "";
      });
      const dataSheet = XLSX.utils.aoa_to_sheet([headerRow, hintRow, exampleRow]);

      // Set column widths
      dataSheet["!cols"] = template.columns.map(col => ({ wch: Math.max(col.length + 2, 18) }));

      XLSX.utils.book_append_sheet(wb, dataSheet, "Data");

      // Sheet 2: Instructions
      const instructionRows: string[][] = [
        ["Column Name", "Required?", "Instructions", "Allowed Values"],
      ];
      for (const col of template.columns) {
        const isReq = template.required.includes(col) ? "YES ⚠" : "No";
        const instr = template.instructions?.[col] || "";
        const opts = template.options?.[col]?.join(", ") || "";
        instructionRows.push([col, isReq, instr, opts]);
      }
      const instrSheet = XLSX.utils.aoa_to_sheet(instructionRows);
      instrSheet["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 60 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, instrSheet, "Instructions");

      // Sheet 3: Allowed Values reference
      if (template.options && Object.keys(template.options).length > 0) {
        const optionEntries = Object.entries(template.options);
        const maxLen = Math.max(...optionEntries.map(([, v]) => v.length));
        const optRows: string[][] = [optionEntries.map(([k]) => k)];
        for (let i = 0; i < maxLen; i++) {
          optRows.push(optionEntries.map(([, v]) => v[i] || ""));
        }
        const optSheet = XLSX.utils.aoa_to_sheet(optRows);
        optSheet["!cols"] = optionEntries.map(() => ({ wch: 22 }));
        XLSX.utils.book_append_sheet(wb, optSheet, "Allowed Values");
      }

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
      // Read only the first sheet (Data sheet)
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const rows: any[] = [];
      const errors: any[] = [];

      rawRows.forEach((row, idx) => {
        const firstVal = String(Object.values(row)[0] || "");
        if (firstVal.startsWith("⚠") || firstVal === "(optional)") return;

        const missingRequired = template.required.filter(col => !row[col] || String(row[col]).trim() === "");
        if (missingRequired.length > 0) {
          errors.push({ row: idx + 2, message: `Missing required fields: ${missingRequired.join(", ")}` });
        }

        // Validate option fields
        if (template.options) {
          for (const [col, allowedVals] of Object.entries(template.options)) {
            const val = String(row[col] || "").trim();
            if (val && !allowedVals.includes(val)) {
              errors.push({ row: idx + 2, message: `Invalid value for ${col}: "${val}". Allowed: ${allowedVals.join(", ")}` });
            }
          }
        }

        // Validate date fields
        for (const col of template.columns) {
          if ((col.includes("date") || col.includes("start") || col.includes("end")) && !col.includes("url")) {
            const val = String(row[col] || "").trim();
            if (val && !/^\d{4}-\d{2}-\d{2}/.test(val)) {
              errors.push({ row: idx + 2, message: `Invalid date format for ${col}: "${val}". Use YYYY-MM-DD` });
            }
          }
        }

        const cleaned: Record<string, any> = {};
        template.columns.forEach(col => {
          cleaned[col] = row[col] !== undefined ? String(row[col]).trim() : "";
        });

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
            } catch { /* skip */ }
          } else if (arVal && !enVal) {
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
            } catch { /* skip */ }
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
