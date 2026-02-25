import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TranslatableInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir: "ltr" | "rtl";
  /** The paired field's current value (source for translation) */
  pairedValue: string;
  /** Callback to set the paired field */
  onTranslated: (v: string) => void;
  /** Language of THIS field: "en" or "ar" */
  lang: "en" | "ar";
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export function TranslatableInput({
  label, value, onChange, dir, pairedValue, onTranslated, lang, placeholder, multiline, rows = 3,
}: TranslatableInputProps) {
  const [translating, setTranslating] = useState(false);

  const handleTranslate = useCallback(async () => {
    const text = value;
    if (!text?.trim()) return;

    setTranslating(true);
    try {
      const targetLang = lang === "en" ? "ar" : "en";
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text, from: lang, to: targetLang, context: "culinary/chef profile/food industry" },
      });
      if (error) throw error;
      if (data?.translated) {
        onTranslated(data.translated);
        toast({ title: targetLang === "ar" ? "تمت الترجمة للعربية" : "Translated to English" });
      }
    } catch (err: any) {
      toast({ title: "Translation Error", description: err.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  }, [value, lang, onTranslated]);

  const targetLabel = lang === "en" ? "→ عربي" : "→ EN";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {value?.trim() && (
          <Button
            type="button" variant="ghost" size="sm"
            className="h-6 px-1.5 text-xs text-primary gap-1"
            onClick={handleTranslate}
            disabled={translating}
            title={lang === "en" ? "ترجمة إلى العربية" : "Translate to English"}
          >
            {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
            {targetLabel}
          </Button>
        )}
      </div>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} dir={dir} placeholder={placeholder} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} dir={dir} placeholder={placeholder} />
      )}
    </div>
  );
}
