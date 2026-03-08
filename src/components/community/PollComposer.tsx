import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PollComposerProps {
  onPollChange: (poll: { options: string[] } | null) => void;
}

export const PollComposer = memo(function PollComposer({ onPollChange }: PollComposerProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [active, setActive] = useState(false);
  const [options, setOptions] = useState(["", ""]);

  const handleToggle = () => {
    if (active) {
      setActive(false);
      setOptions(["", ""]);
      onPollChange(null);
    } else {
      setActive(true);
    }
  };

  const updateOption = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
    const valid = next.filter((o) => o.trim());
    onPollChange(valid.length >= 2 ? { options: next } : null);
  };

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== idx);
    setOptions(next);
    const valid = next.filter((o) => o.trim());
    onPollChange(valid.length >= 2 ? { options: next } : null);
  };

  if (!active) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-primary"
        onClick={handleToggle}
        title={isAr ? "إضافة استطلاع" : "Add poll"}
      >
        <BarChart3 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          {isAr ? "استطلاع رأي" : "Poll"}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleToggle}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            placeholder={isAr ? `الخيار ${idx + 1}` : `Option ${idx + 1}`}
            value={opt}
            onChange={(e) => updateOption(idx, e.target.value)}
            className="h-8 text-sm"
            maxLength={80}
          />
          {options.length > 2 && (
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 rounded-full" onClick={() => removeOption(idx)}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {options.length < 4 && (
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary" onClick={addOption}>
          <Plus className="h-3 w-3" />
          {isAr ? "إضافة خيار" : "Add option"}
        </Button>
      )}
    </div>
  );
}
