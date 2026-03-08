import { useState, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface CatalogImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  companyId: string;
  language: string;
}

export function CatalogImageUpload({ imageUrl, onImageChange, companyId, language }: CatalogImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: language === "ar" ? "يرجى اختيار صورة" : "Please select an image", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: language === "ar" ? "الحد الأقصى 5 ميجابايت" : "Max 5MB allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${companyId}/catalog/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-media")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-media")
        .getPublicUrl(path);

      onImageChange(publicUrl);
      toast({ title: language === "ar" ? "تم رفع الصورة" : "Image uploaded" });
    } catch {
      toast({ title: language === "ar" ? "فشل الرفع" : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onImageChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{language === "ar" ? "صورة المنتج" : "Product Image"}</Label>
      {imageUrl ? (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border">
          <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 end-1 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span className="text-xs">{language === "ar" ? "رفع صورة" : "Upload"}</span>
            </>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
