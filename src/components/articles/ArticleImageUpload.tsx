import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { ImagePlus, X, Loader2, Link2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ArticleImageUpload({ value, onChange, label, className }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [altText, setAltText] = useState("");

  const upload = useCallback(async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: t("File too large (max 10MB)", "الملف كبير جداً (الحد 10 ميجا)") });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: t("Only images are allowed", "الصور فقط مسموح بها") });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("article-images").upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast({ title: t("Image uploaded!", "تم رفع الصورة!") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Upload failed", "فشل الرفع"), description: err.message });
    } finally {
      setUploading(false);
    }
  }, [user, onChange, toast, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium mb-2">{label}</p>}
      {value ? (
        <div className="space-y-2">
          <div className="relative group rounded-2xl overflow-hidden border border-border/40">
            <img src={value} alt={altText || ""} className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="cursor-pointer">
                <Button variant="secondary" size="sm" className="rounded-xl pointer-events-none">
                  <ImagePlus className="h-4 w-4 me-1.5" /> {t("Replace", "استبدال")}
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => onChange("")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Image dimensions info */}
            <div className="absolute bottom-2 start-2 end-2 flex justify-between">
              <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-lg">{t("Cover Image", "صورة الغلاف")}</span>
            </div>
          </div>
          {/* Alt text */}
          <div className="flex gap-2 items-center">
            <Input
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder={t("Alt text (for SEO & accessibility)...", "النص البديل (للسيو وإمكانية الوصول)...")}
              className="rounded-xl text-xs flex-1"
            />
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-48 text-xs">
                {t("Alt text improves SEO and helps screen readers describe the image.", "النص البديل يحسن السيو ويساعد قارئات الشاشة في وصف الصورة.")}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-[10px] text-muted-foreground">
            💡 {t("Recommended: 1200×630px for optimal social sharing", "الأفضل: 1200×630 بكسل للمشاركة المثلى")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors cursor-pointer",
              dragOver ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/40 hover:bg-muted/30"
            )}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <ImagePlus className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                    {t("Click to upload", "اضغط للرفع")}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("or drag and drop • Max 10MB", "أو اسحب وأفلت • الحد 10 ميجا")}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t("Recommended: 1200×630px JPG/PNG/WebP", "الأفضل: 1200×630 بكسل JPG/PNG/WebP")}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {/* URL paste option */}
          {showUrlInput ? (
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder={t("Paste image URL...", "الصق رابط الصورة...")}
                className="rounded-xl text-xs flex-1"
                onKeyDown={e => e.key === "Enter" && handleUrlSubmit()}
              />
              <Button size="sm" className="rounded-xl" onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                {t("Add", "إضافة")}
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowUrlInput(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs gap-1.5 text-muted-foreground" onClick={() => setShowUrlInput(true)}>
              <Link2 className="h-3 w-3" /> {t("Or paste image URL", "أو الصق رابط صورة")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
