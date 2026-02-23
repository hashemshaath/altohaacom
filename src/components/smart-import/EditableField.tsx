import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditableFieldProps {
  label: string;
  value?: string | null;
  fieldKey: string;
  onUpdate: (key: string, value: string) => void;
  copyable?: boolean;
  multiline?: boolean;
}

export const EditableField = React.memo(({ label, value, fieldKey, onUpdate, copyable, multiline }: EditableFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const handleSave = useCallback(() => {
    onUpdate(fieldKey, editValue);
    setEditing(false);
  }, [fieldKey, editValue, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditValue(value || "");
    setEditing(false);
  }, [value]);

  if (!value && !editing) return null;

  return (
    <div className="space-y-1 group">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-start gap-1.5">
        {editing ? (
          <div className="flex-1 flex items-start gap-1">
            {multiline ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="text-sm min-h-[60px]"
                autoFocus
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="text-sm h-8"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-green-600" onClick={handleSave}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={handleCancel}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            {multiline ? (
              <p className="text-sm leading-relaxed flex-1">{value}</p>
            ) : (
              <p className="text-sm truncate flex-1" title={value || ""}>{value}</p>
            )}
            <Button
              variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => { setEditValue(value || ""); setEditing(true); }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            {copyable && value && (
              <Button
                variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => { navigator.clipboard.writeText(value); toast({ title: "Copied!" }); }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
});
EditableField.displayName = "EditableField";
