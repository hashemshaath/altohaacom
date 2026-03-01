import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, Image, Loader2, X, FileImage } from "lucide-react";

interface Props {
  exhibitionId: string;
  coverImageUrl?: string;
  onCoverChange?: (url: string) => void;
}

const MEDIA_CATEGORIES = [
  { value: "cover", en: "Cover Image", ar: "صورة الغلاف" },
  { value: "logo", en: "Logo", ar: "الشعار" },
  { value: "gallery", en: "Gallery", ar: "معرض الصور" },
  { value: "sponsor", en: "Sponsor Logo", ar: "شعار الراعي" },
  { value: "banner", en: "Banner", ar: "بانر" },
];

export function ExhibitionMediaUploader({ exhibitionId, coverImageUrl, onCoverChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("gallery");

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["exhibition-media", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_media")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!exhibitionId,
  });

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `exhibitions/${exhibitionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("exhibition-files").upload(path, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("exhibition-files").getPublicUrl(path);

        const { error: dbError } = await supabase.from("exhibition_media").insert({
          exhibition_id: exhibitionId,
          file_url: publicUrl,
          file_type: file.type.startsWith("image") ? "image" : "file",
          title: file.name,
          category,
        });
        if (dbError) throw dbError;

        // Auto-set cover if category is cover
        if (category === "cover" && onCoverChange) {
          onCoverChange(publicUrl);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["exhibition-media", exhibitionId] });
      toast({ title: t("Uploaded successfully", "تم الرفع بنجاح") });
    } catch (err: any) {
      toast({ title: t("Upload failed", "فشل الرفع"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [exhibitionId, category, onCoverChange, queryClient, t]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-media", exhibitionId] });
      toast({ title: t("Deleted", "تم الحذف") });
    },
  });

  if (!exhibitionId) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t("Save the exhibition first to upload media.", "احفظ الفعالية أولاً لرفع الوسائط.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">{t("Category", "التصنيف")}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEDIA_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`media-upload-${exhibitionId}`} className="cursor-pointer">
            <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs" asChild disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {t("Upload Files", "رفع ملفات")}
              </span>
            </Button>
          </Label>
          <input
            id={`media-upload-${exhibitionId}`}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Cover preview */}
      {coverImageUrl && (
        <div className="space-y-1">
          <Label className="text-xs">{t("Current Cover", "الغلاف الحالي")}</Label>
          <img src={coverImageUrl} alt="Cover" className="h-24 w-40 rounded-xl object-cover border" />
        </div>
      )}

      {/* Media grid */}
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : media.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {media.map(item => (
            <div key={item.id} className="group relative rounded-xl border overflow-hidden bg-muted/20">
              <img src={item.file_url} alt={item.title || ""} className="h-20 w-full object-cover" />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Badge className="absolute bottom-1 start-1 text-[8px] h-4 border-0 bg-background/80 text-foreground">
                {MEDIA_CATEGORIES.find(c => c.value === item.category)?.[isAr ? "ar" : "en"] || item.category}
              </Badge>
              {item.category === "cover" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-1 end-1 text-[8px] h-5 px-1.5"
                  onClick={() => onCoverChange?.(item.file_url)}
                >
                  {t("Set Cover", "غلاف")}
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("No media uploaded yet", "لم يتم رفع وسائط بعد")}</p>
      )}
    </div>
  );
}
