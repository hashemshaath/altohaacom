import { useRef, useState, useCallback } from "react";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: string;
  minRows?: number;
  isAr?: boolean;
  className?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, dir, minRows = 16, isAr, className }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const handleInsert = useCallback((before: string, after: string = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);
    // Restore cursor position after React re-renders
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(
        selected ? cursorPos : start + before.length,
        selected ? cursorPos : start + before.length
      );
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "b") { e.preventDefault(); handleInsert("**", "**"); }
      if (e.key === "i") { e.preventDefault(); handleInsert("_", "_"); }
      if (e.key === "k") { e.preventDefault(); handleInsert("[", "](url)"); }
    }
    // Tab indentation
    if (e.key === "Tab") {
      e.preventDefault();
      handleInsert("  ");
    }
  }, [handleInsert]);

  return (
    <div className={cn("rounded-2xl", className)}>
      <MarkdownToolbar
        textareaRef={textareaRef}
        onInsert={handleInsert}
        preview={preview}
        onTogglePreview={() => setPreview(!preview)}
        isAr={isAr}
      />
      {preview ? (
        <div
          dir={dir}
          className="min-h-[300px] rounded-b-2xl border border-border/40 bg-card p-5 prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-p:leading-relaxed"
        >
          <ReactMarkdown>{value || (isAr ? "*لا يوجد محتوى بعد*" : "*No content yet*")}</ReactMarkdown>
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          dir={dir}
          rows={minRows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="rounded-t-none rounded-b-2xl border-border/40 font-mono text-sm leading-relaxed resize-y min-h-[300px]"
        />
      )}
    </div>
  );
}
