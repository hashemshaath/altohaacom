import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileJson, FileText, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ExportFormat = "json" | "csv";

export function UserDataExport() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const bom = mimeType.includes("csv") ? "\uFEFF" : "";
    const blob = new Blob([bom + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportData = async (format: ExportFormat) => {
    if (!user) return;
    setExporting(true);

    try {
      // Fetch all user data in parallel
      const [profileRes, walletsRes, pointsRes, certsRes, membershipRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("user_wallets").select("wallet_number, balance, points_balance, currency, created_at").eq("user_id", user.id).single(),
        supabase.from("points_ledger").select("action_type, points, balance_after, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("certificates").select("certificate_number, type, status, recipient_name, event_name, achievement, issued_at").eq("recipient_id", user.id).order("issued_at", { ascending: false }),
        supabase.from("membership_cards").select("membership_number, membership_type, tier, status, issued_at, expires_at").eq("user_id", user.id).single(),
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data,
        wallet: walletsRes.data,
        points_history: pointsRes.data || [],
        certificates: certsRes.data || [],
        membership: membershipRes.data,
      };

      const date = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        downloadFile(
          JSON.stringify(exportPayload, null, 2),
          `my-data-${date}.json`,
          "application/json;charset=utf-8"
        );
      } else {
        // CSV: export profile as flat key-value
        const profile = exportPayload.profile || {};
        const rows = Object.entries(profile)
          .filter(([k]) => !["id"].includes(k))
          .map(([k, v]) => `"${k}","${String(v ?? "").replace(/"/g, '""')}"`);
        const csv = "Field,Value\n" + rows.join("\n");
        downloadFile(csv, `my-profile-${date}.csv`, "text/csv;charset=utf-8");
      }

      toast({ title: isAr ? "✅ تم تصدير بياناتك" : "✅ Data exported successfully" });
    } catch {
      toast({ title: isAr ? "حدث خطأ" : "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "تصدير بياناتك" : "Export Your Data"}
          <Badge variant="secondary" className="text-[10px]">GDPR</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "قم بتحميل نسخة من جميع بياناتك الشخصية المخزنة على المنصة."
            : "Download a copy of all your personal data stored on the platform."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => exportData("json")}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileJson className="h-3.5 w-3.5" />}
            {isAr ? "تحميل JSON" : "Download JSON"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => exportData("csv")}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {isAr ? "تحميل CSV" : "Download CSV"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          {isAr
            ? "يشمل: الملف الشخصي، المحفظة، النقاط، الشهادات، العضوية"
            : "Includes: Profile, Wallet, Points, Certificates, Membership"}
        </p>
      </CardContent>
    </Card>
  );
}
