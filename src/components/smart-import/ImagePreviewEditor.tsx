import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon } from "lucide-react";

interface ImagePreviewEditorProps {
  label: string;
  value?: string | null;
  editing?: boolean;
  onUpdate?: (url: string) => void;
}

export function ImagePreviewEditor({ label, value, editing, onUpdate }: ImagePreviewEditorProps) {
  const [url, setUrl] = useState(value || "");

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {editing ? (
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            onUpdate?.(e.target.value);
          }}
          placeholder="https://..."
          className="text-xs"
        />
      ) : null}
      {(editing ? url : value) ? (
        <img
          src={editing ? url : (value || "")}
          alt={label}
          className="w-full max-h-48 object-contain rounded-lg border border-border/40 bg-muted/20"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-border/40 bg-muted/10">
          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
