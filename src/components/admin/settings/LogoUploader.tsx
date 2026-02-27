import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  label: string;
  labelAr: string;
  isAr: boolean;
  value: string;
  onChange: (url: string) => void;
  bgClass?: string;
  folder?: string;
}

export function LogoUploader({ label, labelAr, isAr, value, onChange, bgClass = "bg-muted/20", folder = "logos" }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: isAr ? "يرجى اختيار صورة" : "Please select an image", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isAr ? "الحد الأقصى 5MB" : "Max file size is 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("brand-assets").getPublicUrl(fileName);
      onChange(data.publicUrl);
      toast({ title: isAr ? "تم رفع الشعار بنجاح" : "Logo uploaded successfully" });
    } catch (err: any) {
      toast({ title: isAr ? "فشل الرفع" : "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium">{isAr ? labelAr : label}</label>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 min-h-[100px] transition-all cursor-pointer hover:border-primary/40 group",
          bgClass
        )}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : value ? (
          <>
            <img src={value} alt={label} className="max-h-16 object-contain" />
            <button
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 end-2 h-5 w-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-[10px]">{isAr ? "انقر للرفع" : "Click to upload"}</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
    </div>
  );
}
