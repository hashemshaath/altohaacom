import { useState, useRef, memo, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, X, Pencil, ZoomIn, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  label: string;
  labelAr: string;
  isAr: boolean;
  value: string;
  onChange: (url: string) => void;
  bgClass?: string;
  folder?: string;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif"];
const ACCEPTED_EXT = ".png,.jpg,.jpeg,.webp,.svg,.gif";

export const LogoUploader = memo(forwardRef<HTMLDivElement, Props>(function LogoUploader(
  { label, labelAr, isAr, value, onChange, bgClass = "bg-muted/20", folder = "logos" },
  ref
) {
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: isAr ? "صيغة غير مدعومة" : "Unsupported format",
        description: isAr ? "يدعم PNG, JPG, WebP, SVG, GIF" : "Supports PNG, JPG, WebP, SVG, GIF",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isAr ? "الحد الأقصى 5MB" : "Max file size is 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("brand-assets").getPublicUrl(fileName);
      onChange(data.publicUrl);
      toast({ title: isAr ? "تم رفع الشعار بنجاح" : "Logo uploaded successfully" });
    } catch (err: unknown) {
      console.error("Upload error:", err);
      toast({
        title: isAr ? "فشل الرفع" : "Upload failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = () => {
    onChange("");
    toast({ title: isAr ? "تم حذف الشعار" : "Logo removed" });
  };

  const handleUrlSave = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  const isSvg = value?.toLowerCase().includes(".svg");

  return (
    <div className="space-y-2" ref={ref}>
      <label className="text-xs font-medium flex items-center gap-1.5">
        <FileImage className="h-3 w-3 text-muted-foreground" />
        {isAr ? labelAr : label}
      </label>

      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 min-h-[120px] transition-all group",
          value ? "border-solid border-border/30" : "cursor-pointer hover:border-primary/40",
          bgClass
        )}
        onClick={() => !uploading && !value && fileRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-[10px] text-muted-foreground">{isAr ? "جارٍ الرفع..." : "Uploading..."}</span>
          </div>
        ) : value ? (
          <>
            <img
              src={value}
              alt={label}
              className="max-h-20 max-w-[80%] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {isSvg && (
              <span className="absolute top-2 start-2 text-[9px] font-mono bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded">
                SVG
              </span>
            )}

            {/* Action buttons overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg"
                onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                title={isAr ? "معاينة" : "Preview"}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg"
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                title={isAr ? "استبدال" : "Replace"}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg"
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                title={isAr ? "حذف" : "Delete"}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-[10px]">{isAr ? "انقر للرفع" : "Click to upload"}</span>
            <span className="text-[9px] text-muted-foreground/60">PNG, JPG, SVG, WebP</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_EXT}
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* URL input toggle */}
      {!value && (
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[10px] h-6 px-2 text-muted-foreground"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            {isAr ? "أو أدخل رابط" : "or enter URL"}
          </Button>
        </div>
      )}

      {showUrlInput && !value && (
        <div className="flex gap-1">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="text-xs h-7 flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleUrlSave()}
          />
          <Button type="button" size="sm" className="h-7 text-xs px-2" onClick={handleUrlSave}>
            {isAr ? "حفظ" : "Save"}
          </Button>
        </div>
      )}

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{isAr ? labelAr : label}</DialogTitle>
          </DialogHeader>
          <div className={cn("rounded-xl p-6 flex items-center justify-center min-h-[200px]", bgClass)}>
            {value && (
              <img src={value} alt={label} className="max-h-64 max-w-full object-contain" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground break-all font-mono">{value}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}));
