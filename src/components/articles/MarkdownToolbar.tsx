import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link2, Image, Minus,
  Eye, Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsert: (before: string, after?: string) => void;
  preview: boolean;
  onTogglePreview: () => void;
  isAr?: boolean;
}

const TOOLS = [
  { icon: Bold, label: "Bold", before: "**", after: "**", shortcut: "B" },
  { icon: Italic, label: "Italic", before: "_", after: "_", shortcut: "I" },
  { type: "sep" },
  { icon: Heading1, label: "Heading 1", before: "# ", after: "" },
  { icon: Heading2, label: "Heading 2", before: "## ", after: "" },
  { icon: Heading3, label: "Heading 3", before: "### ", after: "" },
  { type: "sep" },
  { icon: List, label: "Bullet List", before: "- ", after: "" },
  { icon: ListOrdered, label: "Numbered List", before: "1. ", after: "" },
  { icon: Quote, label: "Blockquote", before: "> ", after: "" },
  { icon: Minus, label: "Divider", before: "\n---\n", after: "" },
  { type: "sep" },
  { icon: Code, label: "Code", before: "`", after: "`" },
  { icon: Link2, label: "Link", before: "[", after: "](url)" },
  { icon: Image, label: "Image", before: "![alt](", after: ")" },
] as const;

export const MarkdownToolbar = memo(function MarkdownToolbar({ textareaRef, onInsert, preview, onTogglePreview, isAr }: Props) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap rounded-t-2xl border border-b-0 border-border/40 bg-muted/30 px-2 py-1.5">
      {TOOLS.map((tool, i) => {
        if ("type" in tool && tool.type === "sep") {
          return <Separator key={i} orientation="vertical" className="mx-1 h-5" />;
        }
        const t = tool as (typeof TOOLS)[0] & { icon: any; label: string; before: string; after: string };
        return (
          <Tooltip key={t.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg hover:bg-background"
                onClick={() => onInsert(t.before, t.after || "")}
              >
                <t.icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t.label}</TooltipContent>
          </Tooltip>
        );
      })}

      <div className="ms-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={preview ? "default" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 rounded-lg text-xs"
              onClick={onTogglePreview}
            >
              {preview ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {preview ? (isAr ? "تحرير" : "Edit") : (isAr ? "معاينة" : "Preview")}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {preview ? "Switch to editor" : "Preview markdown"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
