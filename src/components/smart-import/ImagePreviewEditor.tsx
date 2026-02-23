import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Image as ImageIcon,
  Upload,
  Link2,
  X,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface ImagePreviewEditorProps {
  label: string;
  value?: string | null;
  fieldKey: string;
  onUpdate: (key: string, value: string) => void;
  aspectRatio?: "square" | "wide";
  isAr?: boolean;
}

export const ImagePreviewEditor = React.memo(({
  label,
  value,
  fieldKey,
  onUpdate,
  aspectRatio = "square",
  isAr = false,
}: ImagePreviewEditorProps) => {
  const [mode, setMode] = useState<"preview" | "url" | "upload">("preview");
  const [urlInput, setUrlInput] = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSave = useCallback(() => {
    if (urlInput.trim()) {
      onUpdate(fieldKey, urlInput.trim());
      setImageError(false);
      setImageLoaded(false);
    }
    setMode("preview");
  }, [urlInput, fieldKey, onUpdate]);

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: isAr ? "ملف غير صالح" : "Invalid file", description: isAr ? "يرجى اختيار ملف صورة" : "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isAr ? "حجم الملف كبير" : "File too large", description: isAr ? "الحد الأقصى 5 ميجابايت" : "Maximum 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/smart-import/${fieldKey}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("user-media").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("user-media").getPublicUrl(path);
      onUpdate(fieldKey, publicUrl);
      setUrlInput(publicUrl);
      setImageError(false);
      setImageLoaded(false);
      setMode("preview");
      toast({ title: isAr ? "تم رفع الصورة" : "Image uploaded" });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ في الرفع" : "Upload error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [fieldKey, onUpdate, isAr]);

  const handleRemove = useCallback(() => {
    onUpdate(fieldKey, "");
    setUrlInput("");
    setImageError(false);
    setImageLoaded(false);
  }, [fieldKey, onUpdate]);

  const isWide = aspectRatio === "wide";
  const containerClass = isWide ? "aspect-[21/9]" : "aspect-square";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
        <div className="flex items-center gap-1">
          {value && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemove} title={isAr ? "حذف" : "Remove"}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMode("url")} title={isAr ? "رابط" : "URL"}>
            <Link2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fileInputRef.current?.click()} title={isAr ? "رفع" : "Upload"}>
            <Upload className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {mode === "url" && (
        <div className="flex gap-1.5">
          <Input
            className="text-xs h-8"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSave()}
            autoFocus
          />
          <Button size="sm" className="h-8 px-2" onClick={handleUrlSave}>
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setMode("preview")}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div
        className={`relative rounded-lg border-2 border-dashed overflow-hidden bg-muted/30 ${containerClass} ${!value ? "cursor-pointer hover:border-primary/40 transition-colors" : ""}`}
        onClick={!value ? () => fileInputRef.current?.click() : undefined}
      >
        {value && !imageError ? (
          <>
            {!imageLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}
            <img
              src={value}
              alt={label}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {imageLoaded && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={(e) => { e.stopPropagation(); setMode("url"); }}
                  >
                    <Pencil className="h-3 w-3" />{isAr ? "تعديل" : "Edit"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={(e) => { e.stopPropagation(); window.open(value, "_blank"); }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : value && imageError ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            <X className="h-6 w-6 text-destructive/50" />
            <p className="text-xs text-muted-foreground text-center">{isAr ? "تعذر تحميل الصورة" : "Failed to load image"}</p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setImageError(false); setImageLoaded(false); }}>
              <RefreshCw className="h-3 w-3" />{isAr ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/60">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8" />
                <p className="text-xs">{isAr ? "اسحب أو انقر لرفع صورة" : "Drop or click to upload"}</p>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
});
ImagePreviewEditor.displayName = "ImagePreviewEditor";
