import { useState, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BilingualFieldProps {
  label: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (v: string) => void;
  onChangeAr: (v: string) => void;
  placeholderEn?: string;
  placeholderAr?: string;
  multiline?: boolean;
  rows?: number;
  context?: string;
}

export const BilingualField = memo(function BilingualField({
  label, labelAr, valueEn, valueAr, onChangeEn, onChangeAr,
  placeholderEn, placeholderAr, multiline, rows = 2, context = "culinary platform homepage section",
}: BilingualFieldProps) {
  const [translatingToAr, setTranslatingToAr] = useState(false);
  const [translatingToEn, setTranslatingToEn] = useState(false);

  const translate = useCallback(async (from: "en" | "ar") => {
    const text = from === "en" ? valueEn : valueAr;
    if (!text?.trim()) return;

    const setLoading = from === "en" ? setTranslatingToAr : setTranslatingToEn;
    setLoading(true);
    try {
      const to = from === "en" ? "ar" : "en";
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text, from, to, context },
      });
      if (error) throw error;
      if (data?.translated) {
        (from === "en" ? onChangeAr : onChangeEn)(data.translated);
        toast.success(from === "en" ? "تمت الترجمة ✓" : "Translated ✓");
      }
    } catch (err: any) {
      toast.error(err.message || "فشلت الترجمة");
    } finally {
      setLoading(false);
    }
  }, [valueEn, valueAr, onChangeEn, onChangeAr, context]);

  const Field = multiline ? Textarea : Input;
  const inputCls = cn("text-xs border-border/40 bg-background/60 focus:bg-background", !multiline && "h-8");

  if (multiline) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/10 overflow-hidden">
        <div className="p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <span className="inline-flex items-center justify-center h-4 w-5 rounded bg-primary/15 text-[8px] font-bold text-primary">ع</span>
              {labelAr}
            </Label>
            {valueAr?.trim() && <TranslateBtn loading={translatingToEn} onClick={() => translate("ar")} target="EN" />}
          </div>
          <Field value={valueAr} onChange={(e: any) => onChangeAr(e.target.value)} placeholder={placeholderAr || "...العربية"} className={inputCls} dir="rtl" rows={rows} />
        </div>
        <div className="border-t border-dashed border-border/30" />
        <div className="p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <span className="inline-flex items-center justify-center h-4 w-5 rounded bg-muted text-[8px] font-bold text-muted-foreground">EN</span>
              {label}
            </Label>
            {valueEn?.trim() && <TranslateBtn loading={translatingToAr} onClick={() => translate("en")} target="عربي" />}
          </div>
          <Field value={valueEn} onChange={(e: any) => onChangeEn(e.target.value)} placeholder={placeholderEn || "English..."} className={inputCls} dir="ltr" rows={rows} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {/* Arabic */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <span className="inline-flex items-center justify-center h-4 w-5 rounded bg-primary/15 text-[8px] font-bold text-primary">ع</span>
            {labelAr}
          </Label>
          {valueAr?.trim() && <TranslateBtn loading={translatingToEn} onClick={() => translate("ar")} target="EN" />}
        </div>
        <Input value={valueAr} onChange={(e) => onChangeAr(e.target.value)} placeholder={placeholderAr || "...العربية"} className={inputCls} dir="rtl" />
      </div>
      {/* English */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <span className="inline-flex items-center justify-center h-4 w-5 rounded bg-muted text-[8px] font-bold text-muted-foreground">EN</span>
            {label}
          </Label>
          {valueEn?.trim() && <TranslateBtn loading={translatingToAr} onClick={() => translate("en")} target="عربي" />}
        </div>
        <Input value={valueEn} onChange={(e) => onChangeEn(e.target.value)} placeholder={placeholderEn || "English..."} className={inputCls} dir="ltr" />
      </div>
    </div>
  );
}

function TranslateBtn({ loading, onClick, target }: { loading: boolean; onClick: () => void; target: string }) {
  return (
    <Button
      type="button" variant="ghost" size="sm"
      className="h-5 px-1.5 text-[9px] gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-md"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Languages className="h-2.5 w-2.5" />}
      <span>← {target}</span>
    </Button>
  );
});
