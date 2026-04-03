import { handleCors } from "../_shared/cors.ts";
import { authenticateAdmin } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getServiceAccount() {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON secret is not set");
  return JSON.parse(raw) as { client_email: string; private_key: string; token_uri: string };
}

async function getAccessToken(sa: ReturnType<typeof getServiceAccount>): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/indexing",
    aud: sa.token_uri, iat: now, exp: now + 3600,
  }));

  const signInput = `${header}.${claimSet}`;
  const pemBody = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signInput));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const jwt = `${header.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.${claimSet.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.${sig}`;

  const tokenRes = await fetch(sa.token_uri, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
  return (await tokenRes.json()).access_token;
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { userClient } = await authenticateAdmin(req);
    const body = await req.json();
    const { action, siteUrl, startDate, endDate, urls } = body;

    const sa = getServiceAccount();
    const accessToken = await getAccessToken(sa);
    let result: any = {};

    switch (action) {
      case "search_performance": {
        const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate, dimensions: ["query", "page"], rowLimit: 500 }),
        });
        if (!res.ok) throw new Error(`GSC API error: ${await res.text()}`);
        const data = await res.json();
        const rows = data.rows || [];

        const { data: trackedKws } = await userClient.from("seo_tracked_keywords").select("id, keyword, current_position").eq("is_active", true);
        if (trackedKws?.length) {
          for (const kw of trackedKws) {
            const match = rows.find((r: any) => r.keys[0]?.toLowerCase() === kw.keyword.toLowerCase());
            if (match) {
              const newPos = Math.round(match.position);
              await userClient.from("seo_tracked_keywords").update({
                previous_position: kw.current_position, current_position: newPos,
                best_position: kw.current_position && kw.current_position < newPos ? kw.current_position : newPos,
                last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              }).eq("id", kw.id);
              await userClient.from("seo_keyword_history").insert({ keyword_id: kw.id, position: newPos });
            }
          }
        }

        result = { total_queries: rows.length, rows: rows.slice(0, 100).map((r: any) => ({ query: r.keys[0], page: r.keys[1], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })), synced_keywords: trackedKws?.length || 0 };
        break;
      }

      case "inspect_urls": {
        const inspections: any[] = [];
        for (const url of (urls || []).slice(0, 20)) {
          try {
            const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
              method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ inspectionUrl: url, siteUrl }),
            });
            if (!res.ok) throw new Error(`URL Inspection error: ${await res.text()}`);
            const inspection = await res.json();
            const indexStatus = inspection.inspectionResult?.indexStatusResult;
            inspections.push({ url, verdict: indexStatus?.verdict || "unknown", coverageState: indexStatus?.coverageState || "unknown", lastCrawlTime: indexStatus?.lastCrawlTime, pageFetchState: indexStatus?.pageFetchState });
            const path = new URL(url).pathname;
            await userClient.from("seo_indexing_status").upsert({ url, path, status: indexStatus?.verdict === "PASS" ? "indexed" : indexStatus?.verdict === "FAIL" ? "error" : "unknown", last_indexed_at: indexStatus?.lastCrawlTime || null, coverage_state: indexStatus?.coverageState || null, updated_at: new Date().toISOString() }, { onConflict: "url" });
          } catch (e: any) { inspections.push({ url, error: e.message }); }
        }
        result = { inspections };
        break;
      }

      case "submit_indexing": {
        const submissions: any[] = [];
        for (const url of (urls || []).slice(0, 10)) {
          try {
            const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
              method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ url, type: "URL_UPDATED" }),
            });
            if (!res.ok) throw new Error(`Indexing API error: ${await res.text()}`);
            submissions.push({ url, success: true, notification: await res.json() });
            const path = new URL(url).pathname;
            await userClient.from("seo_indexing_status").upsert({ url, path, status: "submitted", last_submitted_at: new Date().toISOString(), submitted_to: ["google"], updated_at: new Date().toISOString() }, { onConflict: "url" });
          } catch (e: any) { submissions.push({ url, success: false, error: e.message }); }
        }
        result = { submissions };
        break;
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }

    return jsonResponse(result);
  } catch (e: any) {
    console.error("gsc-sync error:", e);
    return errorResponse(e);
  }
});
