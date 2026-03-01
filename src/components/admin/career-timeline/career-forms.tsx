import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EntitySelector } from "@/components/admin/EntitySelector";
import { FlexibleDateInput } from "@/components/ui/flexible-date-input";
import {
  GraduationCap, Briefcase, Trophy, Medal, Users, X, Check, Scale, Tv, CalendarCheck,
} from "lucide-react";
import { FormActions, BilingualFieldPair } from "./shared-ui";
import {
  EDUCATION_LEVELS, EMPLOYMENT_TYPES, MEMBERSHIP_TYPES, CERTIFICATE_TYPES,
  COMPETITION_ROLES, JUDGING_POSITIONS, MEDAL_TYPES, COUNTRIES, formatDateShort,
} from "./constants";

// ── Career Form (Education / Work / Judging / Media / Organizing / Custom) ──

export function CareerForm({ form, editingId, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; editingId: string | null; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  const rt = form.record_type;
  const isEdu = rt === "education";
  const isWork = rt === "work";
  const isJudging = rt === "judging";
  const isMedia = rt === "media";
  const isOrganizing = rt === "organizing";

  const formTitle = editingId
    ? (isAr ? "تعديل" : "Edit")
    : isEdu ? (isAr ? "إضافة تعليم" : "Add Education")
    : isWork ? (isAr ? "إضافة خبرة" : "Add Experience")
    : isJudging ? (isAr ? "إضافة تحكيم" : "Add Judging")
    : isMedia ? (isAr ? "إضافة مقابلة تلفزيونية" : "Add TV Interview")
    : isOrganizing ? (isAr ? "إضافة فعالية منظمة" : "Add Organized Event")
    : (isAr ? "إضافة عنصر" : "Add Item");

  const FormIcon = isEdu ? GraduationCap : isJudging ? Scale : isMedia ? Tv : isOrganizing ? CalendarCheck : Briefcase;
  const iconClass = isEdu ? "bg-chart-2/15 text-chart-2" : isJudging ? "bg-amber-500/15 text-amber-600" : isMedia ? "bg-blue-500/15 text-blue-600" : isOrganizing ? "bg-green-500/15 text-green-600" : "bg-chart-3/15 text-chart-3";

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${iconClass}`}>
            <FormIcon className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold">{formTitle}</h4>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Organization / Entity */}
      <EntitySelector value={form.entity_id} entityName={form.entity_name}
        onChange={(id, name) => { onUpdate("entity_id", id); onUpdate("entity_name", name); }}
        label={isEdu ? (isAr ? "المؤسسة التعليمية" : "Institution")
          : isJudging ? (isAr ? "المسابقة / المعرض" : "Competition / Exhibition")
          : isMedia ? (isAr ? "اسم القناة" : "Channel Name")
          : isOrganizing ? (isAr ? "اسم الفعالية / المسابقة" : "Event / Competition Name")
          : (isAr ? "جهة العمل" : "Organization")} />

      {/* Title bilingual */}
      <BilingualFieldPair
        labelEn={isEdu ? "Degree / Specialization" : isJudging ? "Competition Name" : isMedia ? "Program Name" : isOrganizing ? "Specialization / Role" : "Job Title"}
        labelAr={isEdu ? "الدرجة / التخصص" : isJudging ? "اسم المسابقة" : isMedia ? "اسم البرنامج" : isOrganizing ? "التخصص / الدور" : "المسمى الوظيفي"}
        valueEn={form.title} valueAr={form.title_ar}
        onChangeEn={(v) => onUpdate("title", v)} onChangeAr={(v) => onUpdate("title_ar", v)}
        isAr={isAr} required
      />

      {/* Section-specific fields */}
      {isEdu && (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المستوى" : "Level"}</Label>
            <Select value={form.education_level} onValueChange={(v) => onUpdate("education_level", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
              <SelectContent>{EDUCATION_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{isAr ? l.ar : l.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "التخصص" : "Field of Study"}</Label>
            <Input value={form.field_of_study} onChange={(e) => onUpdate("field_of_study", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "الطهي" : "Culinary Arts"} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المعدل" : "GPA"}</Label>
            <Input value={form.grade} onChange={(e) => onUpdate("grade", e.target.value)} className="h-8 text-xs" placeholder="4.0" />
          </div>
        </div>
      )}

      {isWork && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "نوع التوظيف" : "Employment Type"}</Label>
            <Select value={form.employment_type} onValueChange={(v) => onUpdate("employment_type", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
              <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <BilingualFieldPair
            labelEn="Department" labelAr="القسم"
            valueEn={form.department} valueAr={form.department_ar}
            onChangeEn={(v) => onUpdate("department", v)} onChangeAr={(v) => onUpdate("department_ar", v)}
            isAr={isAr}
          />
        </div>
      )}

      {isJudging && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "منصب التحكيم" : "Judging Position"}</Label>
            <Select value={form.employment_type || "judge"} onValueChange={(v) => onUpdate("employment_type", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{JUDGING_POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{isAr ? p.ar : p.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <EntitySelector value={null} entityName={form.department || ""}
            onChange={(_, name) => onUpdate("department", name)}
            label={isAr ? "الجمعية المعتمدة" : "Associated Organization"} />
        </div>
      )}

      {isMedia && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المقدم / المحاور" : "Host / Interviewer"}</Label>
              <Input value={form.department} onChange={(e) => onUpdate("department", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "اسم المقدم" : "Host name"} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الضيف" : "Guest"}</Label>
              <Input value={form.field_of_study} onChange={(e) => onUpdate("field_of_study", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "اسم الضيف" : "Guest name"} />
            </div>
          </div>
          <BilingualFieldPair
            labelEn="Episode / Topic" labelAr="الحلقة / الموضوع"
            valueEn={form.description} valueAr={form.description_ar}
            onChangeEn={(v) => onUpdate("description", v)} onChangeAr={(v) => onUpdate("description_ar", v)}
            isAr={isAr}
          />
        </>
      )}

      {isOrganizing && (
        <BilingualFieldPair
          labelEn="Description (organizer & beneficiaries)" labelAr="الوصف (المنظم والمستفيدون)"
          valueEn={form.description} valueAr={form.description_ar}
          onChangeEn={(v) => onUpdate("description", v)} onChangeAr={(v) => onUpdate("description_ar", v)}
          isAr={isAr}
        />
      )}

      {/* Location: city + country */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المدينة" : "City"}</Label>
          <Input value={form.location} onChange={(e) => onUpdate("location", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "الرياض" : "Riyadh"} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الدولة" : "Country"}</Label>
          <Select value={form.country_code} onValueChange={(v) => onUpdate("country_code", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر الدولة" : "Select country"} /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {isAr ? c.ar : c.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Date section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-muted/40">
            <Switch checked={!form.is_current && !!form.end_date || form.is_current} onCheckedChange={(v) => {
              if (!v) { onUpdate("end_date", ""); onUpdate("is_current", false); }
            }} className="scale-90" id="date-range-toggle" />
            <Label htmlFor="date-range-toggle" className="text-[11px] font-medium cursor-pointer">
              {isAr ? "فترة (من - إلى)" : "Date range (From - To)"}
            </Label>
          </div>
          {(!!form.end_date || form.is_current) && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-muted/40">
              <Switch checked={form.is_current} onCheckedChange={(v) => { onUpdate("is_current", v); if (v) onUpdate("end_date", ""); }} className="scale-90" id="is-current-toggle" />
              <Label htmlFor="is-current-toggle" className="text-[11px] font-medium cursor-pointer">
                {isAr ? "لا يزال مستمراً" : "Still ongoing"}
              </Label>
            </div>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 items-end">
          <FlexibleDateInput value={form.start_date} onChange={(v) => onUpdate("start_date", v)}
            label={(!!form.end_date || form.is_current) ? (isAr ? "من" : "From") : (isAr ? "التاريخ" : "Date")} isAr={isAr} />
          {(!!form.end_date || form.is_current) && !form.is_current && (
            <FlexibleDateInput value={form.end_date} onChange={(v) => onUpdate("end_date", v)}
              label={isAr ? "إلى" : "To"} isAr={isAr} />
          )}
        </div>
      </div>

      {/* Description for work/edu/custom only */}
      {!isMedia && !isOrganizing && (isWork || isEdu || (!isJudging)) && (
        <BilingualFieldPair
          labelEn="Description / Notes" labelAr="الوصف / ملاحظات"
          valueEn={form.description} valueAr={form.description_ar}
          onChangeEn={(v) => onUpdate("description", v)} onChangeAr={(v) => onUpdate("description_ar", v)}
          isAr={isAr}
        />
      )}

      <FormActions isAr={isAr} isPending={isPending} editingId={editingId} canSave={!!form.title.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

// ── Membership Form ──────────────────────────────────────

export function MembershipForm({ form, isAr, isPending, editingId, onUpdate, onSave, onCancel }: {
  form: any; isAr: boolean; isPending: boolean; editingId?: string | null;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold">{editingId ? (isAr ? "تعديل العضوية" : "Edit Membership") : (isAr ? "إضافة عضوية" : "Add Membership")}</h4>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <EntitySelector value={form.entity_id} entityName=""
        onChange={(id, name) => onUpdate("entity_id", id)}
        label={isAr ? "المنظمة / الجمعية" : "Organization / Association"} />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "نوع العضوية" : "Type"}</Label>
          <Select value={form.membership_type} onValueChange={(v) => onUpdate("membership_type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
            <SelectContent>{MEMBERSHIP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <FlexibleDateInput value={form.enrollment_date} onChange={(v) => onUpdate("enrollment_date", v)}
          label={isAr ? "تاريخ الانتساب" : "Enrollment"} isAr={isAr} />
      </div>

      <BilingualFieldPair
        labelEn="Title / Position" labelAr="المسمى / المنصب"
        valueEn={form.title} valueAr={form.title_ar}
        onChangeEn={(v) => onUpdate("title", v)} onChangeAr={(v) => onUpdate("title_ar", v)}
        isAr={isAr}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المدينة" : "City"}</Label>
          <Input value={form.notes?.split("|")[0] || ""} onChange={(e) => {
            const parts = (form.notes || "").split("|");
            parts[0] = e.target.value;
            onUpdate("notes", parts.join("|"));
          }} className="h-8 text-xs" placeholder={isAr ? "الرياض" : "Riyadh"} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الدولة" : "Country"}</Label>
          <Input value={form.notes?.split("|")[1] || ""} onChange={(e) => {
            const parts = (form.notes || "").split("|");
            while (parts.length < 2) parts.push("");
            parts[1] = e.target.value;
            onUpdate("notes", parts.join("|"));
          }} className="h-8 text-xs" placeholder={isAr ? "السعودية" : "Saudi Arabia"} />
        </div>
      </div>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!form.entity_id} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

// ── Competition Add Form ──────────────────────────────────────

export function CompetitionAddForm({ competitions, selectedId, onSelect, isAr, isPendingLink, onSaveLink,
  careerForm, onUpdateCareer, isPendingManual, onSaveManual, onCancel }: {
  competitions: any[]; selectedId: string; onSelect: (id: string) => void;
  isAr: boolean; isPendingLink: boolean; onSaveLink: () => void;
  careerForm: any; onUpdateCareer: (key: string, value: any) => void;
  isPendingManual: boolean; onSaveManual: () => void; onCancel: () => void;
}) {
  const [mode, setMode] = useState<"link" | "manual">("link");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return competitions.slice(0, 10);
    const q = search.toLowerCase();
    return competitions.filter(c => c.title?.toLowerCase().includes(q) || c.title_ar?.toLowerCase().includes(q));
  }, [competitions, search]);

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold">{isAr ? "إضافة مسابقة / فعالية" : "Add Competition / Event"}</h4>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-0.5 rounded-xl bg-muted/40">
        <button type="button" onClick={() => setMode("link")}
          className={`flex-1 text-[11px] font-medium py-1.5 px-3 rounded-md transition-all ${mode === "link" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {isAr ? "🔗 ربط بمسابقة موجودة" : "🔗 Link Existing"}
        </button>
        <button type="button" onClick={() => setMode("manual")}
          className={`flex-1 text-[11px] font-medium py-1.5 px-3 rounded-md transition-all ${mode === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {isAr ? "✏️ إضافة يدوية" : "✏️ Add Manually"}
        </button>
      </div>

      {mode === "link" ? (
        <>
          <Input placeholder={isAr ? "🔍 بحث في المسابقات..." : "🔍 Search competitions..."}
            value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs" />
          <div className="max-h-44 overflow-y-auto space-y-0.5 rounded-xl border border-border/30 bg-muted/10 p-1.5">
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا توجد نتائج — جرّب الإضافة اليدوية" : "No results — try adding manually"}</p>}
            {filtered.map(c => (
              <button key={c.id} onClick={() => onSelect(c.id)}
                className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-start transition-all text-xs ${selectedId === c.id ? "bg-primary/10 border border-primary/30 text-primary" : "hover:bg-muted/50 border border-transparent"}`}>
                <Trophy className="h-3.5 w-3.5 shrink-0 text-chart-4" />
                <p className="flex-1 min-w-0 truncate font-medium">{isAr ? (c.title_ar || c.title) : c.title}</p>
                {c.competition_start && <span className="text-[10px] text-muted-foreground shrink-0">{formatDateShort(c.competition_start, isAr)}</span>}
                {selectedId === c.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
          <FormActions isAr={isAr} isPending={isPendingLink} canSave={!!selectedId} onSave={onSaveLink} onCancel={onCancel} />
        </>
      ) : (
        <CompetitionEventForm form={careerForm} editingId={null} isAr={isAr}
          isPending={isPendingManual} onUpdate={onUpdateCareer}
          onSave={onSaveManual} onCancel={onCancel} />
      )}
    </div>
  );
}

// ── Competition Event Form (manual) ──────────────────────────────────────

export function CompetitionEventForm({ form, editingId, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; editingId: string | null; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className={editingId ? "rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200" : "space-y-3"}>
      {editingId && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-xs font-bold">{isAr ? "تعديل" : "Edit"}</h4>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      <BilingualFieldPair
        labelEn="Competition Name" labelAr="اسم المسابقة"
        valueEn={form.title} valueAr={form.title_ar}
        onChangeEn={(v) => onUpdate("title", v)} onChangeAr={(v) => onUpdate("title_ar", v)}
        isAr={isAr} required
      />

      <EntitySelector value={form.entity_id} entityName={form.entity_name}
        onChange={(id, name) => { onUpdate("entity_id", id); onUpdate("entity_name", name); }}
        label={isAr ? "الجهة المنظمة" : "Organizer"} />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الدور" : "Role"}</Label>
          <Select value={form.employment_type || "participant"} onValueChange={(v) => onUpdate("employment_type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{COMPETITION_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الميدالية / الإنجاز" : "Medal / Achievement"}</Label>
          <Select value={form.grade || ""} onValueChange={(v) => onUpdate("grade", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
            <SelectContent>{MEDAL_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{isAr ? m.ar : m.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المدينة" : "City"}</Label>
          <Input value={form.location} onChange={(e) => onUpdate("location", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "الرياض" : "Riyadh"} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الدولة" : "Country"}</Label>
          <Select value={form.country_code || ""} onValueChange={(v) => onUpdate("country_code", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {isAr ? c.ar : c.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <FlexibleDateInput value={form.start_date} onChange={(v) => onUpdate("start_date", v)}
        label={isAr ? "التاريخ" : "Date"} isAr={isAr} />

      <BilingualFieldPair
        labelEn="Description" labelAr="الوصف"
        valueEn={form.description} valueAr={form.description_ar}
        onChangeEn={(v) => onUpdate("description", v)} onChangeAr={(v) => onUpdate("description_ar", v)}
        isAr={isAr}
      />

      <FormActions isAr={isAr} isPending={isPending} editingId={editingId} canSave={!!form.title.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

// ── Award Form ──────────────────────────────────────

export function AwardAddForm({ form, isAr, isPending, editingId, onUpdate, onSave, onCancel }: {
  form: any; isAr: boolean; isPending: boolean; editingId?: string | null;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
            <Medal className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold">{editingId ? (isAr ? "تعديل الجائزة" : "Edit Award") : (isAr ? "إضافة جائزة" : "Add Award")}</h4>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <BilingualFieldPair
        labelEn="Event Name" labelAr="اسم الحدث"
        valueEn={form.event_name} valueAr={form.event_name_ar}
        onChangeEn={(v) => onUpdate("event_name", v)} onChangeAr={(v) => onUpdate("event_name_ar", v)}
        isAr={isAr} required
      />

      <BilingualFieldPair
        labelEn="Achievement" labelAr="الإنجاز"
        valueEn={form.achievement} valueAr={form.achievement_ar}
        onChangeEn={(v) => onUpdate("achievement", v)} onChangeAr={(v) => onUpdate("achievement_ar", v)}
        isAr={isAr}
        placeholderEn="Gold Medal" placeholderAr="ميدالية ذهبية"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "النوع" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => onUpdate("type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
            <SelectContent>{CERTIFICATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <FlexibleDateInput value={form.event_date} onChange={(v) => onUpdate("event_date", v)}
          label={isAr ? "التاريخ" : "Date"} isAr={isAr} eventMode />
      </div>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!form.event_name.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
