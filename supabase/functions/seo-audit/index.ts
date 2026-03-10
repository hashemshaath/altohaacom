import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://altoha.com";

// Routes to audit
const AUDIT_ROUTES = [
  "/", "/competitions", "/discover", "/exhibitions", "/community", "/news",
  "/rankings", "/recipes", "/masterclasses", "/shop", "/chefs-table",
  "/pro-suppliers", "/mentorship", "/establishments", "/organizers",
  "/events-calendar", "/jobs", "/entities", "/membership", "/search",
  "/about", "/contact", "/help", "/for-chefs", "/for-companies",
  "/for-organizers", "/sponsors", "/privacy", "/terms", "/cookies",
];

interface AuditIssue {
  page_path: string;
  issue_type: string;
  severity: "error" | "warning" | "info";
  message: string;
  message_ar: string;
  details: Record<string, any>;
}

function auditHtml(path: string, html: string): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Check title tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  if (!titleMatch || !titleMatch[1]?.trim()) {
    issues.push({
      page_path: path,
      issue_type: "missing_title",
      severity: "error",
      message: "Missing or empty <title> tag",
      message_ar: "وسم <title> مفقود أو فارغ",
      details: {},
    });
  } else {
    const titleLen = titleMatch[1].trim().length;
    if (titleLen > 60) {
      issues.push({
        page_path: path,
        issue_type: "title_too_long",
        severity: "warning",
        message: `Title tag is ${titleLen} chars (recommended: <60)`,
        message_ar: `وسم العنوان ${titleLen} حرف (الموصى به: أقل من 60)`,
        details: { length: titleLen, title: titleMatch[1].trim().slice(0, 80) },
      });
    }
  }

  // Check meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is);
  if (!descMatch || !descMatch[1]?.trim()) {
    issues.push({
      page_path: path,
      issue_type: "missing_meta_description",
      severity: "error",
      message: "Missing meta description",
      message_ar: "الوصف التعريفي مفقود",
      details: {},
    });
  } else {
    const descLen = descMatch[1].trim().length;
    if (descLen > 160) {
      issues.push({
        page_path: path,
        issue_type: "meta_description_too_long",
        severity: "warning",
        message: `Meta description is ${descLen} chars (recommended: <160)`,
        message_ar: `الوصف التعريفي ${descLen} حرف (الموصى به: أقل من 160)`,
        details: { length: descLen },
      });
    }
  }

  // Check H1
  const h1Matches = html.match(/<h1[^>]*>/gi) || [];
  if (h1Matches.length === 0) {
    issues.push({
      page_path: path,
      issue_type: "missing_h1",
      severity: "error",
      message: "No H1 heading found",
      message_ar: "لا يوجد عنوان H1",
      details: {},
    });
  } else if (h1Matches.length > 1) {
    issues.push({
      page_path: path,
      issue_type: "multiple_h1",
      severity: "warning",
      message: `${h1Matches.length} H1 headings found (recommended: 1)`,
      message_ar: `${h1Matches.length} عناوين H1 (الموصى به: 1)`,
      details: { count: h1Matches.length },
    });
  }

  // Check images without alt
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  let missingAlt = 0;
  for (const img of imgTags) {
    if (!img.match(/alt=["'][^"']+["']/i)) {
      missingAlt++;
    }
  }
  if (missingAlt > 0) {
    issues.push({
      page_path: path,
      issue_type: "images_missing_alt",
      severity: "warning",
      message: `${missingAlt} image(s) missing alt text`,
      message_ar: `${missingAlt} صورة بدون نص بديل`,
      details: { count: missingAlt, total_images: imgTags.length },
    });
  }

  // Check canonical
  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!canonical) {
    issues.push({
      page_path: path,
      issue_type: "missing_canonical",
      severity: "warning",
      message: "Missing canonical link tag",
      message_ar: "وسم الرابط الأساسي مفقود",
      details: {},
    });
  }

  // Check OG tags
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["']/i);
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["']/i);
  const ogImage = html.match(/<meta[^>]*property=["']og:image["']/i);
  if (!ogTitle || !ogDesc || !ogImage) {
    const missing = [];
    if (!ogTitle) missing.push("og:title");
    if (!ogDesc) missing.push("og:description");
    if (!ogImage) missing.push("og:image");
    issues.push({
      page_path: path,
      issue_type: "missing_og_tags",
      severity: "warning",
      message: `Missing Open Graph tags: ${missing.join(", ")}`,
      message_ar: `وسوم Open Graph مفقودة: ${missing.join(", ")}`,
      details: { missing },
    });
  }

  // Check viewport meta
  const viewport = html.match(/<meta[^>]*name=["']viewport["']/i);
  if (!viewport) {
    issues.push({
      page_path: path,
      issue_type: "missing_viewport",
      severity: "error",
      message: "Missing viewport meta tag (critical for mobile)",
      message_ar: "وسم viewport مفقود (مهم للجوال)",
      details: {},
    });
  }

  // Check lang attribute
  const langAttr = html.match(/<html[^>]*lang=["'][^"']+["']/i);
  if (!langAttr) {
    issues.push({
      page_path: path,
      issue_type: "missing_lang",
      severity: "info",
      message: "Missing lang attribute on <html> tag",
      message_ar: "خاصية اللغة مفقودة في وسم <html>",
      details: {},
    });
  }

  return issues;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Create audit record
    const { data: audit, error: auditErr } = await supabase
      .from("seo_audits")
      .insert({ triggered_by: user.id, status: "running", total_pages: AUDIT_ROUTES.length })
      .select("id")
      .single();

    if (auditErr) throw auditErr;
    const auditId = audit.id;

    const allIssues: AuditIssue[] = [];
    let pagesAudited = 0;

    // Audit pages in batches of 5
    for (let i = 0; i < AUDIT_ROUTES.length; i += 5) {
      const batch = AUDIT_ROUTES.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (path) => {
          try {
            const resp = await fetch(`${BASE_URL}${path}`, {
              headers: { "User-Agent": "AltohaBot/SEOAudit" },
              signal: AbortSignal.timeout(10000),
            });
            if (!resp.ok) {
              return [{
                page_path: path,
                issue_type: "http_error",
                severity: "error" as const,
                message: `HTTP ${resp.status} response`,
                message_ar: `استجابة HTTP ${resp.status}`,
                details: { status: resp.status },
              }];
            }
            const html = await resp.text();
            pagesAudited++;
            return auditHtml(path, html);
          } catch (e: any) {
            return [{
              page_path: path,
              issue_type: "fetch_error",
              severity: "error" as const,
              message: `Failed to fetch: ${e.message}`,
              message_ar: `فشل في الجلب: ${e.message}`,
              details: { error: e.message },
            }];
          }
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          allIssues.push(...result.value);
        }
      }
    }

    // Insert issues
    if (allIssues.length > 0) {
      const rows = allIssues.map((issue) => ({
        audit_id: auditId,
        ...issue,
      }));
      await supabase.from("seo_audit_issues").insert(rows);
    }

    // Calculate score
    const errors = allIssues.filter((i) => i.severity === "error").length;
    const warnings = allIssues.filter((i) => i.severity === "warning").length;
    const maxScore = pagesAudited * 10; // 10 checks per page approx
    const score = Math.max(0, Math.round(((maxScore - errors * 3 - warnings) / maxScore) * 100));

    // Summarize by type
    const typeCounts: Record<string, number> = {};
    for (const issue of allIssues) {
      typeCounts[issue.issue_type] = (typeCounts[issue.issue_type] || 0) + 1;
    }

    // Update audit record
    await supabase
      .from("seo_audits")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        issues_found: allIssues.length,
        score,
        summary: {
          errors,
          warnings,
          info: allIssues.filter((i) => i.severity === "info").length,
          pages_audited: pagesAudited,
          issue_types: typeCounts,
        },
      })
      .eq("id", auditId);

    return new Response(
      JSON.stringify({
        audit_id: auditId,
        score,
        total_issues: allIssues.length,
        errors,
        warnings,
        pages_audited: pagesAudited,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("SEO Audit error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
