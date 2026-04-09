import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const supabase = getServiceClient();
    const tables = ["organizers", "companies", "culinary_entities", "establishments"];
    const duplicateGroups: any[] = [];

    for (const table of tables) {
      const { data: records } = await supabase.from(table)
        .select("id, name, name_ar, email, phone, website, city, country").order("name").limit(1000);
      if (!records || records.length < 2) continue;

      // Name-based duplicates
      const seen = new Map<string, any[]>();
      for (const rec of records) {
        const key = (rec.name || "").toLowerCase().trim();
        if (!key) continue;
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(rec);
      }
      for (const [name, group] of seen) {
        if (group.length > 1) duplicateGroups.push({ table, name, count: group.length, ids: group.map((r: any) => r.id) });
      }

      // Email-based duplicates
      const emailSeen = new Map<string, any[]>();
      for (const rec of records) {
        const email = (rec.email || "").toLowerCase().trim();
        if (!email) continue;
        if (!emailSeen.has(email)) emailSeen.set(email, []);
        emailSeen.get(email)!.push(rec);
      }
      for (const [email, group] of emailSeen) {
        if (group.length > 1) {
          const alreadyFound = duplicateGroups.some(g => g.table === table && g.ids.some((id: string) => group.some((r: any) => r.id === id)));
          if (!alreadyFound) duplicateGroups.push({ table, name: email, count: group.length, ids: group.map((r: any) => r.id), match_type: "email" });
        }
      }
    }

    if (duplicateGroups.length > 0) {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "supervisor");
      if (admins?.length) {
        await supabase.from("notifications").insert(admins.map((admin: any) => ({
          user_id: admin.user_id,
          title: `⚠️ ${duplicateGroups.length} duplicate groups detected`,
          title_ar: `⚠️ تم اكتشاف ${duplicateGroups.length} مجموعة مكررة`,
          body: `Scheduled scan found ${duplicateGroups.length} potential duplicate groups across ${tables.join(", ")}.`,
          body_ar: `عثر الفحص المجدول على ${duplicateGroups.length} مجموعة مكررة محتملة.`,
          type: "dedup_alert", link: "/admin/deduplication",
          metadata: { total_groups: duplicateGroups.length, tables_scanned: tables, scan_type: "scheduled" },
        })));

        await supabase.from("admin_actions").insert({
          admin_id: admins[0].user_id, action_type: "scheduled_dedup_scan",
          details: { total_groups: duplicateGroups.length, tables_scanned: tables, groups_summary: duplicateGroups.slice(0, 10) },
        });
      }
    }

    return jsonResponse({ success: true, duplicates_found: duplicateGroups.length, groups: duplicateGroups });
  } catch (error: unknown) {
    console.error("Scheduled dedup scan error:", error);
    return errorResponse(error);
  }
});
