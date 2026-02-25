import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { History, FileText, User, Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface CVImportRecord {
  id: string;
  chef_id: string;
  imported_by: string;
  status: string;
  file_name: string | null;
  input_method: string;
  sections_imported: string[];
  records_created: number;
  created_at: string;
}

interface Props {
  isAr: boolean;
  refreshTrigger?: number;
}

export function CVImportHistory({ isAr, refreshTrigger }: Props) {
  const [imports, setImports] = useState<CVImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [chefNames, setChefNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cv_imports")
        .select("id, chef_id, imported_by, status, file_name, input_method, sections_imported, records_created, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setImports(data || []);

      // Fetch chef names
      const chefIds = [...new Set((data || []).map(d => d.chef_id))];
      if (chefIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, full_name_ar")
          .in("user_id", chefIds);

        if (profiles) {
          const names: Record<string, string> = {};
          profiles.forEach(p => {
            names[p.user_id] = isAr ? (p.full_name_ar || p.full_name || "—") : (p.full_name || "—");
          });
          setChefNames(names);
        }
      }
    } catch (err) {
      console.error("Failed to load import history:", err);
    }
    setLoading(false);
  };

  const sectionLabel = (s: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      personal: { en: "Personal", ar: "شخصي" },
      education: { en: "Education", ar: "تعليم" },
      work: { en: "Work", ar: "خبرات" },
      competitions: { en: "Competitions", ar: "مسابقات" },
      media: { en: "Media", ar: "إعلام" },
      certifications: { en: "Certifications", ar: "شهادات" },
    };
    return isAr ? (labels[s]?.ar || s) : (labels[s]?.en || s);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (imports.length === 0) return null;

  const displayed = expanded ? imports : imports.slice(0, 5);

  return (
    <Card className="border-muted">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            {isAr ? `سجل الاستيراد (${imports.length})` : `Import History (${imports.length})`}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadHistory} className="text-xs h-7">
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className={expanded ? "max-h-[400px]" : ""}>
          <div className="space-y-1.5">
            {displayed.map((imp) => (
              <div key={imp.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/20 bg-muted/20 text-xs">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      <User className="h-3 w-3 inline me-1" />
                      {chefNames[imp.chef_id] || imp.chef_id.slice(0, 8)}
                    </span>
                    <Badge
                      variant={imp.status === "completed" ? "default" : "destructive"}
                      className="text-[9px] h-4"
                    >
                      {imp.status === "completed" ? "✓" : "✗"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(imp.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span>{imp.records_created} {isAr ? "سجل" : "records"}</span>
                    {imp.sections_imported?.map(s => (
                      <Badge key={s} variant="outline" className="text-[9px] h-4">{sectionLabel(s)}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {imports.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? (isAr ? "عرض أقل" : "Show less") : (isAr ? `عرض الكل (${imports.length})` : `Show all (${imports.length})`)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
