import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const tables = ["organizers", "companies", "culinary_entities", "establishments"];
    const duplicateGroups: any[] = [];

    for (const table of tables) {
      // Simple name-based duplicate detection
      const { data: records } = await supabase
        .from(table)
        .select("id, name, name_ar, email, phone, website, city, country")
        .order("name")
        .limit(1000);

      if (!records || records.length < 2) continue;

      const seen = new Map<string, any[]>();
      for (const rec of records) {
        const key = (rec.name || "").toLowerCase().trim();
        if (!key) continue;
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(rec);
      }

      for (const [name, group] of seen) {
        if (group.length > 1) {
          duplicateGroups.push({
            table,
            name,
            count: group.length,
            ids: group.map((r: any) => r.id),
          });
        }
      }

      // Also check email duplicates
      const emailSeen = new Map<string, any[]>();
      for (const rec of records) {
        const email = (rec.email || "").toLowerCase().trim();
        if (!email) continue;
        if (!emailSeen.has(email)) emailSeen.set(email, []);
        emailSeen.get(email)!.push(rec);
      }

      for (const [email, group] of emailSeen) {
        if (group.length > 1) {
          const alreadyFound = duplicateGroups.some(
            (g) => g.table === table && g.ids.some((id: string) => group.some((r: any) => r.id === id))
          );
          if (!alreadyFound) {
            duplicateGroups.push({
              table,
              name: email,
              count: group.length,
              ids: group.map((r: any) => r.id),
              match_type: "email",
            });
          }
        }
      }
    }

    // Log result as admin action if duplicates found
    if (duplicateGroups.length > 0) {
      // Create a notification for admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "supervisor");

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin: any) => ({
          user_id: admin.user_id,
          title: `⚠️ ${duplicateGroups.length} duplicate groups detected`,
          title_ar: `⚠️ تم اكتشاف ${duplicateGroups.length} مجموعة مكررة`,
          body: `Scheduled scan found ${duplicateGroups.length} potential duplicate groups across ${tables.join(", ")}.`,
          body_ar: `عثر الفحص المجدول على ${duplicateGroups.length} مجموعة مكررة محتملة.`,
          type: "dedup_alert",
          link: "/admin/deduplication",
          metadata: {
            total_groups: duplicateGroups.length,
            tables_scanned: tables,
            scan_type: "scheduled",
          },
        }));

        await supabase.from("notifications").insert(notifications);
      }

      // Log the scan as an admin action
      const adminId = admins?.[0]?.user_id;
      if (adminId) {
        await supabase.from("admin_actions").insert({
          admin_id: adminId,
          action_type: "scheduled_dedup_scan",
          details: {
            total_groups: duplicateGroups.length,
            tables_scanned: tables,
            groups_summary: duplicateGroups.slice(0, 10),
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        duplicates_found: duplicateGroups.length,
        groups: duplicateGroups,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
