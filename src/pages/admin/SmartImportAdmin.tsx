import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SmartImportDialog, type ImportedData } from "@/components/smart-import/SmartImportDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Building2, Building, MapPin, Trash2 } from "lucide-react";

export default function SmartImportAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState<"entity" | "company" | "establishment">("company");
  const [history, setHistory] = useState<(ImportedData & { _type: string; _time: string })[]>([]);

  const handleImport = (data: ImportedData) => {
    setHistory(prev => [{ ...data, _type: entityType, _time: new Date().toISOString() }, ...prev]);
  };

  const types = [
    { value: "entity" as const, icon: Building2, label: isAr ? "جهة" : "Entity" },
    { value: "company" as const, icon: Building, label: isAr ? "شركة" : "Company" },
    { value: "establishment" as const, icon: MapPin, label: isAr ? "منشأة" : "Establishment" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">
          {isAr ? "الاستيراد الذكي" : "Smart Import"}
        </h1>
        <p className="text-muted-foreground">
          {isAr
            ? "استيراد بيانات الكيانات والشركات والمنشآت تلقائياً من جوجل والمواقع الإلكترونية"
            : "Auto-import entity, company & establishment data from Google and websites"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {types.map(t => (
          <Card
            key={t.value}
            className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm"
            onClick={() => { setEntityType(t.value); setOpen(true); }}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <t.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{isAr ? "استيراد" : "Import"} {t.label}</p>
                <p className="text-sm text-muted-foreground">
                  {isAr ? "بحث واستيراد ذكي" : "Smart search & import"}
                </p>
              </div>
              <Sparkles className="ms-auto h-5 w-5 text-primary/50" />
            </CardContent>
          </Card>
        ))}
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{isAr ? "سجل الاستيراد" : "Import History"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                <Trash2 className="h-3.5 w-3.5 me-1" />{isAr ? "مسح" : "Clear"}
              </Button>
            </div>
            <CardDescription>{isAr ? "البيانات المستوردة في هذه الجلسة" : "Data imported in this session"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {history.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.name_en || item.name_ar || "—"}</p>
                        <Badge variant="secondary" className="text-[10px]">{item._type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.full_address_en || item.city_en || "—"}</p>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        {item.phone && <span>📞 {item.phone}</span>}
                        {item.website && <span>🌐 {item.website}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item._time).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <SmartImportDialog
        open={open}
        onOpenChange={setOpen}
        entityType={entityType}
        onImport={handleImport}
      />
    </div>
  );
}
