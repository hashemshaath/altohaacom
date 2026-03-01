import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link2, Loader2, CheckCircle, XCircle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BulkUrlImportProps {
  isAr: boolean;
  onComplete: () => void;
  userId?: string;
}

export const BulkUrlImport = React.memo(({ isAr, onComplete, userId }: BulkUrlImportProps) => {
  const [urlText, setUrlText] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  const urls = urlText.split("\n").map(u => u.trim()).filter(u => u && (u.startsWith("http") || u.includes(".")));

  const handleImport = useCallback(async () => {
    if (!urls.length) return;
    setImporting(true);
    setResults([]);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke("smart-import", {
        body: { urls, mode: "bulk_url" },
      });

      if (error) throw new Error(typeof error === 'object' && error.message ? error.message : String(error));
      if (!data?.success) throw new Error(data?.error || "Bulk import failed");

      const bulkResults = data.results || [];
      setResults(bulkResults);
      setProgress(100);

      const successes = bulkResults.filter((r: any) => r.success).length;
      const failures = bulkResults.length - successes;

      toast({
        title: isAr ? "تم الاستيراد" : "Import Complete",
        description: isAr
          ? `✅ ${successes} نجح | ❌ ${failures} فشل`
          : `✅ ${successes} succeeded | ❌ ${failures} failed`,
      });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }, [urls, isAr]);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          {isAr ? "استيراد جماعي من روابط" : "Bulk URL Import"}
          <Badge variant="secondary" className="text-[10px]">{isAr ? "جديد" : "NEW"}</Badge>
        </CardTitle>
        <CardDescription>
          {isAr
            ? "الصق عدة روابط (كل رابط في سطر) لاستخراج البيانات دفعة واحدة — حتى 10 روابط"
            : "Paste multiple URLs (one per line) to extract data in batch — up to 10 URLs"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder={isAr
            ? "https://example1.com\nhttps://example2.com\nhttps://example3.com"
            : "https://example1.com\nhttps://example2.com\nhttps://example3.com"}
          className="min-h-[120px] font-mono text-sm"
          disabled={importing}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {urls.length > 0
              ? (isAr ? `${Math.min(urls.length, 10)} رابط جاهز` : `${Math.min(urls.length, 10)} URL${urls.length > 1 ? 's' : ''} ready`)
              : (isAr ? "أدخل روابط أعلاه" : "Enter URLs above")}
          </span>
          <Button
            onClick={handleImport}
            disabled={importing || urls.length === 0}
            className="gap-2"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {importing
              ? (isAr ? "جاري الاستخراج..." : "Extracting...")
              : (isAr ? `استخراج ${Math.min(urls.length, 10)} رابط` : `Extract ${Math.min(urls.length, 10)} URL${urls.length > 1 ? 's' : ''}`)}
          </Button>
        </div>

        {importing && <Progress value={progress} className="h-2" />}

        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium">{isAr ? "النتائج:" : "Results:"}</p>
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl border text-sm">
                {r.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span className="truncate flex-1 font-mono text-xs">{r.url}</span>
                {r.success && r.data?.name_en && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">{r.data.name_en}</Badge>
                )}
                {r.suggested_target && (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">{r.suggested_target.sub_type}</Badge>
                )}
                {!r.success && r.error && (
                  <span className="text-xs text-destructive truncate max-w-[150px]">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
BulkUrlImport.displayName = "BulkUrlImport";
