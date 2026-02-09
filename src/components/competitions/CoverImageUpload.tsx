import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";

interface CoverImageUploadProps {
  currentUrl: string | null;
  onUrlChange: (url: string | null) => void;
}

export function CoverImageUpload({ currentUrl, onUrlChange }: CoverImageUploadProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: language === "ar" ? "نوع ملف غير صالح" : "Invalid file type" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: language === "ar" ? "الملف كبير جداً" : "File too large (max 5MB)" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("competition-images").upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from("competition-images").getPublicUrl(path);
      setPreview(data.publicUrl);
      onUrlChange(data.publicUrl);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    setPreview(null);
    onUrlChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>{language === "ar" ? "صورة الغلاف" : "Cover Image"}</Label>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleSelect} className="hidden" disabled={uploading} />

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Cover" className="h-48 w-full rounded-lg object-cover" />
          <Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2" onClick={remove} disabled={uploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{language === "ar" ? "انقر لإضافة صورة غلاف" : "Click to add a cover image"}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "الحد الأقصى 5 ميجابايت" : "Max 5MB"}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
