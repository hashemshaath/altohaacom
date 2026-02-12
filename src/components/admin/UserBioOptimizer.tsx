import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Languages, ArrowRightLeft } from "lucide-react";

interface Props {
  bio: string;
  onBioChange: (bio: string) => void;
  isAr: boolean;
}

export function UserBioOptimizer({ bio, onBioChange, isAr }: Props) {
  const { toast } = useToast();
  const [optimizing, setOptimizing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedBio, setTranslatedBio] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);

  const handleOptimize = async () => {
    if (!bio.trim()) {
      toast({ variant: "destructive", title: isAr ? "النبذة فارغة" : "Bio is empty" });
      return;
    }
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: {
          text: bio,
          source_lang: isAr ? "ar" : "en",
          optimize_only: true,
        },
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
      // Detect language: if mostly Arabic chars, source is Arabic
      const arabicRatio = (bio.match(/[\u0600-\u06FF]/g) || []).length / bio.length;
      const sourceLang = arabicRatio > 0.3 ? "ar" : "en";
      const targetLang = sourceLang === "ar" ? "en" : "ar";

      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: {
          text: bio,
          source_lang: sourceLang,
          target_lang: targetLang,
          optimize_seo: true,
        },
      });
      if (error) throw error;
      if (data?.translated) {
        setTranslatedBio(data.translated);
        setShowTranslation(true);
        toast({ title: isAr ? "تمت الترجمة بنجاح" : "Translation complete" });
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
        <Label>{isAr ? "نبذة تعريفية" : "Bio"}</Label>
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
            {isAr ? "تحسين المحتوى" : "Optimize"}
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
            {isAr ? "ترجمة" : "Translate"}
          </Button>
        </div>
      </div>

      <Textarea
        value={bio}
        onChange={(e) => onBioChange(e.target.value)}
        rows={4}
        placeholder={isAr ? "نبذة مختصرة عن المستخدم وخبراته المهنية في مجال الطهي..." : "A brief summary of the user's professional culinary background, expertise, and achievements..."}
      />
      <p className="text-[10px] text-muted-foreground">
        {isAr
          ? "يُعرض في الملف الشخصي العام ونتائج البحث — استخدم زر التحسين لتعزيز ظهوره في محركات البحث"
          : "Displayed on public profile and search results — use Optimize to enhance SEO visibility"}
      </p>

      {showTranslation && translatedBio && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary">
              {isAr ? "النص المترجم" : "Translated Text"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onBioChange(translatedBio);
                setShowTranslation(false);
                toast({ title: isAr ? "تم استبدال النبذة بالترجمة" : "Bio replaced with translation" });
              }}
              className="gap-1 text-xs h-7"
            >
              <ArrowRightLeft className="h-3 w-3" />
              {isAr ? "استخدام الترجمة" : "Use Translation"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground" dir={translatedBio.match(/[\u0600-\u06FF]/) ? "rtl" : "ltr"}>
            {translatedBio}
          </p>
        </div>
      )}
    </div>
  );
}
