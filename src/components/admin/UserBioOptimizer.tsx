import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Languages } from "lucide-react";

interface Props {
  bio: string;
  onBioChange: (bio: string) => void;
  /** When translation completes, push the result to the OTHER language field */
  onTranslatedBioChange?: (translatedBio: string) => void;
  /** Language of THIS field */
  lang: "en" | "ar";
}

export function UserBioOptimizer({ bio, onBioChange, onTranslatedBioChange, lang }: Props) {
  const { toast } = useToast();
  const [optimizing, setOptimizing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const isAr = lang === "ar";

  const handleOptimize = async () => {
    if (!bio.trim()) {
      toast({ variant: "destructive", title: isAr ? "النبذة فارغة" : "Bio is empty" });
      return;
    }
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: bio, source_lang: lang, optimize_only: true },
      });
      if (error) throw error;
      if (data?.optimized) {
        onBioChange(data.optimized);
        toast({ title: isAr ? "تم تحسين النبذة" : "Bio optimized successfully" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في التحسين" : "Optimization Error", description: err.message });
    } finally {
      setOptimizing(false);
    }
  };

  const handleTranslate = async () => {
    if (!bio.trim()) {
      toast({ variant: "destructive", title: isAr ? "النبذة فارغة" : "Bio is empty" });
      return;
    }
    setTranslating(true);
    try {
      const targetLang = lang === "ar" ? "en" : "ar";
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: bio, source_lang: lang, target_lang: targetLang, optimize_seo: true },
      });
      if (error) throw error;
      if (data?.translated) {
        if (onTranslatedBioChange) {
          onTranslatedBioChange(data.translated);
        }
        toast({
          title: isAr
            ? "تمت الترجمة إلى الإنجليزية وتم تعبئة الحقل الآخر"
            : "Translated to Arabic and filled in the other field",
        });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في الترجمة" : "Translation Error", description: err.message });
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{isAr ? "النبذة بالعربية" : "Bio (English)"}</Label>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOptimize}
            disabled={optimizing || !bio.trim()}
            className="gap-1 text-xs"
          >
            {optimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {isAr ? "تحسين SEO" : "Optimize SEO"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTranslate}
            disabled={translating || !bio.trim()}
            className="gap-1 text-xs"
          >
            {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
            {isAr ? "ترجمة → EN" : "Translate → AR"}
          </Button>
        </div>
      </div>

      <Textarea
        value={bio}
        onChange={(e) => onBioChange(e.target.value)}
        rows={4}
        dir={isAr ? "rtl" : "ltr"}
        placeholder={
          isAr
            ? "نبذة مختصرة عن المستخدم وخبراته المهنية في مجال الطهي..."
            : "A brief summary of the user's professional culinary background, expertise, and achievements..."
        }
      />
      <p className="text-[10px] text-muted-foreground">
        {isAr
          ? "يُعرض في الملف الشخصي العام ونتائج البحث — استخدم زر التحسين لتعزيز ظهوره في محركات البحث"
          : "Displayed on public profile and search results — use Optimize to enhance SEO visibility"}
      </p>
    </div>
  );
}
