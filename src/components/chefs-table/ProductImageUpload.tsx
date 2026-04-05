import { useState, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, X, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

interface Props {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  userId: string;
  maxImages?: number;
  isAr?: boolean;
}

export const ProductImageUpload = memo(function ProductImageUpload({ images, onImagesChange, userId, maxImages = 5, isAr }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (images.length + files.length > maxImages) {
      toast.error(isAr ? `الحد الأقصى ${maxImages} صور` : `Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(isAr ? "حجم الملف يجب أن يكون أقل من 5MB" : "File must be under 5MB");
          continue;
        }
        const ext = file.name.split(".").pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type });
        
        if (error) {
          toast.error(isAr ? "فشل رفع الصورة" : "Failed to upload image");
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        
        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
        toast.success(isAr 
          ? `تم رفع ${newUrls.length} صورة بنجاح` 
          : `${newUrls.length} image(s) uploaded successfully`);
      }
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء الرفع" : "Upload error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [images, maxImages, userId, onImagesChange, isAr]);

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border/40">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => handleRemove(i)}
                className="absolute top-1 end-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <label className="cursor-pointer">
          <Card className="border-dashed border-2 border-border/60 hover:border-primary/40 transition-colors">
            <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
              )}
              <p className="text-sm font-bold">
                {uploading
                  ? (isAr ? "جاري الرفع..." : "Uploading...")
                  : (isAr ? "أضف صور المنتج" : "Add Product Images")}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? `PNG, JPG حتى 5MB · الحد الأقصى ${maxImages} صور · ${images.length}/${maxImages} مرفوعة`
                  : `PNG, JPG up to 5MB · Max ${maxImages} · ${images.length}/${maxImages} uploaded`}
              </p>
            </CardContent>
          </Card>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
});
