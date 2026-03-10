import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Parse the service-account JSON stored as a secret */
function getServiceAccount(): {
  client_email: string;
  private_key: string;
  token_uri: string;
} {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON secret is not set");
  return JSON.parse(raw);
}

/** Create a signed JWT and exchange it for an access token */
async function getAccessToken(sa: ReturnType<typeof getServiceAccount>): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(
    JSON.stringify({
      iss: sa.client_email,
      scope:
        "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/indexing",
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    })
  );

  const signInput = `${header}.${claimSet}`;

  // Import PEM private key
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signInput)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${header.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.${claimSet
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")}.${sig}`;

  const tokenRes = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

// ─── Handlers ────────────────────────────────────────────

async function fetchSearchPerformance(
  token: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query", "page"],
        rowLimit: 500,
      }),
    }
  );
  if (!res.ok) throw new Error(`GSC API error: ${await res.text()}`);
  return res.json();
}

async function fetchUrlInspection(token: string, siteUrl: string, inspectUrl: string) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl: inspectUrl, siteUrl }),
  });
  if (!res.ok) throw new Error(`URL Inspection error: ${await res.text()}`);
  return res.json();
}

async function submitUrlForIndexing(token: string, url: string) {
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });
  if (!res.ok) throw new Error(`Indexing API error: ${await res.text()}`);
  return res.json();
}

// ─── Main ────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin
    const userId = claimsData.claims.sub as string;
    const { data: isAdmin } = await supabase.rpc("is_admin_user");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, siteUrl, startDate, endDate, urls } = body;

    const sa = getServiceAccount();
    const accessToken = await getAccessToken(sa);

    let result: any = {};

    switch (action) {
      case "search_performance": {
        const data = await fetchSearchPerformance(accessToken, siteUrl, startDate, endDate);
        const rows = data.rows || [];

        // Sync keyword positions back to tracked keywords
        const { data: trackedKws } = await supabase
          .from("seo_tracked_keywords")
          .select("id, keyword, current_position")
          .eq("is_active", true);

        if (trackedKws?.length) {
          for (const kw of trackedKws) {
            const match = rows.find(
              (r: any) => r.keys[0]?.toLowerCase() === kw.keyword.toLowerCase()
            );
            if (match) {
              const newPos = Math.round(match.position);
              await supabase
                .from("seo_tracked_keywords")
                .update({
                  previous_position: kw.current_position,
                  current_position: newPos,
                  best_position:
                    kw.current_position && kw.current_position < newPos
                      ? kw.current_position
                      : newPos,
                  last_checked_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", kw.id);

              // Store history
              await supabase.from("seo_keyword_history").insert({
                keyword_id: kw.id,
                position: newPos,
              });
            }
          }
        }

        result = {
          total_queries: rows.length,
          rows: rows.slice(0, 100).map((r: any) => ({
            query: r.keys[0],
            page: r.keys[1],
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            position: r.position,
          })),
          synced_keywords: trackedKws?.length || 0,
        };
        break;
      }

      case "inspect_urls": {
        const inspectionResults: any[] = [];
        const targetUrls: string[] = urls || [];

        for (const url of targetUrls.slice(0, 20)) {
          try {
            const inspection = await fetchUrlInspection(accessToken, siteUrl, url);
            const result = inspection.inspectionResult;
            const indexStatus = result?.indexStatusResult;

            inspectionResults.push({
              url,
              verdict: indexStatus?.verdict || "unknown",
              coverageState: indexStatus?.coverageState || "unknown",
              lastCrawlTime: indexStatus?.lastCrawlTime,
              pageFetchState: indexStatus?.pageFetchState,
              robotsTxtState: indexStatus?.robotsTxtState,
            });

            // Update indexing status in DB
            const path = new URL(url).pathname;
            await supabase
              .from("seo_indexing_status")
              .upsert(
                {
                  url,
                  path,
                  status:
                    indexStatus?.verdict === "PASS"
                      ? "indexed"
                      : indexStatus?.verdict === "FAIL"
                      ? "error"
                      : "unknown",
                  last_indexed_at: indexStatus?.lastCrawlTime || null,
                  coverage_state: indexStatus?.coverageState || null,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "url" }
              );
          } catch (e: any) {
            inspectionResults.push({ url, error: e.message });
          }
        }

        result = { inspections: inspectionResults };
        break;
      }

      case "submit_indexing": {
        const submissions: any[] = [];
        const targetUrls: string[] = urls || [];

        for (const url of targetUrls.slice(0, 10)) {
          try {
            const res = await submitUrlForIndexing(accessToken, url);
            submissions.push({ url, success: true, notification: res });

            // Update DB
            const path = new URL(url).pathname;
            await supabase
              .from("seo_indexing_status")
              .upsert(
                {
                  url,
                  path,
                  status: "submitted",
                  last_submitted_at: new Date().toISOString(),
                  submitted_to: ["google"],
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "url" }
              );
          } catch (e: any) {
            submissions.push({ url, success: false, error: e.message });
          }
        }

        result = { submissions };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
