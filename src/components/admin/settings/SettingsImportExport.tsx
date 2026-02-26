import { useState, useRef, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download, Upload, FileJson, AlertTriangle, CheckCircle2, Loader2, Shield,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const SettingsImportExport = memo(function SettingsImportExport() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [settingsRes, sectionsRes] = await Promise.all([
        supabase.from("site_settings").select("key, value, category"),
        supabase.from("homepage_sections").select("*").order("sort_order"),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (sectionsRes.error) throw sectionsRes.error;

      const exportData = {
        version: 1,
        exported_at: new Date().toISOString(),
        site_settings: settingsRes.data || [],
        homepage_sections: sectionsRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `site-settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: isAr ? "تم تصدير الإعدادات" : "Settings exported",
        description: isAr ? "تم تنزيل ملف النسخة الاحتياطية" : "Backup file downloaded successfully",
      });
    } catch {
      toast({ title: isAr ? "خطأ في التصدير" : "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.version || !data.site_settings) {
          toast({ title: isAr ? "ملف غير صالح" : "Invalid file format", variant: "destructive" });
          return;
        }
        setImportData(data);
      } catch {
        toast({ title: isAr ? "خطأ في قراءة الملف" : "Failed to read file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!importData) return;
    setIsImporting(true);
    try {
      // Upsert site settings
      for (const setting of importData.site_settings) {
        await supabase.from("site_settings").upsert(
          { key: setting.key, value: setting.value, category: setting.category || "general", updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      }

      // Upsert homepage sections
      if (importData.homepage_sections?.length) {
        for (const section of importData.homepage_sections) {
          const { id, updated_at, ...rest } = section;
          await supabase.from("homepage_sections").upsert(
            { id, ...rest, updated_at: new Date().toISOString() } as any,
            { onConflict: "id" }
          );
        }
      }

      qc.invalidateQueries({ queryKey: ["site-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings-global"] });
      qc.invalidateQueries({ queryKey: ["homepage-sections"] });

      setImportData(null);
      toast({
        title: isAr ? "تم استيراد الإعدادات" : "Settings imported",
        description: isAr ? "تم استعادة جميع الإعدادات بنجاح" : "All settings restored successfully",
      });
    } catch {
      toast({ title: isAr ? "خطأ في الاستيراد" : "Import failed", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileJson className="h-4 w-4 text-primary" />
          {isAr ? "استيراد وتصدير الإعدادات" : "Import & Export Settings"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isAr ? "نسخ احتياطي واستعادة جميع إعدادات الموقع" : "Backup and restore all site settings as JSON"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2 h-12 flex-col" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="text-xs">{isAr ? "تصدير" : "Export"}</span>
          </Button>

          <Button variant="outline" className="gap-2 h-12 flex-col" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            <span className="text-xs">{isAr ? "استيراد" : "Import"}</span>
          </Button>
        </div>

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />

        {importData && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">{isAr ? "ملف جاهز للاستيراد" : "File ready to import"}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              <Badge variant="secondary" className="text-[9px]">
                {importData.site_settings?.length || 0} {isAr ? "إعداد" : "settings"}
              </Badge>
              <Badge variant="secondary" className="text-[9px]">
                {importData.homepage_sections?.length || 0} {isAr ? "قسم" : "sections"}
              </Badge>
              <Badge variant="outline" className="text-[9px]">
                {new Date(importData.exported_at).toLocaleDateString(isAr ? "ar" : "en")}
              </Badge>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="gap-1.5 w-full h-8 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isAr ? "تأكيد الاستيراد" : "Confirm Import"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {isAr ? "تأكيد الاستيراد" : "Confirm Import"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isAr
                      ? "سيؤدي هذا إلى استبدال جميع الإعدادات الحالية. هل أنت متأكد؟"
                      : "This will overwrite all current settings. Are you sure?"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleImport} disabled={isImporting}>
                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isAr ? "استيراد" : "Import"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
