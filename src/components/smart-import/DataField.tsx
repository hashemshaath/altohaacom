import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DataFieldProps {
  label: string;
  value?: string | null;
  copyable?: boolean;
  multiline?: boolean;
}

export const DataField = React.memo(({ label, value, copyable, multiline }: DataFieldProps) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-start gap-1.5">
        {multiline ? (
          <p className="text-sm leading-relaxed flex-1">{value}</p>
        ) : (
          <p className="text-sm truncate flex-1" title={value}>{value}</p>
        )}
        {copyable && (
          <Button
            variant="ghost" size="icon" className="h-6 w-6 shrink-0"
            onClick={() => { navigator.clipboard.writeText(value); toast({ title: "Copied!" }); }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
});
DataField.displayName = "DataField";

interface TagListProps {
  label: string;
  items?: string[] | null;
}

export const TagList = React.memo(({ label, items }: TagListProps) => {
  if (!items?.length) return null;
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
        ))}
      </div>
    </div>
  );
});
TagList.displayName = "TagList";
