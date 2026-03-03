import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Languages, Loader2, ArrowRightLeft } from "lucide-react";
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

export function BilingualField({
  label, labelAr, valueEn, valueAr, onChangeEn, onChangeAr,
  placeholderEn, placeholderAr, multiline, rows = 2, context = "culinary platform homepage section",
}: BilingualFieldProps) {
  const [translatingEn, setTranslatingEn] = useState(false);
  const [translatingAr, setTranslatingAr] = useState(false);

  const handleTranslate = useCallback(async (from: "en" | "ar") => {
    const text = from === "en" ? valueEn : valueAr;
    if (!text?.trim()) {
      toast.error(from === "en" ? "Enter English text first" : "أدخل النص العربي أولاً");
      return;
    }

    const setLoading = from === "en" ? setTranslatingEn : setTranslatingAr;
    setLoading(true);

    try {
      const to = from === "en" ? "ar" : "en";
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text, from, to, context },
      });
      if (error) throw error;
      if (data?.translated) {
        if (from === "en") onChangeAr(data.translated);
        else onChangeEn(data.translated);
        toast.success(from === "en" ? "تمت الترجمة للعربية ✓" : "Translated to English ✓");
      }
    } catch (err: any) {
      toast.error(err.message || "Translation failed");
    } finally {
      setLoading(false);
    }
  }, [valueEn, valueAr, onChangeEn, onChangeAr, context]);

  const InputComp = multiline ? Textarea : Input;
  const inputClass = multiline ? "text-sm" : "h-8 text-sm";

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{label} / {labelAr}</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button" variant="ghost" size="sm"
            className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
            onClick={() => handleTranslate("en")}
            disabled={translatingEn || !valueEn?.trim()}
            title="Translate EN → AR"
          >
            {translatingEn ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
            EN→AR
          </Button>
          <ArrowRightLeft className="h-3 w-3 text-muted-foreground/40" />
          <Button
            type="button" variant="ghost" size="sm"
            className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
            onClick={() => handleTranslate("ar")}
            disabled={translatingAr || !valueAr?.trim()}
            title="ترجمة AR → EN"
          >
            {translatingAr ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
            AR→EN
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-medium">English</span>
          <InputComp
            value={valueEn}
            onChange={(e: any) => onChangeEn(e.target.value)}
            placeholder={placeholderEn || "English..."}
            className={cn(inputClass)}
            dir="ltr"
            {...(multiline ? { rows } : {})}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-medium">العربية</span>
          <InputComp
            value={valueAr}
            onChange={(e: any) => onChangeAr(e.target.value)}
            placeholder={placeholderAr || "...العربية"}
            className={cn(inputClass)}
            dir="rtl"
            {...(multiline ? { rows } : {})}
          />
        </div>
      </div>
    </div>
  );
}
