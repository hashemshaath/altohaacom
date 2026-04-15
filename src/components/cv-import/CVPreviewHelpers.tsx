import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Edit3, X, CheckCircle2, Loader2, Languages, ChevronDown, ChevronRight,
} from "lucide-react";
import { getFlag } from "./types";

// ─── Format helpers ───
export const formatDate = (d?: string) => {
  if (!d) return "";
  const norm = normalizeDate(d);
  if (!norm) return d;
  try { return new Date(norm).toLocaleDateString("en-US", { year: "numeric", month: "short" }); } catch { return d; }
};

export const normalizeDate = (d?: string | null): string | null => {
  if (!d) return null;
  const s = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return null;
};

export const rowBg = (i: number) => i % 2 === 0 ? "bg-muted/20" : "bg-muted/50";

// ─── Translate Button ───
export const TranslateBtn = ({ onClick, loading, small }: { onClick: () => void; loading: boolean; small?: boolean }) => (
  <Button
    variant="ghost" size="icon"
    className={`${small ? "h-5 w-5" : "h-6 w-6"} shrink-0 text-primary hover:text-primary/80`}
    onClick={onClick} disabled={loading}
    title="🔤 Smart Translate"
  >
    {loading ? <Loader2 className={`${small ? "h-3 w-3" : "h-3.5 w-3.5"} animate-spin`} /> : <Languages className={`${small ? "h-3 w-3" : "h-3.5 w-3.5"}`} />}
  </Button>
);

// ─── Location display ───
export const LocationDisplay = ({ city, countryCode }: { city?: string; countryCode?: string }) => {
  if (!city && !countryCode) return null;
  const flag = getFlag(countryCode);
  const parts = [city, countryCode?.toUpperCase()].filter(Boolean).join(", ");
  return (
    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
      {flag && <span>{flag}</span>}{parts}
    </span>
  );
};

// ─── Inline editable field ───
export function EditableText({ value, onChange, label, multiline, className = "" }: {
  value: string; onChange: (v: string) => void; label?: string; multiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    const save = () => { onChange(draft); setEditing(false); };
    const cancel = () => { setDraft(value); setEditing(false); };
    return (
      <div className="flex items-start gap-1">
        {multiline ? (
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="text-xs min-h-[60px]" dir="auto" autoFocus onKeyDown={e => e.key === "Escape" && cancel()} />
        ) : (
          <Input value={draft} onChange={e => setDraft(e.target.value)} className="text-xs h-7" dir="auto" autoFocus onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }} />
        )}
        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={save}><CheckCircle2 className="h-3 w-3 text-chart-2" /></Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={cancel}><X className="h-3 w-3" /></Button>
      </div>
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group/edit inline-flex items-center gap-1 ${className}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title={label || "Click to edit"}
    >
      {value || <span className="text-muted-foreground/50 italic text-xs">—</span>}
      <Edit3 className="h-2.5 w-2.5 opacity-0 group-hover/edit:opacity-50 shrink-0" />
    </span>
  );
}

// ─── Collapsible Section Wrapper ───
export const CollapsibleSection = React.forwardRef<HTMLDivElement, {
  icon: React.ReactNode; titleEn: string; titleAr: string;
  count: number; sectionKey: string; colorClass: string;
  isAr: boolean; checked: boolean; onToggle: () => void;
  defaultOpen?: boolean; extraActions?: React.ReactNode;
  children: React.ReactNode;
}>(function CollapsibleSection({
  icon, titleEn, titleAr, count, sectionKey, colorClass, isAr, checked, onToggle,
  defaultOpen = false, extraActions, children,
}, ref) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card ref={ref} className="overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className={`pb-2 ${colorClass.replace("text-", "bg-").split(" ")[0]}/5`}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${colorClass}`}>{icon}</div>
                <span className="text-sm font-semibold">{isAr ? titleAr : titleEn}</span>
                <Badge variant="secondary" className="text-xs h-5">{count}</Badge>
                {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1.5">
              {extraActions}
              <Checkbox checked={checked} onCheckedChange={onToggle} />
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

// ─── Paired personal field definitions ───
export type PersonalFieldDef = [string, string, string, string | null];

export const PAIRED_PERSONAL_FIELDS: PersonalFieldDef[] = [
  ["full_name", "Name", "الاسم", "full_name_ar"],
  ["full_name_ar", "Name (AR)", "الاسم بالعربية", "full_name"],
  ["job_title", "Job Title", "المسمى الوظيفي", "job_title_ar"],
  ["job_title_ar", "Job Title (AR)", "المسمى (عربي)", "job_title"],
  ["specialization", "Specialization", "التخصص", "specialization_ar"],
  ["specialization_ar", "Specialization (AR)", "التخصص (عربي)", "specialization"],
  ["phone", "Phone", "الهاتف", null],
  ["email", "Email", "البريد", null],
  ["nationality", "Nationality", "الجنسية", null],
  ["city", "City", "المدينة", null],
  ["country_code", "Country", "الدولة", null],
  ["national_address", "National Address", "العنوان الوطني", null],
  ["years_of_experience", "Years of Exp.", "سنوات الخبرة", null],
  ["linkedin", "LinkedIn", "LinkedIn", null],
  ["instagram", "Instagram", "Instagram", null],
  ["website", "Website", "الموقع", null],
];
